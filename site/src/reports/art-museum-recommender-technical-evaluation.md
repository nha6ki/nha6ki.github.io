## Abstract

This report evaluates overall artwork preference ordering from six observed ratings. It describes the prediction method used by the [Art & Museum Recommender](/projects/art-museum-recommender/) and compares six fixed predictors using responses from 37 participants to 400 paintings. The method combines a 12-component output-PCA representation, Ridge regression, and latent-space cosine weighting. Under participant-held-out evaluation with Hybrid-specific Utility Top200 inputs, the fixed Hybrid achieved mean Spearman correlation **0.469641**, compared with **0.440568** for Reference Mean. The paired improvement was **+0.029073**, with an exploratory 95% participant-bootstrap interval of **[+0.016254, +0.042632]**. The Hybrid had the highest mean Spearman among the six conditions, but its advantage over latent cosine weighting alone was small and uncertain. These findings support the fixed model as a reasonable choice for overall preference ordering under this input policy, without establishing uniquely optimal parameters or the quality of the application's final recommendations.

## 1. Purpose and relationship to the application

This is a technical companion to the existing project page, not a separate application or a new participant study. The project page describes the interface and visitor experience. This report focuses on the prediction equations, participant-held-out evaluation, comparisons with alternative predictors, and checks linking the research calculations to the deployed implementation. The research data and repositories remain private.

The application asks a visitor to assign values to six paintings. It uses the *pattern of relative valuations*, rather than the absolute amounts, to estimate that visitor's preferences. The purpose is personalized ordering, not monetary appraisal of artworks.

The method has two stages. Offline, reference participants' responses are compressed into a low-dimensional preference representation. For each six-painting input, Ridge regression estimates a new user's position in that space. Predictions then combine direct reconstruction from the estimated coordinates with a similarity-weighted estimate from the reference participants.

The question addressed by the main comparison is specific: **under the input-selection policy used by the application, how does its fixed prediction rule compare with simpler alternatives?** The comparison does not attempt to optimize every predictor's input policy independently.

## 2. Data and prediction task

The reference responses come from the behavioral cohort described by Pham and Chikazoe [1]. That study included 37 participants and 400 artworks. Participants assigned subjective monetary valuations to artworks within a permitted range of JPY 100 to JPY 10,000,000. The study also examined other aesthetic domains; its cross-domain models and reported correlations are not the Art-to-Art experiments presented here.

The application uses a processed **400-artwork × 37-participant** matrix. An audit found no missing or nonfinite values and nearly identical means and standard deviations across participant columns. These observations suggest participant-level location and scale adjustment, but the exact transformation from the original responses to the stored matrix is unknown. The stored values are therefore treated as processed preference scores, not as amounts in yen. No outlier removal was added for the reported analyses.

All 400 responses are available for each study participant. In each simulated recommendation session, the predictor receives only six of that participant's ratings; the other **394** are withheld for evaluation. Other participants' responses to those same artworks remain available for training. This is a **new-participant prediction task on known artworks**, not a test of preference prediction for entirely unseen artworks.

The six compared predictors use rating matrices only. They do not use artwork pixels, image embeddings, or style labels. The separate collection used by the live application is outside the quantitative evaluation in this report.

## 3. Prediction method and comparison models

### 3.1 Training-participant representation

Let <i>Y</i> be an <i>n</i> × 400 matrix of training-participant scores, and let <i>μ</i> contain the artwork-wise means across those participants. Subtracting these means gives residual matrix <i>R</i>. Its singular value decomposition defines the output-PCA coordinates:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mtable><mtr><mtd columnalign="right"><mi>R</mi></mtd><mtd columnalign="left"><mo>=</mo><mi>Y</mi><mo>−</mo><msub><mn>𝟏</mn><mi>n</mi></msub><msup><mi>𝛍</mi><mi>𝖳</mi></msup><mo>=</mo><mi>U</mi><mi>Σ</mi><msup><mi>V</mi><mi>𝖳</mi></msup><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><mi>Z</mi></mtd><mtd columnalign="left"><mo>=</mo><msub><mi>U</mi><mn>12</mn></msub><msub><mi>Σ</mi><mn>12</mn></msub><mo>∈</mo><msup><mi>ℝ</mi><mrow><mi>n</mi><mo>×</mo><mn>12</mn></mrow></msup><mi>.</mi></mtd></mtr></mtable><annotation encoding="application/x-tex">
\begin{aligned}
R &amp;= Y-\mathbf{1}_{n}\boldsymbol{\mu}^{\mathsf T}=U\Sigma V^{\mathsf T}, \\
Z &amp;= U_{12}\Sigma_{12}\in\mathbb{R}^{n\times12}.
\end{aligned}
</annotation></semantics></math>
</div>

