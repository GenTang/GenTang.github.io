---
published: 2026-08-12
updated: 2026-08-12
---

# Chapter 10: Recurrent Neural Networks—Trying to Understand Human Language

> Language is the house of being. In its home man dwells.
>
> —Martin Heidegger

[Chapter 8](/books/deconstructing_LLM/chapter-8) and [Chapter 9](/books/deconstructing_LLM/chapter-9) examined multilayer perceptrons and convolutional neural networks in depth. Despite their substantial structural differences, both types of model share a fundamental assumption from the perspective of data processing[^10-overview-1]: individual observations are independent, and the model considers only the relationship between the current observation's features and label. Models of this type are generally called vanilla neural networks.

Convolutional neural networks, for example, are often used for image recognition. In this application, each image is recognized independently; the model does not consider possible relationships among images. In addition to image recognition, convolutional neural networks can be applied to text classification, as discussed in [Section 9.2.6](/books/deconstructing_LLM/chapter-9/9-2#section-9-2-6). They can perform sentiment analysis on sentences, for instance, classifying the expressed sentiment as positive—“The Chinese team came from behind to win in overtime”—or negative—“My tears would not stop falling.” Here again, the model processes each sentence independently without considering dependencies among them.

Not all data satisfy this independence assumption. In sentence-level sentiment analysis, for example, if the sentences being classified come from the same article, understanding any one of them requires considering the information provided by its context because the same sentence can convey different emotions in different contexts. Consider the passage, “The Chinese team came from behind to win in overtime. My tears would not stop falling.” Here, the second sentence expresses positive sentiment. Data whose elements depend on one another are called sequential data, or sequence data. Typical examples include financial-market prices, which form time series; text, which forms character or word sequences; and video, which forms image sequences.

Vanilla neural networks generally perform poorly on sequential data because their architecture limits their ability to learn dependencies. Clever designs can enhance this capability, but the resulting improvements are often limited and may introduce other modeling problems. [Section 10.2](/books/deconstructing_LLM/chapter-10/10-2) uses a concrete example to examine in detail how vanilla neural networks can learn sequential data and discusses the advantages and disadvantages of this approach.

Recurrent neural networks (RNNs) were introduced to overcome the shortcomings of vanilla neural networks on sequential data. This new architecture has produced remarkable results in many settings, and its performance in natural language processing (NLP) has often exceeded expectations. Indeed, the large language models that have astonished—and even somewhat frightened—the world are built on recurrent neural networks. Beginning with this chapter, we will focus on natural language processing and recurrent neural networks, examining how to enable this new class of intelligent systems to understand human language and acquire the knowledge encoded within it.

[^10-overview-1]: Many classic models besides neural networks, including linear and logistic regression, adopt the same assumption.
