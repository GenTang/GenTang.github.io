---
published: 2026-08-11
updated: 2026-08-12
---

# Chapter 6: Optimization Algorithms—Parameter Estimation

> Ideas are cheap; execution is everything.
>
> — Chris Sacca

As the preceding chapters discussed, model construction begins with a preliminary analysis of the data in the context of the intended application, from which we develop ideas and intuition. Next, mathematical abstraction and transformation help us select a suitable model architecture for the problem. Finally, an open-source Python library implements the resulting model and estimates its parameters.

From the perspective of software design, open-source Python algorithm libraries excel at abstraction. They effectively hide the low-level implementation details of model construction and training, allowing us to focus on high-level concepts and operations exposed through a set of application programming interfaces (APIs). These interfaces usually make it possible to build and train a model with only a few dozen lines of code.

During this process, we need not devote much attention to the complex mathematical calculations behind the model, and the implementation used to estimate model parameters no longer presents an obstacle. Ideally, all low-level complexity is perfectly abstracted away, making the data scientist's work easier. The other side of the coin, of course, is that this may lower the barrier to becoming a data scientist and consequently affect the availability and compensation of related roles.

Unfortunately—or perhaps fortunately—the mathematical abstractions and computations involved in models are so complex that even excellent software design and abstraction cannot conceal them completely. Some details inevitably leak through and affect how users understand and operate the system. This phenomenon is known as a leaky abstraction.

For example, when a logistic regression model is trained on certain datasets, an open-source algorithm library may report an error and fail to estimate the model parameters. Leaky abstractions arise less often with relatively conventional or simple models. With more complex neural network models, however—such as deep learning systems and large language models—many such problems may occur.

Without understanding the underlying implementation details, it is nearly impossible to work effectively in these fields. In theory, failure to grasp the essence of a model makes it difficult to optimize the model effectively and achieve the expected results. In practice, program errors become difficult to fix, training takes too long, algorithm libraries are hard to use flexibly beyond their example implementations, and the model architecture cannot be adapted to specific requirements.

This chapter therefore examines the core details of open-source algorithm libraries and explores how a model's parameters are estimated from its mathematical formulation. In more academic terms, it studies algorithms for solving optimization problems. Many methods can solve such problems; different algorithms suit different models and offer distinct advantages for different types of problems. Given the limits of space, this chapter focuses on the most fundamental and widely used approaches: gradient descent, stochastic gradient descent, and their variants.

This material may be relatively difficult, especially for readers with limited programming experience. Mastering the core of a discipline is rarely easy. Readers interested in neural networks are encouraged to revisit the chapter until they understand it fully. For other machine learning models—or statistical models—the chapter is relatively self-contained, and skipping it will not impede an understanding of the models themselves. Readers who are not interested in the topic may therefore skip it for now and continue with the other chapters.
