## Abstract

Inferring an individual's artistic preferences from only a few ratings is a constrained recommendation problem. This technical case study describes an Art-to-Art system that uses six artwork valuations to estimate preferences over a larger collection. A cohort of 37 participants who evaluated 400 paintings provides the reference data. The deployed predictor combines a rank-12 principal component representation, Ridge regression, and latent-space cosine similarity, and samples the six input artworks from a Utility-selected pool of 200 paintings. Under a 37-participant leave-one-participant-out (LOPO) evaluation, with fold-specific input selection and 30 matched six-artwork sets per participant, the fixed hybrid attained mean Spearman correlation **0.469641**, compared with **0.440568** for the reference-participant mean (paired difference **+0.029073**, exploratory 95% participant-bootstrap interval **[+0.016254, +0.042632]**). Its mean correlation was highest among six methods compared under the same inputs, although the difference from latent cosine similarity alone was small (**+0.001081**, interval **[−0.002982, +0.004853]**). The reference-mean baseline yielded a slightly higher nDCG@10. Numerical checks linked the archived research predictor and the local copy of the production inference implementation for selected test cases. These findings support the hybrid as a defensible system configuration for the specified input-selection policy; they do not establish an independently validated optimal model or measured recommendation accuracy for the separate candidate collection used by the live application.

## Relationship to the published project