Here, <i>U</i><sub>12</sub>, <i>Σ</i><sub>12</sub>, and <i>V</i><sub>12</sub> retain the 12 components associated with the largest singular values. <i>Z</i> contains the training participants' latent coordinates. PCA is applied to the **400-dimensional output preference profiles**, not to the six-dimensional input vector.

The evaluation fits this representation using 36 participants in an outer fold and 35 in an inner fold. The participant held out at each level is excluded from that fit.

### 3.2 Inferring preferences from six ratings

For a selected set of six paintings, each training participant's six scores are centered and divided by their root-mean-square deviation. The held-out participant's six inputs are transformed in the same way, using only those six values.

Let <i>X</i> be the resulting <i>n</i> × 6 training-input matrix and <i>q</i> the 1 × 6 query vector. Let x̄ be the row vector of training-input column means. Ridge regression estimates the query's latent coordinates:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mtable><mtr><mtd columnalign="right"><msub><mi>X</mi><mi>c</mi></msub></mtd><mtd columnalign="left"><mo>=</mo><mi>X</mi><mo>−</mo><msub><mn>𝟏</mn><mi>n</mi></msub><mover><mi>x</mi><mo accent="true">‾</mo></mover><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><mi>B</mi></mtd><mtd columnalign="left"><mo>=</mo><msup><mrow><mo stretchy="true" form="prefix">(</mo><msubsup><mi>X</mi><mi>c</mi><mi>𝖳</mi></msubsup><msub><mi>X</mi><mi>c</mi></msub><mo>+</mo><mi>α</mi><msub><mi>I</mi><mn>6</mn></msub><mo stretchy="true" form="postfix">)</mo></mrow><mrow><mi>−</mi><mn>1</mn></mrow></msup><msubsup><mi>X</mi><mi>c</mi><mi>𝖳</mi></msubsup><mi>Z</mi><mo>,</mo><mspace width="2.0em"></mspace><mi>α</mi><mo>=</mo><mn>100</mn><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><mover><mi>z</mi><mo accent="true">̂</mo></mover></mtd><mtd columnalign="left"><mo>=</mo><mrow><mo stretchy="true" form="prefix">(</mo><mi>q</mi><mo>−</mo><mover><mi>x</mi><mo accent="true">‾</mo></mover><mo stretchy="true" form="postfix">)</mo></mrow><mi>B</mi><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>1</mn><mo>×</mo><mn>12</mn></mrow></msup><mi>.</mi></mtd></mtr></mtable><annotation encoding="application/x-tex">
\begin{aligned}
X_{c} &amp;= X-\mathbf{1}_{n}\bar{x},\\
B &amp;= (X_{c}^{\mathsf T}X_{c}+\alpha I_{6})^{-1}X_{c}^{\mathsf T}Z,\qquad\alpha=100,\\
\hat{z} &amp;= (q-\bar{x})B\in\mathbb{R}^{1\times12}.
\end{aligned}
</annotation></semantics></math>
</div>

The regularization convention is the explicit matrix expression above; it does not divide the squared-error term by the number of training participants. The implementation solves the linear system rather than explicitly forming its inverse. A new set of six paintings changes the input design matrix and requires a new Ridge fit, but does not require refitting the reference PCA basis.

