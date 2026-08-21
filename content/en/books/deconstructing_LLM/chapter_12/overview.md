---
published: 2026-08-12
updated: 2026-08-12
---

# Chapter 12: Reinforcement Learning—Evolving Through Dynamic Interaction

> Life is what happens to us while we are making other plans.
>
> —Allen Saunders

Beginning with [Chapter 3](/books/deconstructing_LLM/chapter-3), we examined models ranging from simple to complex. Although their architectures and performance differ substantially, they are trained and applied in similar ways: training data must be collected and prepared in advance, and the model must be fully trained and optimized before use. To use a perhaps exaggerated but vivid analogy, producing a model resembles gestating a baby in the womb. This artificial form of “life” remains relatively fragile and unable to interact deeply with the outside world, so a comparatively closed environment is needed for the model to grow. Further evolution depends on continually adapting to new environments and meeting new challenges. Model training must likewise enter a new stage, exposing the model to the real world so that it can learn and grow through continuous interaction.

This chapter discusses reinforcement learning (RL). Reinforcement learning is not a new model architecture but an entirely new way to train models[^12-overview-1]. Its central concern is how to train a model in an uncertain environment, before all training data has been collected. To handle this uncertainty, reinforcement learning uses a distinctive strategy: it begins using a model to assist its own training before the model is fully ready. The method resembles how humans learn in real life—for example, improving at riding a bicycle through repeated attempts and practice.

Reinforcement learning is broad enough to constitute a complete discipline. Handling uncertain environments involves extensive probabilistic analysis and complex mathematical derivations. A full treatment would require a book as long as this one, so this chapter does not attempt to cover every aspect[^12-overview-2]. Instead, it follows the technical path of large language models. Specifically, following ChatGPT's approach, we examine how to optimize a model with proximal policy optimization (PPO). ChatGPT's optimization techniques are near the cutting edge of reinforcement learning, so the chapter covers most of the field's key concepts. Its order and emphasis differ from those of similar books: it draws more heavily on ideas from conventional learning to make reinforcement learning easier to understand. Readers should nevertheless be familiar with the preceding chapters.

[^12-overview-1]: This new mode of training is not a new parameter-estimation algorithm but a new way to manage the training cycle. It resembles transfer learning, discussed in [Chapter 10](/books/deconstructing_LLM/chapter-10) and [Chapter 11](/books/deconstructing_LLM/chapter-11), and readers can use that analogy to understand the new idea.
[^12-overview-2]: Some background topics relevant to specific reinforcement-learning algorithms are not covered in full. The corresponding footnotes identify these omissions to give readers a more comprehensive understanding of this broad field.
