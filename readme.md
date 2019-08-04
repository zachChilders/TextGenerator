# W207 Final - Text Generation

Aaron, Matt, Zach

## Concept

By leveraging features of Recurrent Neural Networks, we are able to generate arbitrary text based on a large corpus of input text.  In the course of this project,
we have acheived the following goals:

- Build a Recurrent Neural Network capable of learning and predicting text

- Tune parameters of the Neural Network to produce feasible text

- Obtain a source of news data to train on.

## Recurrent Neural Networks

Recurrent Neural Networks are arranged in such a way that they have a temporal sequence between nodes.  This additional state allows it to learn from previous inputs, even after training.  RNNs are commonly used for text generation, but can take a long time to train.

Our Recurrent Neural Network is implemented in Keras on top of Tensorflow.  We run in [LSTM Mode](https://en.wikipedia.org/wiki/Long_short-term_memory), which has additional state built into the neurons that allows for continously predicting the next character or n-gram based off of previous predictions.

## Walkthrough

We have 4 components to our system, which work together to form a data pipeline.

### mergetool

Our scraper saves articles as seperate documents.  In order to ease training, this tool loads all documents from our database and merges them into a single text file.  This text file is then saved locally so that the network can easily grab it and begin training.  This is written in Typescript.

### network

Our Recurrent Neural Network is largely based off of examples found in Google's Tensorflow documentation.  These examples have been productionalized to allow them to run in arbitrary environments outside of Jupyter notebooks.  We've also added the ability to better tune parameters passed to the network, as well as some features to allow checkpointing.

We implemented the model in Keras, which is a high level library that abstracts inner workings of Tensorflow away and allows for focus on network architecure instead of details like graph and session management.  We detect if you have a CUDA capable GPU, and will accelerate training if you do.  

Our binarize process is very simple - we simply turn each character into its ASCII representation.  This leaves us with a minimal set of discrete features, but a large training corpus.  This is important, because our LSTM model specifically analyzes statistical relationships between characters in our dataset.

### scraper

Our scraper is a very simple node server.  Every few seconds it visits a collection of new subreddits, downloads the posts in JSON form, and examines the link of each post.  It queries a MongoDB to see if its seen the link before, and if it hasn't it visits the page. It uses cheerio.js (a fork of JQuery) to grab every `<p>` tag on the page, concats them, and stores them as a document alongside their URL.  This server is packaged in Docker and deployed in an Azure App Service, where it runs 24/7 to mirror reddit to our database.

### site