The direct PCA–Ridge residual prediction is:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML" aria-label="Direct reconstruction of the 400 artwork residuals"><semantics><mrow><msub><mover><mi>r</mi><mo>^</mo></mover><mtext>direct</mtext></msub><mo>=</mo><mover><mi>z</mi><mo>^</mo></mover><msubsup><mi>V</mi><mn>12</mn><mi mathvariant="normal">T</mi></msubsup><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>1</mn><mo>×</mo><mn>400</mn></mrow></msup><mo>.</mo></mrow><annotation encoding="application/x-tex">\hat{r}_{\mathrm{direct}}=\hat{z}V_{12}^{\mathsf T}\in\mathbb{R}^{1\times400}.</annotation></semantics></math>
</div>

### 3.3 Latent cosine weighting and the Hybrid

The alternative prediction component compares the inferred latent vector with each reference participant's coordinates. Cosine similarities are converted to normalized nonnegative weights by a softmax:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mtable><mtr><mtd columnalign="right"><msub><mi>s</mi><mi>i</mi></msub></mtd><mtd columnalign="left"><mo>=</mo><mfrac><mrow><mover><mi>z</mi><mo accent="true">̂</mo></mover><msubsup><mi>Z</mi><mrow><mi>i</mi><mo>,</mo><mo>:</mo></mrow><mi>𝖳</mi></msubsup></mrow><mrow><mo stretchy="false" form="postfix">∥</mo><mover><mi>z</mi><mo accent="true">̂</mo></mover><msub><mo stretchy="false" form="postfix">∥</mo><mn>2</mn></msub><mspace width="0.167em"></mspace><mo stretchy="false" form="postfix">∥</mo><msub><mi>Z</mi><mrow><mi>i</mi><mo>,</mo><mo>:</mo></mrow></msub><msub><mo stretchy="false" form="postfix">∥</mo><mn>2</mn></msub></mrow></mfrac><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><msub><mi>w</mi><mi>i</mi></msub></mtd><mtd columnalign="left"><mo>=</mo><mfrac><mrow><mo>exp</mo><mrow><mo stretchy="true" form="prefix">(</mo><mn>2</mn><mi>γ</mi><msub><mi>s</mi><mi>i</mi></msub><mo stretchy="true" form="postfix">)</mo></mrow></mrow><mrow><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mo>exp</mo><mrow><mo stretchy="true" form="prefix">(</mo><mn>2</mn><mi>γ</mi><msub><mi>s</mi><mi>k</mi></msub><mo stretchy="true" form="postfix">)</mo></mrow></mrow></mfrac><mo>,</mo><mspace width="2.0em"></mspace><mi>γ</mi><mo>=</mo><mn>1</mn><mi>.</mi></mtd></mtr></mtable><annotation encoding="application/x-tex">
\begin{aligned}
s_{i} &amp;= \frac{\hat{z}Z_{i,:}^{\mathsf T}}{\|\hat{z}\|_{2}\,\|Z_{i,:}\|_{2}},\\
w_{i} &amp;= \frac{\exp(2\gamma s_{i})}{\sum_{k=1}^{n}\exp(2\gamma s_{k})},\qquad\gamma=1.
\end{aligned}
</annotation></semantics></math>
</div>

The equations describe nondegenerate latent vectors. The implementations guard against division by zero; numerical agreement was tested for the cases described in Section 6, not for every possible input.

For coefficient-based inference, the direct component can be written using the Moore–Penrose pseudoinverse of <i>Z</i>:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mtable><mtr><mtd columnalign="right"><mi>a</mi></mtd><mtd columnalign="left"><mo>=</mo><mover><mi>z</mi><mo accent="true">̂</mo></mover><msup><mi>Z</mi><mo>+</mo></msup><mo>∈</mo><msup><mi>ℝ</mi><mrow><mn>1</mn><mo>×</mo><mi>n</mi></mrow></msup><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><mi>c</mi></mtd><mtd columnalign="left"><mo>=</mo><mi>β</mi><mi>a</mi><mo>+</mo><mrow><mo stretchy="true" form="prefix">(</mo><mn>1</mn><mo>−</mo><mi>β</mi><mo stretchy="true" form="postfix">)</mo></mrow><mi>w</mi><mo>,</mo><mspace width="2.0em"></mspace><mi>β</mi><mo>=</mo><mn>0.5</mn><mi>.</mi></mtd></mtr></mtable><annotation encoding="application/x-tex">
\begin{aligned}
a &amp;= \hat{z}Z^{+}\in\mathbb{R}^{1\times n},\\
c &amp;= \beta a+(1-\beta)w,\qquad\beta=0.5.
\end{aligned}
</annotation></semantics></math>
</div>

