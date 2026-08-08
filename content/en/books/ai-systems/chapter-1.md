## Why begin with a question?

Technology writing often starts with an object: a model, an architecture, a product. But objects change quickly. Questions last longer. A useful book should therefore begin by identifying the class of problems that makes the technology meaningful.

For AI systems, the core question is not simply whether a machine can produce an answer. It is whether the system can form, test, and revise a useful representation of the world under uncertainty.

> A capable system is not one that is always right. It is one that knows how to become less wrong.

## Three layers of understanding

1. **Mechanism** — What computation is performed, and how?
2. **Behavior** — What does the system do across different situations?
3. **Purpose** — Which human problem does this behavior help solve?

Confusion appears when these layers are mixed. A larger context window is a mechanism. Remembering a user preference is a behavior. Reducing the cost of repeated explanation is a purpose.

## Learning as belief revision

One compact way to express learning is Bayesian updating. A prior belief becomes a posterior belief after encountering evidence:

$$
P(H\mid E)=\frac{P(E\mid H)P(H)}{P(E)}
$$

The equation is less important here than the discipline it suggests: state what you believe, observe what happened, and revise in proportion to the evidence.

```python
def update_belief(prior, evidence):
    likelihood = observe(evidence)
    posterior = normalize(likelihood * prior)
    return posterior
```

## What to carry forward

As later chapters introduce models, context, reasoning, memory, and agents, we will keep returning to the same test: what problem is this mechanism solving, what behavior does it create, and how should evidence change our judgment?
