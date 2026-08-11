# Chapter 5: Insights from Econometrics—Learning from Other Fields

> Stones from other hills may serve to polish jade.
>
> — *The Book of Songs*, “Minor Odes of the Kingdom: The Cry of the Cranes”

Econometrics is an important branch of economics. Grounded in mathematical statistics, it provides empirical support for economic theories. It uses mathematical models to analyze real-world data and validate or refute existing economic theories. Like a ruler for economic research, econometrics advances inquiry from the qualitative to the quantitative. Linear regression ([Chapter 3](/books/deconstructing_LLM/chapter-3)) and logistic regression ([Chapter 4](/books/deconstructing_LLM/chapter-4)) are its core models.

The economist John Maynard Keynes[^keynes] once declared, with a touch of conceit, that the ideas of economists and political philosophers, whether right or wrong, are more powerful than is commonly understood. In fact, the world is ruled by little else. Practical people who believe themselves immune to intellectual influence are usually the slaves of some deceased economist. This statement clearly reveals the enormous influence of economic theory on the world. Ensuring the accuracy of such theory is therefore crucial.

As the primary tool for validating economic theories, econometrics places stringent demands on its core models. Although their structures are relatively simple, the discipline has accumulated many techniques for refining model details. These techniques mainly address two areas: processing features so that models can use them more effectively, which corresponds to feature engineering in artificial intelligence; and ensuring, as far as possible, that models are valid, stable, and interpretable.

The first area does not concern model structure and is therefore useful for all models. The second depends heavily on model structure: as the structure becomes more complex, the corresponding analysis becomes more difficult. As later chapters will explain, however, a complex model can usually be decomposed into a feature-extraction model followed by either a linear model for regression or a logistic regression model for classification. In other words, the outermost layer of a complex model is itself one of the core models of econometrics.

Drawing on econometric methods can therefore help evaluate the validity and stability of an entire complex model while also providing some degree of interpretability. Although this approach has certain theoretical limitations, it remains a viable solution.

This chapter is relatively self-contained and focuses on practical details. Readers who are not interested in these details may skip it for now. Although the chapter introduces no new model structure, its material is essential in most modeling settings. For readers who hope to succeed in practical modeling tasks, the knowledge and techniques discussed here will be indispensable tools.

[^keynes]: John Maynard Keynes was a British economist. In contrast to traditional laissez-faire economics, Keynes argued that governments should actively steer the economy and use fiscal and monetary policy to counter recessions and even depressions. This proposal became an effective response to the worldwide depression of the 1920s and 1930s and provided the theoretical foundation for the economic policies adopted by many capitalist countries during their prosperity in the 1950s and 1960s. Keynes was therefore acclaimed as the “savior” of capitalism. His theories, known as Keynesian economics, remain highly influential today (adapted from Wikipedia). The passage in the main text comes from *The General Theory of Employment, Interest, and Money*.