The vectors <i>a</i>, <i>w</i>, and <i>c</i> each have one coefficient per training participant. On the original artwork matrix, multiplying <i>a</i> by <i>R</i> gives the same direct reconstruction as multiplying the inferred coordinates by <i>V</i><sub>12</sub><sup>T</sup>. The Hybrid combines this component with the similarity-weighted residual prediction.

The similarity weights sum to one and are nonnegative. The direct coefficients can be negative, so the Hybrid is **not necessarily a convex combination of participant ratings**.

For artwork <i>j</i>, let <i>r</i><sub>j</sub> be the 1 × <i>n</i> row vector of its training-participant residuals. Its predicted score is:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><msub><mover><mi>y</mi><mo accent="true">̂</mo></mover><mi>j</mi></msub><mo>=</mo><msub><mi>μ</mi><mi>j</mi></msub><mo>+</mo><mi>λ</mi><mspace width="0.167em"></mspace><msub><mi>r</mi><mi>j</mi></msub><msup><mi>c</mi><mi>𝖳</mi></msup><mo>,</mo><mspace width="2.0em"></mspace><mi>λ</mi><mo>=</mo><mn>1</mn><mi>.</mi></mrow><annotation encoding="application/x-tex">
\hat{y}_{j}=\mu_{j}+\lambda\,r_{j}c^{\mathsf T},\qquad\lambda=1.
</annotation></semantics></math>
</div>

During evaluation, these means and residuals come from the training participants' observed scores for the study paintings. The score is used for ranking; it is not interpreted as a monetary price estimate.

### 3.4 Fixed conditions in the main comparison

The main comparison holds the input sets and evaluation targets constant. Parameters are fixed rather than retuned for each comparator.

| Predictor | Prediction rule | Fixed settings |
|---|---|---|
| Reference Mean | Artwork-wise mean across training participants; no query-dependent adjustment | None |
| Residual Ridge Regression | Regress all 400 artwork residuals directly on the standardized six-rating inputs; add the artwork mean | α = 100; no PCA |
| Input-Space RBF Similarity | Weight reference-participant residuals using similarity between the standardized six-rating input patterns | γ = 1; no PCA |
| PCA-based Ridge Prediction | Infer output-PCA coordinates with Ridge and reconstruct the artwork residuals | 12 PCs; α = 100; β = 1 |
| Ridge-Inferred Latent Cosine Similarity | Infer the same coordinates with Ridge, but predict through latent cosine-softmax weighting only | 12 PCs; α = 100; γ = 1; β = 0 |
| Fixed Hybrid | Mix direct PCA–Ridge reconstruction and latent cosine-weighted residuals equally | 12 PCs; α = 100; γ = 1; β = 0.5 |

For Input-Space RBF Similarity, the reference weight is obtained by normalizing the following kernel values across participants:

