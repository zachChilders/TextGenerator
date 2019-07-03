# W207 Final - Text Generation

Aaron, Matt, Zach

## Concept

Neural Networks and other ML primitives are capable not just of recognizing data, but also generating it.  By training algorithms on various text corpuses, we can theoretically generate convincingly similar text. We have several potential approaches that we'd like to explore:

## Markov Models

Markov Models are built using a graph of states and the probabilities of transitions to neighboring states.  By building a Markov Model based off of neighboring words, we can seed it with a word in the corpus and then generate a new text that has some probability of making sense.

[Hidden Markov Models](https://en.wikipedia.org/wiki/Hidden_Markov_model)

[Sklearn Package](https://github.com/hmmlearn/hmmlearn)

## Recurrent Neural Networks

Recurrent Neural Networks are arranged in such a way that they have a temporal sequence between nodes.  This additional state allows it to learn from previous inputs, even after training. Additionally, modified nodes can be deployed in a mode called Long Short Term Memory which allows this behavior to be used quite effectively.  RNNs are commonly used for text generation, but can take a long time to train.

[Recurrent Neural Networks](https://en.wikipedia.org/wiki/Recurrent_neural_network)

[TensorFlow Tutorial](https://www.tensorflow.org/tutorials/sequences/recurrent)

## Generative Adversarial Networks

GANs are very topical as of right now due to their usage in deepfakes.  A GAN is composed of two distinct Neural Networks - one _generative_ network creating new examples and one _discriminative_ network grading if the example is real or generated.  After initial training, the generative network attempts to fool the discriminative network. Backpropagation is applied to ensure that as the generative generates better images, the discriminative gets better at classifying.  GANs exist as 

[Generative Adversarial Networks](https://en.wikipedia.org/wiki/Generative_adversarial_network)

[Tensorflow Tutorial](https://www.tensorflow.org/beta/tutorials/generative/dcgan)