This report is a **technical companion to the existing [Art & Museum Recommender project](/projects/art-museum-recommender/)**, not a new application or a second participant study. The portfolio page introduces the visitor experience, interface, and deployment; this report documents how the deployed prediction rule was implemented, tested, and compared with alternatives. Both refer to the same [live service](https://zoe-art.cloud.run/). The additional comparisons were performed retrospectively on the original cohort and are not an independent confirmation of model optimality.

## 1. Problem and scope

The application asks a new visitor to evaluate six paintings and uses those evaluations to estimate a relative preference profile. Its web interface presents recommended and contrasting artworks selected from a separate candidate collection. The objective is to personalize the ordering of artworks using limited feedback, not to appraise the artworks' monetary market value.

This report documents the prediction method, validation design, post-hoc model comparisons, and implemented inference workflow. It is an engineering and research case study rather than an independent, preregistered confirmatory study. In particular, the reported experiments evaluate preference prediction on paintings with observed reference-participant responses; they do **not** measure visitor satisfaction or prediction accuracy on the separate candidate collection used by the web application.

## 2. Data provenance and prediction task

The reference Art responses originate from the behavioral cohort described by **Pham and Chikazoe (2026)** [1]. In that study, 37 participants assessed 400 artworks using a subjective **monetary valuation task**; the original experiment allowed valuations from JPY 100 to JPY 10,000,000. The underlying study also investigated aesthetic preferences in other domains. The present Art-to-Art model and its Spearman/nDCG evaluation are **distinct from that paper's cross-domain prediction analysis**; correlations reported by the original paper should not be equated with those in this case study.

The recommender uses a processed **400-artwork × 37-participant** rating matrix for model fitting and validation. The original study reports participant-level normalization for cross-domain analysis; the precise transformation history of this application’s stored matrix has not been independently reconstructed for this report. Each prediction request obtains six numerical evaluations for six paintings selected from that 400-artwork reference set. The remaining **394** artworks have observed ratings for the held-out study participant and constitute the validation targets. No image pixels, image embeddings, or art-historical labels are used by the six prediction formulas compared here.

The application also uses a separate collection of artworks for display, with reference-participant responses estimated by an upstream model rather than observed directly. That collection is **not a test set in this study**. The reported evaluation concerns only prediction on the original artworks with observed valuations.

## 3. Prediction model

### 3.1 Offline PCA representation

Let `Y` be an `n × 400` training-participant rating matrix. For the deployed model, `n = 37`; for each outer test fold, `n = 36`. Subtract each painting's **training-participant** mean, giving residual matrix `R`, and compute a singular value decomposition:

```text
R = U Σ Vᵀ
Z = U[:, 1:12] Σ[1:12, 1:12]       shape: n × 12
```

`Z` represents reference participants' relative preferences in a twelve-dimensional space. PCA is computed from the full reference cohort **only when preparing the production assets**. During cross-validation, PCA is refitted using the corresponding training participants so that no outer-test participant enters the fitted representation.

### 3.2 Six-rating normalization and Ridge inference

For a selected set of six paintings, let `X` contain their six evaluations by each training participant (`n × 6`) and `q` the visitor's six evaluations (`1 × 6`). Each row is centered and divided by its root-mean-square deviation across the **same six inputs**. If all input values are identical, the implementation uses a reference-mean fallback.

Let `x_bar` denote the column-wise mean of the normalized reference inputs, and `Xc = X − x_bar`. The online Ridge calculation is:

```text
B     = (Xcᵀ Xc + αI)⁻¹ Xcᵀ Z       α = 100
z_hat = (q − x_bar) B               shape: 1 × 12
```

This small Ridge fit is recalculated for each selected six-painting set. It does **not** refit the offline PCA representation.

### 3.3 Similarity and reference-participant coefficients

The model compares `z_hat` to reference participant `i`'s latent vector `Z_i` using cosine similarity `s_i`. Similarities are converted to nonnegative weights:

```text
s_i = cosine(z_hat, Z_i)
w_i = exp(2γ s_i) / Σ_k exp(2γ s_k)    γ = 1
```

A separate vector of reference-participant coefficients is obtained from the pseudoinverse of `Z`:

```text
a = z_hat Z⁺
c = βa + (1 − β)w                    β = 0.5
```

Because `a` may contain negative coefficients, the resulting `c` is **not necessarily a convex combination of participant ratings**. The displayed configuration combines the Ridge-derived coefficients and the similarity-derived weights equally.

### 3.4 Prediction score and evaluation boundary

For an artwork `j`, let `μ_j` denote its mean response across the available reference participants and `r_j` its vector of participant-specific deviations. The estimated score is:

```text
score_j = μ_j + λ (r_j · c)           λ = 1
```

**In cross-validation**, `μ_j` and `r_j` are derived from the **36 training participants' observed valuations** for the original paintings. Performance is evaluated against the held-out participant's valuations on the other 394 paintings. **In deployment**, the same prediction rule is applied to a separate candidate collection using upstream *predicted* reference-participant responses. No ground-truth accuracy on that separate collection is reported here. The final web display is also controlled by a distinct result selector and is not itself evaluated by the ranking metrics.

### 3.5 Fixed deployed configuration

| Component | Setting |
|---|---|
| PCA rank | 12 |
| Ridge regularization `α` | 100 |
| Latent cosine-softmax concentration `γ` | 1 |
| Ridge/similarity coefficient mixing | 50% / 50% (`β = 0.5`) |
| Residual multiplier `λ` | 1 |
| Input presentation | Six distinct artworks, sampled uniformly from approved Utility Top200 |
| Result-selection backend | `legacy` (separate from prediction) |

The parameter values above describe the **deployed fixed configuration**. They should not be interpreted as a unique statistical optimum over all possible configurations.

## 4. Evaluation protocol

![Figure 1. Participant-level nested LOPO evaluation with fold-local artwork selection.](/images/projects/art-museum-recommender/validation_design.svg)

**Figure 1.** *Training-only input selection and participant-held-out evaluation.* Each of 37 outer LOPO folds separates 36 training participants from one held-out participant. Within the training partition, the fixed Hybrid is assessed in 36 inner LOPO folds over 600 balanced six-artwork sets (each of 400 artworks appears nine times), yielding a fold-specific Utility Top200. Thirty six-artwork inputs sampled from this pool are shared across the six prediction conditions. The held-out person's six input valuations support prediction; their other 394 observed valuations are reserved for scoring. Metrics are aggregated within person before averaging over 37 people. The outer folds do not reuse the full-cohort Top200 asset deployed by the app.

### 4.1 Outer-LOPO and fold-local input selection

The evaluation has **37 outer folds**: one participant is held out and the remaining 36 provide all model-fitting and artwork-selection information. The six input artworks are available as ratings at inference time; the held-out person's ratings for all other paintings are used **only to score predictions**.

For each outer fold, input-painting Utility is estimated entirely within the 36-person training partition:

1. Generate **600 balanced six-artwork sets** from 400 paintings, without repetitions within a set. Each painting occurs exactly **nine times** across the 600 sets.
2. Evaluate the six-artwork sets using **36 inner participant-LOPO folds**, each with 35 inner-training participants and one inner-validation participant.
3. For each six-artwork set, calculate its mean **Spearman improvement over the corresponding reference-mean baseline**, evaluated only on its other 394 artworks. Each painting's Utility is the average improvement of the nine sets in which it appears.
4. Rank all 400 artworks by Utility, select the best **200**, and draw six different artworks uniformly from this **fold-specific** pool for outer-test prediction.

Utility characterizes how informative an artwork is **as part of six-item groups**; it does not isolate an artwork's causal contribution. In the final deployed system, a Top200 pool was prepared using the 37 available reference participants. **That full-cohort Top200 was not substituted into the outer test folds**, which would undermine the participant-held-out evaluation.

### 4.2 Matched outer evaluation

For each outer-test participant, **30** six-artwork sets were drawn from that fold's Top200. Each compared method received the **same sets**. Ratings of the six inputs were provided to the predictor, while their painting IDs were excluded from the 394-artwork target set for both model and baseline scoring.

Spearman was the primary metric for the model comparison and input-Utility construction; nDCG@10 was reported as a complementary head-of-ranking metric. The two outcomes are:

- **Spearman correlation:** the rank correlation between predicted and observed valuations over the **394 unobserved target paintings**. This assesses the overall ordering of the original study paintings.
- **nDCG@10:** the normalized discounted cumulative gain of the ten **highest-predicted** target paintings, with gain defined as each held-out participant's observed value minus the **minimum observed value among the same 394 target paintings**. Gains are discounted by `1/log2(position + 1)` and divided by the ideal DCG of the ten highest-observed targets [2]. This is a *head-of-ranking proxy*, not a direct score for all cards actually shown by the application's result selector.

Metrics were averaged first across 30 sets per participant and then across the **37 participants**. The **1,110 six-rating sessions are not treated as 1,110 independent subjects**. For model differences, the reported exploratory intervals were computed by **10,000 paired participant-level bootstrap resamples**, using the **2.5th and 97.5th percentiles**; they are **not corrected for multiple comparisons**. Because the LOPO training partitions overlap and the same cohort was used for model exploration, these intervals should not be interpreted as coverage-validated confirmatory inference [3, 4].

### 4.3 Scope of the comparison

The six-condition comparison described next was assembled **after** exploratory model development on the same participant cohort. The fixed production hybrid's fold-local Utility Top200 pools and input sextets were reused for all methods; the hybrid and Reference Mean scores were numerically reproduced from the archived experiment in all 37 outer folds. This provides a **matched-input diagnostic under the production input policy**, rather than an independently selected winner or a comparison where every model gets to optimize its own input selection.

## 5. Results

The analyses below summarize a **post-hoc matched-input comparison** on the same cohort used during model development. The resulting means and intervals are descriptive/exploratory; an independent validation cohort was not available.

### 5.1 Mean ranking performance

**Table 1.** Participant-mean ranking performance under 30 matched Top200 inputs per held-out person.

| Model / fixed condition | Spearman ↑ | nDCG@10 ↑ |
|---|---:|---:|
| Reference Mean | 0.440568 | **0.536028** |
| Residual Ridge (`α = 100`) | 0.463976 | 0.531080 |
| Input-space RBF similarity (`γ = 1`) | 0.466086 | 0.528435 |
| PCA-based Ridge prediction (12 PCs; `β = 1`) | 0.465082 | 0.531696 |
| Ridge-inferred latent cosine similarity (12 PCs; `β = 0`) | 0.468560 | 0.526518 |
| **Fixed Hybrid (12 PCs; `β = 0.5`)** | **0.469641** | 0.532717 |

![Figure 2. Mean Spearman correlation for the six matched-input prediction conditions.](/images/projects/art-museum-recommender/six_model_spearman.svg)

**Figure 2.** *Mean Spearman correlation under the matched-input Top200 policy.* Each point is the unweighted mean of 37 participant-level scores (each participant's score is first averaged across 30 common six-artwork presentations). The horizontal axis is **truncated** to make small differences visible. The diamond identifies Reference Mean and the square identifies the fixed Hybrid. **No uncertainty intervals are shown in this figure**; paired participant-bootstrap intervals appear in Table 2. Because the fold-local Top200 inputs were selected for the fixed Hybrid, this is a retrospective system-policy comparison rather than an independently controlled contest of the six algorithms.

**Model terminology.** “PCA-based Ridge” uses only the direct Ridge-derived component (`β = 1`). “Ridge-inferred latent cosine similarity” uses the same six-input Ridge projection to estimate a 12-PC latent vector, but predicts through cosine-softmax reference-participant weighting alone (`β = 0`); it is **not a model without Ridge regression**. The fixed Hybrid mixes these two output components (`β = 0.5`). The input-space RBF comparator computes participant similarity directly from the standardized six-artwork valuation patterns, not from artwork pixels or image features. These names are descriptive, not additional independently trained production models.

### 5.2 Paired differences from the fixed Hybrid

**Table 2.** Post-hoc paired Spearman differences, resampling 37 participant-level paired scores (10,000 percentile bootstrap draws; unadjusted intervals).

| Comparator | Hybrid − comparator, Spearman | Exploratory paired 95% bootstrap interval |
|---|---:|---|
| Reference Mean | **+0.029073** | **[+0.016254, +0.042632]** |
| Residual Ridge | +0.005665 | [+0.001719, +0.009965] |
| Input-space RBF | +0.003555 | [+0.000726, +0.006358] |
| PCA-based Ridge prediction | +0.004560 | [+0.000732, +0.008731] |
| Ridge-inferred latent cosine similarity | **+0.001081** | **[−0.002982, +0.004853]** |

**Table 3.** Supporting post-hoc paired nDCG@10 comparisons (same participant-level bootstrap; unadjusted 95% intervals):

| Comparator | Hybrid − comparator, nDCG@10 | Exploratory paired 95% bootstrap interval |
|---|---:|---|
| Reference Mean | −0.003311 | [−0.018460, +0.010652] |
| Residual Ridge | +0.001638 | [−0.005580, +0.008042] |
| Input-space RBF | +0.004282 | [−0.002099, +0.009853] |
| PCA-based Ridge prediction | +0.001021 | [−0.005767, +0.007116] |
| Ridge-inferred latent cosine similarity | +0.006199 | [+0.000051, +0.013357] |

The fixed hybrid had the **highest descriptive mean Spearman** among the six conditions. Relative to Reference Mean, its mean improvement was `+0.029073`. Relative to latent cosine similarity alone, the gain was only `+0.001081`, and the corresponding interval includes zero; the data do not establish a practically meaningful improvement in overall correlation due to the 50:50 blend.

The head-of-ranking outcome differs. The hybrid's nDCG@10 exceeded that of latent cosine similarity alone by **+0.006199** (exploratory paired interval **[+0.000051, +0.013357]**) but was below the Reference Mean by **−0.003311** (interval **[−0.018460, +0.010652]**). The lower bound for the similarity comparison is near zero, and these are post-hoc, multiple, unadjusted comparisons; the result **does not provide robust confirmatory evidence that blending improves top-ten relevance**.

### 5.3 Supporting analyses with different input policies

A separate **nested-LOPO** study used six inputs drawn uniformly from all 400 paintings, rather than from Utility Top200, and selected model hyperparameters within its training folds. Under those **different conditions**, Ridge-inferred latent cosine similarity obtained Spearman **0.465612**, the tuned hybrid-family condition **0.464565**, and Reference Mean **0.440104**. These values must **not** be compared as if they arose from the same experiment as the Top200 results above.

Exploratory rank sensitivity analysis under the all-400 Random6 policy yielded **0.464512** for rank 12 and **0.465612** for rank 20, with paired rank12-minus-rank20 interval **[−0.002895, +0.000851]**. This does **not** establish equivalence, non-inferiority, or that rank 12 is uniquely optimal. Separately varying the Ridge mixture in the Random6 latent-similarity setting did not establish a consistent advantage from adding Ridge. These results characterize sensitivity and limitations; **they were not used as independent confirmation of the deployed rank-12, 50:50 mixture**.

## 6. Engineering implementation and verification

The deployed application uses **Python/FastAPI**, precomputed model assets, a bilingual interface, and **Google Cloud Run** in the Tokyo region. The reference PCA basis, fixed hyperparameters, and approved Top200 input pool are prepared offline. Per request, the implementation performs the small Ridge regression, latent similarity calculation, and coefficient-based inference. The displayed candidate collection is separate from the observed paintings used in the performance evaluation.

Recorded implementation checks include:

- **Asset integrity.** All six expected artifact hashes matched their approved SHA-256 values: reference data, candidate-prediction matrix, candidate filter, PCA basis, selected parameters, and Top200 file.
- **Numerical agreement.** Three nonconstant input cases yielded maximum absolute differences of about **1.14 × 10⁻¹³** for candidate-scoring parity and **4.55 × 10⁻¹³** when comparing the 400-artwork reconstruction against the archived research predictor. These are numerical consistency checks on selected inputs, **not** a general proof of correctness.
- **Fallback.** Exactly equal ratings on all six input artworks triggered the candidate-specific Reference Mean fallback.
- **Deployed configuration.** The November 11, 2026 Cloud Run inspection identified revision **`art-museum-recommender-00028-lep`** as receiving **100% of service traffic**, with predictor `similarity_pca_ridge_rank12_fixed`, input selector `top200`, and result selector `legacy`.

The numerical parity check is local to the validated assets and implementation. The configuration check confirms the reported production revision and selectors, but neither check establishes that the upstream predicted GAC preferences reflect visitors' actual judgments.

## 7. Discussion and limitations

**Model selection.** The matched-input comparison favors the fixed hybrid descriptively for global ranking, but it was carried out after exploration on the **same cohort**. Top200 input pools were chosen using this hybrid, potentially favoring it over alternatives. The fixed parameter values therefore have a **defensible engineering rationale**, not independent evidence of an optimum. The earlier broader Random6 analysis also demonstrates that model rankings can change with the input-selection policy.

**Statistical uncertainty.** Thirty inputs for each participant quantify variation in sampled six-item sets; they do not increase the number of independent participants beyond 37. Each outer fold trains on 36 people whereas the deployed predictor uses all 37, so the cross-validated number estimates the 36-reference-participant training procedure rather than evaluating that exact fitted production instance. Bootstrap intervals resample participants but do not fully account for all dependencies induced by overlapping training folds and post-selection decisions. In a small exploratory cohort, even intervals excluding zero must be interpreted cautiously [3, 4].

**Construct validity and generalization.** The original study measured subjective **monetary artwork valuations**. Correlation among those judgments is a measurable proxy for preference ordering, but not an assessment of a visitor's satisfaction, museum interests, artistic-style diversity, or real-world recommendation usefulness. The original cohort and paintings are limited, and no external cohort was available to confirm transportability. No new user study was conducted for the web application.

**Candidate-set validation.** The live application scores a separate candidate collection using **predicted reference-participant responses** from an upstream process whose error is not evaluated here. Ground-truth participant ratings and new-visitor judgments for that collection were unavailable. Thus, results on the original 394 targets should not be interpreted as measured live recommendation accuracy. nDCG@10 evaluates the top ten *predicted* target paintings, not the final displayed matches and contrasts.

**Data and ethics.** This work reanalyzes data from the published study [1] and does not report newly collected human-subject data. The original paper documents its ethics approval and consent procedures. This report does not redistribute participant-level ratings or candidate artwork images. It makes no independent claims about rights to redistribute those materials.

## 8. Conclusion

This case study demonstrates a workflow connecting low-dimensional preference representation, six-rating inference, matched-input model evaluation, and software-level validation of the implemented predictor. Under the model-specific Utility Top200 policy, the fixed rank-12 PCA-based Ridge–Cosine Similarity hybrid produced the highest **descriptive mean Spearman correlation** among the six compared methods, while Reference Mean achieved a slightly better nDCG@10. The evidence therefore supports a **qualified deployment decision**, not a claim of universally superior prediction or independently validated recommendation quality for the live candidate set.

**[Live application](https://zoe-art.cloud.run/)** · **[Laboratory announcement](https://zoelabo.com/archives/735)**

## References

[1] Pham, T. Q., & Chikazoe, J. (2026). *Cross domain consistency of aesthetic preference-driven social behavior*. **Frontiers in Neural Circuits, 20**, 1793443. https://doi.org/10.3389/fncir.2026.1793443

[2] Järvelin, K., & Kekäläinen, J. (2002). *Cumulated gain-based evaluation of IR techniques*. **ACM Transactions on Information Systems, 20**(4), 422–446. https://doi.org/10.1145/582415.582418

[3] Cawley, G. C., & Talbot, N. L. C. (2010). *On over-fitting in model selection and subsequent selection bias in performance evaluation*. **Journal of Machine Learning Research, 11**, 2079–2107. https://www.jmlr.org/papers/v11/cawley10a.html

[4] Bates, S., Hastie, T., & Tibshirani, R. (2024). *Cross-validation: What does it estimate and how well does it do it?* **Journal of the American Statistical Association, 119**(546), 1434–1445. https://doi.org/10.1080/01621459.2023.2197686