<div class="art2art-math-equation" style="max-width:100%;overflow-x:auto;overflow-y:hidden;text-align:center;margin:1.25em 0;padding:0.2em 0;">
<math display="block" xmlns="http://www.w3.org/1998/Math/MathML" aria-label="Input-space RBF weights normalized across reference participants"><semantics><mtable><mtr><mtd columnalign="right"><msub><mi>K</mi><mi>i</mi></msub></mtd><mtd columnalign="left"><mo>=</mo><mi mathvariant="normal">exp</mi><mo>⁡</mo><mo>[</mo><mo>−</mo><mi>γ</mi><mo>(</mo><mn>2</mn><mo>−</mo><mfrac><mrow><mn>2</mn><mi>q</mi><msubsup><mi>x</mi><mi>i</mi><mi mathvariant="normal">T</mi></msubsup></mrow><mn>6</mn></mfrac><mo>)</mo><mo>]</mo><mo>,</mo></mtd></mtr><mtr><mtd columnalign="right"><msub><mi>w</mi><mi>i</mi></msub></mtd><mtd columnalign="left"><mo>=</mo><mfrac><msub><mi>K</mi><mi>i</mi></msub><mrow><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>K</mi><mi>k</mi></msub></mrow></mfrac><mo>,</mo><mspace width="1em"/><mi>γ</mi><mo>=</mo><mn>1</mn><mo>.</mo></mtd></mtr></mtable><annotation encoding="application/x-tex">\begin{aligned}K_i&amp;=\exp[-\gamma(2-2qx_i^{\mathsf T}/6)],\\w_i&amp;=K_i/\sum_{k=1}^{n}K_k,\qquad\gamma=1.\end{aligned}</annotation></semantics></math>
</div>

Here <i>x</i><sub>i</sub> is a standardized six-rating reference vector. For nonconstant standardized inputs, this is an RBF on squared Euclidean distance divided by six. The implementation uses the correlation-form expression shown above. The similarity concerns **participants' rating patterns**, not visual resemblance between paintings.

“Latent Cosine Similarity” does not mean “without Ridge”: Ridge is still used to infer the query coordinates. Only the final residual-prediction rule differs from PCA-based Ridge Prediction. All residual-based conditions use a residual multiplier of one.

## 4. Evaluation protocol

![Figure 1. Outer participant holdout with training-only Utility Top200 selection.](/images/projects/art-museum-recommender/validation_design.svg)

**Figure 1. Participant-held-out evaluation with nested input selection.** One outer fold is shown. All 400 ratings exist for the held-out participant, but only six are revealed to the predictor in each repetition. The remaining 394 are used for scoring. The 36 training participants determine the PCA representation and the Hybrid-specific Top200 input pool. All six predictors receive the same sampled inputs. The figure describes the archived research evaluation, with fixed parameters and an input policy matched to the application.

### 4.1 Constructing a Top200 pool without the test participant

The outer evaluation uses **37 leave-one-participant-out (LOPO) folds**. In each fold, 36 participants provide all model-fitting and input-selection information; the remaining participant is reserved for testing.

Within the 36-person training partition:

1. Construct **600 balanced six-artwork sets**. Each set contains distinct paintings, and each of the 400 paintings appears exactly **nine times** overall. This balances marginal appearance counts, not every possible pair of paintings.
2. Evaluate the fixed Hybrid on these sets using **36 inner LOPO folds**: 35 participants for fitting and one for validation. PCA is fitted separately within each inner-training partition.
3. For each set, average its **Spearman improvement over Reference Mean** across the inner-validation participants. Both predictions and the baseline are scored on the same 394 non-input paintings.
4. Assign each painting the mean improvement of the nine sets containing it. Rank the 400 paintings by this Utility and retain the **Top200**, with seeded tie-breaking.

The recorded experiment used Spearman for Utility estimation. Utility measures performance associated with *groups containing an artwork*; it is not an isolated or causal contribution of that artwork.

The full-cohort Top200 asset used in deployment is not reused in these test folds. Each fold constructs its own pool without its outer-test participant. In this main analysis, the inner loop selects **input artworks**, not new values of the fixed Hybrid parameters.

### 4.2 Matched inputs and held-out targets

For each outer-test participant, 30 sets of six distinct paintings are sampled uniformly from that fold's Top200. Reappearance across repetitions is allowed. All six predictors receive exactly the same sets, and each predictor is fitted using the same 36 outer-training participants.

Only the sampled six scores are exposed as query inputs. The corresponding painting IDs are excluded from evaluation, leaving 394 targets. Reference Mean is scored on that identical target set for each repetition; its score can therefore vary slightly as the excluded inputs change.

