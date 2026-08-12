---
published: 2026-08-12
updated: 2026-08-12
---

# Chapter 13: Other Classic Models—Broadening Our Perspective

> The more I learn, the more I realize how much I don't know.
>
> — Albert Einstein

Although neural networks receive enormous attention in artificial intelligence, they are not the field's only important models. Artificial intelligence encompasses many classic models, too many to introduce individually in detail. This chapter therefore examines several particularly illuminating models. Some are closely related to neural networks, while others work well in combination with them. They include decision trees and their derivatives, hidden Markov models, and unsupervised learning.

1. A decision tree is an intuitive and easy-to-understand model, as well as an outstanding example of the connectionist approach to modeling. In practice, decision trees are often combined with other models. They can extract important features, while their transparent structure can improve the interpretability of the overall model. Like neural networks, decision trees can also be ensembled with themselves to produce more powerful derivative models, including random forests and gradient-boosted decision trees.
2. Hidden Markov models were once enormously popular and found broad application in fields such as speech recognition and financial markets. In finance, the Medallion Fund, known as “the most profitable quantitative fund in history,” is said to have used hidden Markov models[^13-overview-1]. This model can be viewed as a special case of a recurrent neural network, which is why it is included in this chapter.
3. All models discussed previously, from simple linear regression to complex large language models, belong to supervised learning. In other words, they require labeled data. In practice, however, data may have no labels, in which case unsupervised learning models are needed. This chapter focuses on three types of unsupervised learning: clustering, dimensionality reduction, and singular value decomposition.

The topics in this chapter may appear somewhat self-contained. They are intended to broaden our perspective and help us understand the origins and meaning of certain techniques used in neural networks more deeply.

[^13-overview-1]: Although there is no conclusive evidence that the Medallion Fund actually used hidden Markov models, they are widely believed in the industry to have been a key to its success. After all, the fund's rise coincided with the time when the inventors of the hidden Markov model joined it.
