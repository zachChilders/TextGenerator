from __future__ import absolute_import, division, print_function

import tensorflow as tf

import numpy as np
import os
import time

EPOCHS = 400

BATCH_SIZE = 64
BUFFER_SIZE = 10000
SEQ_LENGTH = 100

EMBEDDING_DIM = 256
RNN_UNITS = 1024

TEMPERATURE = 0.5

CHECKPOINT_DIR = './training_checkpoints'
CHECKPOINT_PREFIX= os.path.join(CHECKPOINT_DIR, "ckpt_{epoch}")

def generate_text(model, start_string, char_index, index):
  # Evaluation step (generating text using the learned model)

  # Number of characters to generate
  num_generate = 1000

  # Converting our start string to numbers (vectorizing)
  input_eval = [char_index[s] for s in start_string]
  input_eval = tf.expand_dims(input_eval, 0)

  # Empty string to store our results
  text_generated = []

  # Low temperatures results in more predictable text.
  # Higher temperatures results in more surprising text.
  # Experiment to find the best setting.
  temperature = TEMPERATURE

  # Here batch size == 1
  model.reset_states()
  for i in range(num_generate):
      predictions = model(input_eval)
      # remove the batch dimension
      predictions = tf.squeeze(predictions, 0)

      # using a multinomial distribution to predict the word returned by the model
      predictions = predictions / temperature
      predicted_id = tf.multinomial(predictions, num_samples=1)[-1,0].numpy()
     
      # We pass the predicted word as the next input to the model
      # along with the previous hidden state
      input_eval = tf.expand_dims([predicted_id], 0)
     
      text_generated.append(index[predicted_id])

  return (start_string + ''.join(text_generated))

def split_input_target(chunk):
    input_text = chunk[:-1]
    target_text = chunk[1:]
    return input_text, target_text

def build_model(vocab_size, embedding_dim, rnn_units, batch_size):
  model = tf.keras.Sequential([
    tf.keras.layers.Embedding(vocab_size, embedding_dim, 
                              batch_input_shape=[batch_size, None]),
    rnn(rnn_units,
        return_sequences=True, 
        recurrent_initializer='glorot_uniform',
        stateful=True),
    tf.keras.layers.Dense(vocab_size)
  ])
  return model

def loss(labels, logits):
  return tf.keras.losses.sparse_categorical_crossentropy(labels, logits, from_logits=True)

# Enable eager execution
tf.enable_eager_execution()

# Get input data, currently shakespeare
path_to_file = tf.keras.utils.get_file('shakespeare.txt', 'https://storage.googleapis.com/download.tensorflow.org/data/shakespeare.txt')
text = open(path_to_file, 'rb').read().decode(encoding='utf-8')

# Define vocabulary, currently by character
vocab = sorted(set(text))

# Map vocabulary
character_to_index = {u:i for i, u in enumerate(vocab)}
index_to_character = np.array(vocab)

text_as_int = np.array([character_to_index[c] for c in text])

# Determine sequence length per epoch
examples_per_epoch = len(text) // SEQ_LENGTH

# Batch size 
steps_per_epoch = examples_per_epoch // BATCH_SIZE

# Make training examples 
char_dataset = tf.data.Dataset.from_tensor_slices(text_as_int)
sequences = char_dataset.batch(SEQ_LENGTH + 1, drop_remainder=True)

dataset = sequences.map(split_input_target)

# Build RNN
if tf.test.is_gpu_available():
  print("Using GPU")
  rnn = tf.keras.layers.CuDNNGRU
else:
  import functools
  rnn = functools.partial(
    tf.keras.layers.GRU, recurrent_activation='sigmoid')

# Load last checkpoint
latest_weight = tf.train.latest_checkpoint(CHECKPOINT_DIR)
if latest_weight:
    # Prep Data
    dataset = dataset.shuffle(BUFFER_SIZE).batch(1, drop_remainder=True)

    # Build Model
    model = build_model(len(vocab), EMBEDDING_DIM, RNN_UNITS, batch_size=1)
    model.load_weights(latest_weight)
    print(f"Resuming from {latest_weight.split('_')[-1]}")

# Fresh run
else:
    # Prep Data
    dataset = dataset.shuffle(BUFFER_SIZE).batch(BATCH_SIZE, drop_remainder=True)

    # Build Model
    model = build_model(
        vocab_size = len(vocab),
        embedding_dim=EMBEDDING_DIM,
        rnn_units=RNN_UNITS,
        batch_size=BATCH_SIZE)

# Compile model
model.compile(
    optimizer = tf.train.AdamOptimizer(),
    loss = loss)

# Define checkpoint callback
checkpoint_callback=tf.keras.callbacks.ModelCheckpoint(
    filepath=CHECKPOINT_PREFIX,
    save_weights_only=True)

# Train model
history = model.fit(dataset.repeat(),
    epochs=EPOCHS,
    initial_epoch = int(latest_weight.split('_')[-1]) if latest_weight else 0,
    steps_per_epoch=steps_per_epoch,
    callbacks=[checkpoint_callback])

print("Training Done")
#model.build(tf.TensorShape([1, None]))

print("Predicting")
# Generate the text
print(generate_text(model, u"ROMEO: ", character_to_index, index_to_character))