The comparison reuses archived Hybrid-specific Top200 pools and input sets. Hybrid and Reference Mean participant-level scores were reproduced from the archived experiment in all 37 folds. This is a **retrospective comparison of replacements under the application's input policy**, not a comparison in which each algorithm independently optimizes its input-selection policy.

### 4.3 Spearman correlation and uncertainty

**Spearman correlation** measures agreement between the predicted and observed rankings across the 394 withheld targets. Ties receive average ranks. This report focuses on overall ranking agreement, not the quality of a selected top-ranked subset or the final cards displayed by the application.

For each participant, correlations are averaged over the 30 repetitions; the 37 participant means are then averaged arithmetically. There is no Fisher-z transformation. The 1,110 simulated sessions are not treated as 1,110 independent participants.

For model differences, **10,000 paired participant-bootstrap resamples** are drawn, retaining the correspondence between models. The 2.5th and 97.5th percentiles of the resampled mean difference form the reported 95% intervals. These intervals are exploratory and unadjusted for multiple comparisons. They summarize variation in the saved participant-level differences; they do not rerun model fitting or input selection within each bootstrap sample.

## 5. Main results and model-choice implications

### 5.1 Six-model comparison

**Table 1. Mean Spearman correlation under the Hybrid-specific Utility Top200 policy.** Each value averages 30 matched input sets per participant and then 37 participants. All parameters are fixed as specified in Section 3.4.

| Predictor | Mean Spearman ↑ | Difference from Reference Mean |
|---|---:|---:|
| Reference Mean | 0.440568 | — |
| Residual Ridge Regression | 0.463976 | +0.023408 |
| Input-Space RBF Similarity | 0.466086 | +0.025518 |
| PCA-based Ridge Prediction (12 PCs) | 0.465082 | +0.024514 |
| Ridge-Inferred Latent Cosine Similarity (12 PCs) | 0.468560 | +0.027992 |
| **Fixed Hybrid (12 PCs; β = 0.5)** | **0.469641** | **+0.029073** |

![Figure 2. Mean Spearman correlation for the six matched-input prediction conditions.](/images/projects/art-museum-recommender/six_model_spearman.svg)

**Figure 2. Six-model Spearman comparison.** Points show participant-mean correlations; the diamond marks Reference Mean and the square marks the fixed Hybrid. The horizontal axis does not begin at zero, so small differences are visually expanded. The figure shows means only, not uncertainty intervals. Paired intervals are reported below. The latent-cosine condition includes Ridge inference of the latent coordinates.

The fixed Hybrid has the highest observed mean Spearman in this comparison. The closest condition is Ridge-Inferred Latent Cosine Similarity; the paired comparisons below quantify the size and uncertainty of that difference.

### 5.2 Paired differences

**Table 2. Hybrid minus comparator: Spearman.** Positive differences favor the Hybrid. Intervals are paired participant-bootstrap percentile intervals, without multiplicity adjustment.

| Comparator | Mean difference | Exploratory 95% interval |
|---|---:|---|
| Reference Mean | +0.029073 | [+0.016254, +0.042632] |
| Residual Ridge Regression | +0.005665 | [+0.001719, +0.009965] |
| Input-Space RBF Similarity | +0.003555 | [+0.000726, +0.006358] |
| PCA-based Ridge Prediction | +0.004560 | [+0.000732, +0.008731] |
| Ridge-Inferred Latent Cosine Similarity | +0.001081 | [−0.002982, +0.004853] |

The Hybrid improves Spearman over Reference Mean by **0.029073**, with improvements for **28 of 37** participants. Its differences from Residual Ridge, Input-Space RBF, and PCA-based Ridge are smaller, although their exploratory intervals also lie above zero. These comparisons describe the specified fixed models on shared Hybrid-selected inputs; they do not establish superiority over every tuned version of those methods.

The closest alternative is Ridge-Inferred Latent Cosine Similarity. The Hybrid's mean advantage is **0.001081**, with an interval of **[−0.002982, +0.004853]**. This does not establish a reliable benefit from adding the direct-prediction component at a 50:50 ratio. Nor does an interval containing zero establish equivalence between the methods.

