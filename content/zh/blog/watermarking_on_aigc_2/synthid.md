---
published: 2026-08-18
updated: 2026-08-18
summary: 从两个token的例子解释KGW为何会扭曲模型分布，再推导Tournament的无偏性、多轮SynthID-Text及Weighted Mean检测，并通过检测率和Delta NLL比较两种算法。
---


# Anthropic要给文本加水印？Part 2：从有偏的KGW到无偏的SynthID-Text

> **本文要点 / TL;DR**
>
> **问题**：KGW为什么会扭曲模型的原始概率分布，而SynthID-Text又如何利用Tournament实现期望意义下的无偏水印？
>
> **方法**：从两个token的例子出发，推导单轮及多轮Tournament的概率变换，从零实现SynthID-Text与Weighted Mean检测器，并在相同数据和生成配置下与KGW进行比较。
>
> **结论**：SynthID-Text在期望意义下保持模型原始分布；实验中，其生成质量与KGW接近，`Delta NLL`更低，但水印检测能力尚未表现出显著优势。
>
> 配套资源：[完整 Notebook（代码、数据与实验结果）]()

## 如何理解KGW算法是有偏的？

在[上一篇文章](https://gentang.github.io/zh/blog/watermarking_on_aigc/)中，我们以KGW为例，讨论了如何在大语言模型生成文本的过程中嵌入水印，以及如何通过统计检验将水印重新检测出来。KGW是文本水印领域最具代表性的算法之一，机制简单、检测原理直观，非常适合帮助我们建立对生成式文本水印的基本认识。

不过，Anthropic随后在[官方说明](https://www.anthropic.com/news/claude-text-watermark)中进一步披露，Claude实际采用的是**一个基于Google DeepMind SynthID-Text的水印方案**，而不是KGW。两者都会在模型生成token的过程中嵌入统计信号，但修改概率分布的方式存在一个非常关键的区别：KGW会系统性地改变模型原始的下一token分布，而SynthID-Text试图在保留水印信号的同时，使这种概率扰动在期望意义下相互抵消。

### 一个直观的例子

回顾KGW水印算法的核心机制：模型每生成一个token时，算法会随机采样得到一份词表**绿名单（Green List）**。属于绿名单的候选token，生成概率会被抬高；不在绿名单内的候选token，概率则被压低。由此可见，单次token生成的概率会发生扭曲。但在理想情况下（可惜KGW不是这种情况），我们希望对所有可能的随机绿名单求取数学期望后，得到的概率分布能够完美还原为模型的原始分布。我们可以通过下面一个直观示例进一步理解这个概念。

假设当前只有两个备选token：A和B，它们的原始生成概率设定如下：

* P(A) = 0.9, P(B) = 0.1。
* **规则**：每次恰好选择一个token作为green token，并设置增益系数 

$$e^\delta=2$$

如果A被划入绿名单：

$$p'(A)=\frac{2\times 0.9}{2\times 0.9+0.1}=\frac{18}{19}\approx 0.9474$$

如果B被划入绿名单：

$$p'(A)=\frac{0.9}{0.9+2\times 0.1}=\frac{9}{11}\approx 0.8182$$

由于这两种绿名单划分情况发生的概率相等，我们来计算A的期望概率：

$$\mathbb{E}[p'(A)]=\frac{0.9474+0.8182}{2}\approx 0.8828$$

显然，期望值0.8828并不等于原始概率0.9。这证明了，即使在平均意义上，KGW算法依然会改变模型的原始概率分布，因此它是一个有偏算法。

### 锦标赛（Tournament）机制的无偏案例

为了实现无偏的水印效果，我们可以在同样的概率设定下，引入一种被称为Tournament的机制来生成最终的token（这也是诸如 Google SynthID等无偏水印算法的核心思路）。

**游戏规则如下：**

1. **初始化分数**：在锦标赛开始前，随机为每个token分配一个0或1的分数（代表水印信号 $g$）。
2. **锦标赛采样**：根据模型的原始概率分布，独立随机地抽取两个 token参与比赛（允许抽到相同的token）。分数高的token获胜并被输出；如果分数相同，则在抽中的两个token中随机选择一个获胜。

在这种机制下，我们可以穷举出 4 种等概率的分数分配情况[^1]：

| $g(A)$ | $g(B)$ | 修改后的 $p'(A)$ |
| :---: | :---: | :---: |
| 0 | 0 | 0.90 |
| 1 | 1 | 0.90 |
| 1 | 0 | 0.99 |
| 0 | 1 | 0.81 |

最后，我们计算这四种情况的数学期望：

$$\mathbb{E}[p'(A)]=\frac{0.90+0.90+0.99+0.81}{4}=0.90$$

此时，A的期望概率完美回归了原始概率0.9。在这种情况下，我们称 Tournament算法是**无偏的（Unbiased）**。这说明，虽然在单次生成时概率依然为了嵌入水印而被扭曲，但在宏观的期望层面上，概率分布没有任何偏移，模型依然保持在原始的最优状态下运行。


### 两种算法水印信号强度的差异

在探讨KGW算法时，我们知道其检测的核心数学工具是**假设检验（Hypothesis Testing）**。抛开繁琐的数学推导，直观上来说：在自然生成（无水印）的文本中，一个token恰好落在“绿名单”中的概率是一个固定值（通常基准为25%）。而在嵌入了水印的文本中，token落在绿名单的概率会显著偏离这个基准值。这种偏离程度越大，我们判定文本包含水印的把握也就越高。

同样的逻辑也完全适用于Tournament机制。在正常情况下，模型生成的 token恰好被分配到高分（即水印信号 $g=1$）的概率也是固定的（通常基准为50%）。但在引入Tournament干预后，最终输出的token具有高分的概率也必然会升高。

因此，我们可以将**加水印后的观察概率与基准概率之间的偏离值**，定义为水印的**信号强度（Signal Strength）**。

下面的表格直观地展示了上面例子的设定下，这两种算法信号强度的差异：

| 检测方法 | 无水印基准概率 | 加水印后的概率 | 绝对提升 (信号强度) |
| :---: | :---: | :---: | :---: |
| **KGW** ($e^\delta=2$) | 50% | 56.46% | **+ 6.46** 个百分点 |
| **一轮Tournament** | 50% | 54.50% | **+ 4.50** 个百分点 |

从数据对比中，我们可以清晰地看到一个在算法设计上的 Trade-off（权衡）：**虽然Tournament算法实现了无偏生成（Unbiased），但代价是其水印的信号强度天然弱于KGW算法**。因此，在实际的应用当中，我们需要通过额外的算法设计来增强Tournament的水印信号。


## SynthID算法简介

顺着前文对Tournament机制的探讨，我们终于可以深入了解Google SynthID的核心细节了。简而言之，SynthID的本质就是一个多轮锦标赛（Multi-round Tournament）。

至于为什么要将单轮设计扩展为多轮？结合我们刚刚得出的结论想必大家已经猜到了：单轮Tournament虽然无偏，但带来的水印信号相对较弱。因此，SynthID需要通过多轮赛制的叠加，来不断放大并增强信号。

### Tournament的概率等价形式

在正式讨论多轮Tournament之前，我们先从单轮情形出发，推导它的概率等价形式。

- 设模型词表的大小为$vs$，模型输出的概率分布为
$$\sum_{i=1}^{vs}p_i=1.$$

- 为每个token随机分配的水印信号分数（g-values）分布为

$$
g_i\sim\operatorname{Bernoulli}\left(\frac12\right),
\qquad
\Pr(g_i=1)=\Pr(g_i=0)=\frac12.
$$

- 经过一轮Tournament后，最终输出token的概率分布将转变为

$$
\boxed{
p_i'=p_i(1+g_i-q)
}
$$
$$
q=\sum_{j=1}^{vs}p_jg_j
$$

从上述公式可以直接看出：

- 当$g_i=1$时，概率乘数为$2-q\ge 1$，token $i$的输出概率得到提升；
- 当$g_i=0$时，概率乘数为$1-q\le 1$，token $i$的输出概率受到抑制[^2]。

关于这一结论，纯数学层面的证明虽然不难，但未免有些枯燥生涩。作为一个偏向实战的技术专栏，我们不妨换一种更Geek的方式来验证它：分别实现显式Tournament与等价的logits修正，并通过代码验证二者得到的概率分布逐元素一致。

#### 程序清单1（[完整 Notebook]()）

```python
def explicit_tournament(prob, g):
    """枚举全部候选对，计算一层显式Tournament的精确分布。

    prob: (vs,) 概率分布；g: (vs,) 二值分数；返回: (vs,) 获胜token分布。
    """
    tokens = torch.arange(prob.numel(), device=prob.device)

    # 这三个矩阵操作就是双重for循环的向量化写法：
    # for first in tokens:
    #     for second in tokens:
    #         output[winner(first, second)] += p(first) * p(second)
    first = tokens[:, None].expand(-1, len(prob))
    second = tokens[None, :].expand(len(prob), -1)
    winner = torch.where(g[first] >= g[second], first, second)  # g平局时第一个获胜
    joint_prob = prob[:, None] * prob[None, :]
    return torch.zeros_like(prob).scatter_add_(0, winner.flatten(), joint_prob.flatten())


def closed_form_tournament(prob, g):
    """用闭式公式计算与一层Tournament等价的分布。

    prob: (vs,) 概率分布；g: (vs,) 比赛的二值分数；返回: (vs,) 修改后的分布。
    """
    q = (prob * g).sum()
    return prob * (1 + g - q)


torch.manual_seed(0)
vs = 100
# 验证等价性
prob = torch.randn(vs, dtype=torch.float64).softmax(0)
g = torch.randint(0, 2, (vs,))
torch.testing.assert_close(explicit_tournament(prob, g),
                           closed_form_tournament(prob, g), rtol=1e-12, atol=1e-12)
```

### 多轮 Tournament 的核心算法设计

明确了单轮的机制，我们就可以推演SynthID的多轮Tournament赛制。这是一个总计$m$轮的锦标赛系统，其核心流程如下：

1. **初始参赛者选取**：首先，根据模型原始的概率分布，独立随机抽取$2^m$个token参与首轮比赛。每轮比赛两两对决，胜者晋级下一轮，直到决出最终的唯一冠军。

```text
初始    第 1 轮     第 2 轮

x1 ──┐
     ├── w1 ──┐
x2 ──┘        │
              ├── y（最终输出）
x3 ──┐        │
     ├── w2 ──┘
x4 ──┘

x1,…,x4独立采样自模型的原始概率分布p；
每场对决选择当前轮次中g-value更大的候选晋级。
```

2. **独立的信号注入**：赛制中的每一轮都拥有自己独立生成的g-values。这意味着每轮对决的胜负，都只依赖于当前这一轮的g-values，从而实现了多重水印信号的叠加。

3. **最终概率分布**：基于我们在上一节讨论的概率等价原则，设模型的原始概率分布为$p_i^{(0)}=p_i$。在第 $r$ 轮Tournament中，定义 $g_i^{(r)}\in\{0,1\}$，并令该轮 $g=1$ 的概率质量为

$$
q_r=\sum_{j=1}^{vs}p_j^{(r-1)}g_j^{(r)}.
$$

则每轮比赛都会按照下式更新概率分布：

$$
p_i^{(r)}=
p_i^{(r-1)}
\left(1+g_i^{(r)}-q_r\right).
$$

因此，经过$m$轮 Tournament 后，token $i$的最终生成概率为

$$
\boxed{
p_i^{(m)}=
p_i
\prod_{r=1}^{m}
\left(1+g_i^{(r)}-q_r\right)
}
$$

为了让大家更清晰地理解其底层的运行逻辑，相应的核心代码实现如下，基本上就是上面数学公式的直接翻译：

#### 程序清单2（[完整 Notebook]()）

```python
def update_logits(logits, g_values):
    """把m层显式Tournament转成等价的logits更新。

    参数
    ----
    logits : (B, vs) floating tensor
        语言模型对vs个候选token给出的原始logits。
    g_values : (B, vs, m) 0/1 tensor
        candidate_g生成的m层Tournament分数。

    返回
    ----
    (B, vs) floating tensor
        修改后的log-probabilities。
    """
    probs = logits.softmax(dim=-1)
    for layer in range(g_values.shape[-1]):
        g = g_values[..., layer].to(probs.dtype)        # (B, vs)
        g_mass = (probs * g).sum(dim=-1, keepdim=True)  # (B,  1)
        probs *= 1 + g - g_mass                         # (B, vs)
    log_probs = probs.log()
    return torch.where(torch.isfinite(log_probs), log_probs, torch.finfo(log_probs.dtype).min)
```


### 实现细节：伪随机与无偏性的巧妙平衡

如果说前面探讨的Synthid多轮锦标赛机制在逻辑上还算直观，那么接下来要拆解的工程实现细节，就多少有些暗藏玄机了。在前文中，我们反复依赖一个关键前提：**随机生成**的g-values。

但在计算机的世界里，并不存在真正的绝对随机。为了在文本生成过程中构造出我们需要的“随机性”，必须借鉴类似KGW算法的思路引入伪随机数生成器。具体而言：我们需要将当前token之前的上下文（context）、当前候选的token，以及当前锦标赛所处的层数拼接起来，计算出一个哈希值，并以此作为随机种子来生成对应的g-values。

这里就引出了一个棘手的矛盾。SynthID算法的核心卖点是**无偏性**，这意味着对于同一个token及其对应的Tournament层级，g-values必须满足随机分布。只有这样，前文关于无偏性的数学推导才能成立。

然而，哈希运算是确定性的。按照上述机制，如果模型在文本生成过程中，两次遇到**完全相同**的上下文，算出的哈希值以及最终的g-values将完全一致。此时，g-values不再是一个随机变量，而是坍缩成了固定值。如果不加干预，这会导致特定的概率分布被过度重采样，从而打破数学期望上的平衡，让原本无偏的算法重新变得有偏。

为了解决这个工程上的困境，SynthID在算法设计时引入了一个巧妙的回退机制：

- 当**第一次**遇到某个特定的context时，正常执行上述哈希算法以注入水印信号；
- 但如果在后续生成中**重复**碰到了完全相同的context，算法会直接跳过水印注入逻辑，保留大模型原始的输出概率。通过这种条件控制，有效避免了因重复采样导致的概率分布扭曲。

具体的核心逻辑，我们可以通过如下代码来实现：

#### 程序清单3（[完整 Notebook]()）

```python
class MinimalSynthID(LogitsProcessor):
    """与Hugging Face输出一致、但只保留必要逻辑的SynthID processor"""
    ...

    @torch.no_grad()
    def __call__(self, input_ids, logits):
        """修改当前生成步的 logits。

        参数
        ----
        input_ids : (B, L) int64 tensor
            model.generate 当前已经拥有的完整token序列。
        logits : (B, vs) floating tensor
            当前生成步尚未加SynthID水印的logits。

        返回
        ----
        (B, vs) floating tensor
            首次出现的context返回修改后的logits；重复context原样返回输入logits。
        """
        B, vs = logits.shape

        # 1. 初始化的时候用L个0作为context；后续每步左移并追加刚生成的 token
        if self.context is None:
            self.context = torch.zeros(B, self.ngram_len - 1, dtype=torch.long, device=self.device)
            self.history = torch.zeros(B, self.history_size, dtype=torch.long, device=self.device)
        else:
            self.context = torch.cat((self.context, input_ids[:, -1:]), dim=-1)[:, 1:]
        # 2. 为全词表vs个候选和m层key计算形状(B, vs, m)的g-values
        candidates = torch.arange(vs, device=self.device)[None].expand(B, -1)
        g_values, context_hash = candidate_g(self.context, candidates, self.keys, self.table)
        # 3. 连续执行m次闭式Tournament分布更新。
        watermarked = update_logits(logits, g_values)
        # 4. 已使用过的context跳过水印；无论是否重复，都把本次context放入history。
        context_hash = context_hash[:, None]                                 # (B, 1)
        repeated = (self.history == context_hash).any(dim=-1, keepdim=True)  # (B, 1)
        self.history = torch.cat((context_hash, self.history), dim=-1)[:, :-1]
        return torch.where(repeated, logits, watermarked)
```

### 水印检测原理与权重分配机制

与KGW算法类似，SynthID的水印检测同样建立在假设检验的基础之上。

在没有注入水印的自然生成文本中，任何一个token在各层锦标赛（Tournament）中的得分$g$都严格服从参数为0.5的伯努利分布（Bernoulli Distribution），即$g=1$和$g=0$的概率各占 50%。因此，最直观的检测思路就是统计整段文本中所有token的$g$值平均（所有token在所有锦标赛中的$g$），观察其是否显著偏离了50%的自然期望。

但在具体的工程检测实现中，为了保证极高的检测准确率与鲁棒性，有两个关键细节需要特别注意：

1、各层Tournament的信号强度存在差异

在多轮锦标赛中，各层注入的水印信号强度并不是一样的。从数学上可以严谨地证明，在包含水印的假设（$H_1$）下，token在第$\ell$层得分$g=1$的概率为：


$$P(g_{t,\ell}=1\mid H_1)=\frac{1}{2}+\delta_\ell$$

而随着锦标赛层数的加深，信号的偏移量$\delta$呈现出递减的趋势，即：

$$\delta_1\geq\delta_2\geq\cdots\geq\delta_m$$

由此可以推导得出：


$$P(g_{t,1}=1\mid H_1)\geq P(g_{t,2}=1\mid H_1)\geq\cdots$$

这意味着：**越浅层的Tournament，水印信号越强。** 因此，在检测算法中，我们理应为浅层信号赋予更高的权重。

这里隐藏着一个非常巧妙的统计学技巧：在无水印的基准情况下，无论我们如何调整不同层锦标赛的检测权重，计算出的加权平均值（Weighted Mean）依然会“近似”服从正态分布，其标准差不会发生剧烈波动。但对于有水印的文本，通过赋予浅层更高的权重，可以极大地放大水印信号的**统计显著性（statistical significance）**，从而让检测更容易。

至于如何调整权重，Google团队给出了一个很实用但是粗糙的方法，用等差数列来设定权重。比如一共有9层锦标赛，那么从第一层到最后一层的权重分别为：10，9，...，1。

2、对齐生成端的去重逻辑

正如我们在上一节探讨的，为了保证算法的无偏性，如果生成阶段遇到了重复的上下文，我们会触发回退机制，放弃在该位置注入水印。

这就要求检测端必须与生成端保持严格的**逻辑对齐**。在计算最终的检测得分时，系统需要同步追踪上下文历史。如果发现某个token的上下文曾出现过，就必须在统计加权得分时**剔除掉这个token**。

具体的检测逻辑代码实现如下：

#### 程序清单4（[完整 Notebook]()）
```python
def sequence_g_values(input_ids, processor):
    """检测端重建整段序列的g-values"""
    ...


def repetition_mask(input_ids, processor):
    """检测端屏蔽第二次及以后出现的相同context"""
    ...


class SynthIDWeightedMeanDetector:
    """从token IDs重建g-values、应用重复context mask，并计算weighted mean。"""
    ...

    def weighted_mean(self, g_values, mask):
        """批量计算官方定义的weighted mean；结果形状为 (B,)。"""
        weights = self.weights.to(g_values.device)
        masked = g_values.to(torch.float64) * mask[..., None].to(torch.float64)
        count = mask.sum(dim=1)
        return (masked * weights).sum(dim=(1, 2)) / (count * weights.sum())

    def __call__(self, token_ids, max_scored_tokens=None):
        """检测一个token序列的SynthID水印。

        token_ids : (L,) sequence或int64 tensor
            待检测文本的token IDs，不包含prompt。
        max_scored_tokens : int或None
            只使用前N个未被重复context mask排除的位置；None表示全部使用。
        返回 : dict或None
            有效长度、weighted mean、零假设标准差、z-score、正态近似p值和逐层均值；
            文本太短或没有有效位置时返回None。
        """
        # 1. 统一成设备上的一维token序列。
        ids = torch.as_tensor(token_ids, dtype=torch.long, device=self.processor.device)
        if ids.numel() < self.processor.ngram_len:
            return None

        # 2. 重建每个完整n-gram的g-values，并排除重复context。
        batch = ids[None, :]
        g_values = sequence_g_values(batch, self.processor)
        mask = repetition_mask(batch, self.processor)
        valid_g = g_values[0, mask[0]]
        if max_scored_tokens is not None:
            valid_g = valid_g[:max_scored_tokens]
        tokens = int(valid_g.shape[0])
        if tokens == 0:
            return None

        # 3. 聚合有效位置和Tournament层，再按零假设方差转换成z-score。
        valid_mask = torch.ones(1, tokens, dtype=torch.bool, device=ids.device)
        score = float(self.weighted_mean(valid_g[None, :], valid_mask)[0])
        ...
```

## 算法效果评估

为了比较KGW与SynthID的实际效果，我们使用同一批输入数据，并在相同的生成配置下，分别生成无水印文本、KGW水印文本和SynthID水印文本。

除了前文使用的`chrF`、`Semantic Cosine`和`Length Ratio`之外，这里进一步引入`Delta NLL`，用于衡量水印对模型原始概率分布造成的扰动。

对于生成文本$y=(y_1,\ldots,y_T)$，首先使用未添加水印的原始模型计算其平均负对数似然：

$$
\operatorname{NLL}_0(y)=
-\frac{1}{T}
\sum_{t=1}^{T}
\log p_0(y_t\mid x,y_{<t}),
$$

其中，$p_0$表示原始模型的条件概率分布。进一步定义

$$
\Delta\mathrm{NLL}=
\operatorname{NLL}_0(y_{\mathrm{wm}})-\operatorname{NLL}_0(y_{\mathrm{base}}),
$$

其中，$y_{\mathrm{wm}}$和$y_{\mathrm{base}}$ 分别表示同一输入下生成的水印文本和无水印文本。

`Delta NLL`越接近$0$，说明水印文本在原始模型下的概率越接近无水印文本，水印对生成分布造成的扰动也越小。在实验中，`Delta NLL`通常为正，因此数值越小，一般意味着水印引入的概率损失越低。

与前三个指标相比，`Delta NLL`衡量的是一种不容易通过肉眼直接观察到的分布变化，即使两段文本在字面和语义上高度相似，它们的`Delta NLL`仍然可能存在明显差异。

![图1 | 70%](./pic/p-1.webp)

从图中的结果来看KGW与SynthID在`chrF`、`Semantic Cosine` 和`Length Ratio`上的差异较小，说明二者生成文本的表面质量和语义质量较为接近。

不过，在当前实验配置下，SynthID的`Delta NLL`更低。这表明，与KGW相比，SynthID生成的文本在原始模型下具有更高的平均概率，其水印机制对模型原始生成分布造成的扰动相对更小。

### 检测分数的分布

接下来，我们观察不同类型文本的检测分数分布。

整体结果与KGW类似：无水印模型文本和人工文本的检测分数大致符合零假设下的理论分布；添加水印后，分布则发生了明显偏移。这说明SynthID确实在生成文本中引入了能够被统计检测器识别的水印信号。

![图2 | 70%](./pic/p-2.webp)

我们还分别统计了不同Tournament layer上g-value的平均值。结果显示，而随着层级增加，其均值逐渐向零假设下的理论期望$0.5$靠近。

### 水印检测效果

最后，我们比较两种算法的水印检测能力。

![图3 | 70%](./pic/p-3.webp)

从当前结果来看，在相同实验条件下，SynthID的检测效果并未显著超过KGW。虽然SynthID在部分指标或实验设置中的点估计略高，但仅凭单次实验还无法判断这种差异来自算法本身，还是随机采样造成的波动。

## 结论

当前实验表明，KGW与SynthID都能够在生成文本中嵌入可检测的水印信号。二者在可直接观察的文本质量指标上差异不大，但SynthID在当前配置下表现出了更低的`Delta NLL`，说明其对原始模型分布的扰动更小。

不过，要全面比较两种算法的优劣，还需要进行更加系统的消融实验。这也将是下一篇文章的主要内容，具体包括：

- 在不同水印强度下，比较检测效果与生成质量之间的权衡；
- 在相同`Delta NLL`或文本质量约束下进行公平比较；
- 比较两种算法在不同语言上的检测效果；
- 测试两种水印面对改写、翻译、截断和重采样等规避方法时的鲁棒性；


[^1]: 为了更直观地理解，我们可以详细拆解第一种情况（分数均为 0，即平局）的计算过程：

    * **两次都抽中A**：概率为 $0.9 \times 0.9 = 0.81$，此时 A 必然获胜。
    * **抽中A和B**：包含“先A后B”和“先B后A”两种情况，概率为 $2 \times 0.09 = 0.18$。由于两者分数相同，A有0.5的概率获胜，即贡献了0.09的胜率。
    * **两次都抽中B**：概率为 0.01，此时A必然失败。
    * 综合计算：$$p'(A)=0.81+0.18\times 0.5=0.90$$

[^2]: 不过，算法并不是永久偏爱某一组token。由于
    $$
    \mathbb E[g_i]=\frac12,
    \qquad
    \mathbb E[q]=\frac12,$$
    对伪随机 $g$-value 取平均后，有
    $$
    \mathbb E_g[p_i']=p_i\left(1+\mathbb E[g_i]-\mathbb E[q]\right)=p_i.
    $$
    也就是说，单次生成中算法会根据$g$-value重新分配概率质量，但在平均的意义下，原始概率分布保持不变。这正是Synthid所谓“无偏性”的数学来源。