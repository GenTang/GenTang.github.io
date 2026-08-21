---
published: 2026-08-12
updated: 2026-08-12
---

# Chapter 9: Convolutional Neural Networks—The ‘Exodus’ of Deep Learning

> Veni, vidi, vici.
>
> (I came, I saw, I conquered.)
>
> —Gaius Julius Caesar

[Chapter 8](/books/deconstructing_LLM/chapter-8) provided an in-depth exploration of the classic multilayer perceptron. This model demonstrates remarkable versatility in solving classification problems. In practice, multilayer perceptrons usually deliver satisfactory performance on datasets that already have good feature representations. For such data, however, other machine-learning models can also provide excellent predictive performance. Neural networks offer no additional improvement and may instead sacrifice interpretability. Neural networks therefore need to demonstrate their unique value when the inputs cannot readily be represented as feature vectors.

High-quality feature representations are relatively rare in real life. Consider image recognition: we can digitize an image, but constructing an effective feature vector from it is a complex task. We do not know exactly how the human visual system performs this seemingly simple operation, nor do we fully understand which factors in an image influence perception. Consequently, although computers can perform tasks that appear complex and tedious, such as computing the gradient of a complicated loss function, they struggle with the seemingly simple task of image recognition.

As discussed in [Section 8.3.5](/books/deconstructing_LLM/chapter-8/8-3#section-8-3-5), the hidden layers of a neural network can be viewed as tools that automatically extract features from data. Can this automatic feature-extraction capability match or surpass human ability? In other words, when humans cannot extract features effectively, can we use the properties of neural networks to extract features automatically and complete a modeling task? The answer is yes. This is the central question explored in this chapter. The sections that follow explain in detail how neural networks can automatically extract image features and thereby give computers the ability to see.

The convolutional neural network (CNN) discussed in this chapter is a major milestone in deep learning. It demonstrated the potential of deep learning: increasing network depth can produce astonishing gains in model performance. As early adopters of this approach, the model's authors trained it on GPUs rather than conventional CPUs, greatly increasing computational speed. This success encouraged the widespread adoption of GPUs for neural networks, made it possible to train deep neural networks, and accelerated the development of deep learning.

It is no exaggeration to say that convolutional neural networks ushered in the era of deep learning, bringing artificial intelligence represented by deep learning out of the laboratory and into the real world. In an extraordinarily short time, AI surpassed human performance on task after task. These famous words capture that rapid ascent: “I came, I saw, I conquered.”