### 5.3 Interpretation for model selection

The comparison supports a bounded conclusion: the fixed Hybrid is a reasonable **preference-ordering configuration under its existing Top200 input policy**. It improves on a nonpersonalized baseline and performs competitively with the specified simpler predictors. It does not establish that 12 components or equal mixing are uniquely optimal.

These comparisons were performed after the method had been selected, so they provide retrospective support rather than evidence from a prospective selection process. Their conclusions are specific to the tested input policy and fixed parameter settings. They do not measure practical outcomes such as latency or user satisfaction.

## 6. Numerical implementation checks

Local checks linked the research calculation to the application's prediction code. Six model-asset SHA-256 hashes matched their approved values. For **three nonconstant six-rating test cases**, the inference class and a separately arranged coefficient calculation agreed to a maximum absolute difference of **1.14 × 10⁻¹³** on candidate scores. Reconstruction of the 400 study-artwork scores agreed with the archived research predictor to **4.55 × 10⁻¹³**.

These values measure **numerical agreement between implementations**, not prediction error against participants' judgments. They support consistency for the tested inputs and assets, not every input-dependent branch or the entire training pipeline. The reported LOPO results were obtained with the archived research predictor using the application's fixed parameters and input-selection policy; they are not an end-to-end evaluation of the live service.

## 7. Limitations and conclusion

**Selection and uncertainty.** The same cohort informed earlier model development and the retrospective comparisons. Top200 was selected for the Hybrid, so the experiment answers a system-specific replacement question rather than a policy-neutral algorithm comparison. Cross-validation does not remove all bias arising from repeated selection on the same data [2]. The participant-bootstrap intervals also omit refitting and retain dependence from overlapping LOPO training sets; they should not be read as calibrated confirmatory intervals [3].

**Data and scope.** The stored matrix's preprocessing history is incomplete, so fold-local fitting can be audited but all upstream preprocessing decisions cannot be certified from these records. Subjective monetary valuations are a proxy for preference, not a direct measure of visitor satisfaction or museum relevance. Each outer fold uses 36 reference participants, whereas deployment uses 37. The study contains no independent participant cohort and does not measure performance on the separate recommendation collection or the final displayed cards.

**Availability.** No new participant data were collected for this report. The original study describes its ethics and consent procedures [1]. Participant ratings, artwork images, model assets, and repositories are not redistributed with this article. The methods and aggregate results are provided to explain the engineering evaluation, not as a fully reproducible public dataset release.

The fixed 12-component Hybrid achieved the highest observed mean Spearman among six compared conditions under the Hybrid-specific Top200 policy. Its improvement over Reference Mean supports using the six query ratings for personalized preference ordering. The small and uncertain difference from latent cosine weighting alone limits the case for the equal blend specifically. This provides retrospective support for the model choice within the stated evaluation conditions, not proof of optimality or an improvement in top-of-list recommendation quality, visitor satisfaction, or live-service performance.

[Project overview](/projects/art-museum-recommender/) · [Live application](https://zoe-art.cloud.run/)

## References

[1] Pham, T. Q., & Chikazoe, J. (2026). *Cross domain consistency of aesthetic preference-driven social behavior*. **Frontiers in Neural Circuits, 20**, 1793443. [doi:10.3389/fncir.2026.1793443](https://doi.org/10.3389/fncir.2026.1793443)

[2] Cawley, G. C., & Talbot, N. L. C. (2010). *On over-fitting in model selection and subsequent selection bias in performance evaluation*. **Journal of Machine Learning Research, 11**, 2079–2107. [Journal article](https://www.jmlr.org/papers/v11/cawley10a.html)

[3] Bates, S., Hastie, T., & Tibshirani, R. (2024). *Cross-validation: What does it estimate and how well does it do it?* **Journal of the American Statistical Association, 119**(546), 1434–1445. [doi:10.1080/01621459.2023.2197686](https://doi.org/10.1080/01621459.2023.2197686)
