# ForecastBlend Technical Architecture & Data Engineering Design

This document details the architectural decisions, scientific methodology, data flow, and runtime engineering that power the ForecastBlend weather intelligence platform.

---

## 1. Architectural Principles

1. **Deterministic & Grounded Computation**: No fabricated confidence percentages or synthetic accuracy claims. All blended predictions are mathematically derived from constituent model predictions and verified historical error scores.
2. **Graceful Degradation & Laplace Shrinkage**: When a model is offline or has missing data for a lead horizon, the weighting system does not fail or silently skew results. It recalculates the active sub-ensemble and applies Laplace shrinkage toward an equal-weight prior ($1/M$).
3. **Decoupled Client-Server Protocol**: The frontend dashboard interacts strictly via normalized REST APIs (`/api/v1/forecast/:region`, `/api/v1/verification/:region`, etc.), enabling independent scaling, headless execution, or serverless deployment (Vercel, AWS Lambda, Docker).
4. **Physical Meteorological Consistency**: Blended rainfall and sustained wind speed are strictly clamped to $\ge 0.0$. Standard deviations and confidence intervals reflect genuine model divergence rather than arbitrary heuristics.

---

## 2. Ingestion & Preprocessing Layer

### Multi-Model Inputs
ForecastBlend ingests multi-lead predictions across 3 distinct forecasting regimes:
- **NOAA GFS (0.25°)**: Physical hydrostatic model run globally 4 times daily. Captures synoptic wave propagation across the Arabian Sea.
- **ECMWF IFS (0.1°)**: High-resolution spectral non-hydrostatic global model. Known for superior precipitation boundary layer accuracy.
- **DeepMind GraphCast AI (0.25°)**: Autoregressive graph neural network running on an icosahedral spatial mesh. Predicts rapid mid-troposphere temperature advection with minimal computational overhead.

### Ground Truth Observations
- Sourced from in-situ automated synoptic weather stations (AWS) and post-hoc reanalysis baselines across Pune, Mumbai, and Nagpur.
- Observations are paired strictly with matching forecast cycle issue dates, lead horizons (+24h to +96h), and regional grid coordinates.
- **Strict Anti-Leakage Guard**: Skill scores for evaluating forecast $F(t_0, +h)$ are computed strictly using observations recorded prior to $t_0$.

---

## 3. Mathematical Formulation of the Blending Engine

### Inverse-MAE Regularization
Let $\mathcal{M} = \{ \text{GFS}, \text{ECMWF}, \text{GraphCast} \}$ be the active ensemble models.
For each variable $v \in \{ \text{rainfall}, \text{temp}, \text{wind} \}$, region $r$, and lead time $h$:

$$\text{MAE}_m = \frac{1}{K} \sum_{k=1}^K | \hat{y}_{m,k} - y_{obs, k} |$$

Raw inverse performance score:
$$S_m = \frac{1}{\text{MAE}_m + \epsilon}, \quad \epsilon = 0.05$$

Normalized softmax probability:
$$p_m = \frac{S_m}{\sum_{j=1}^M S_j}$$

Laplace shrinkage toward uniform prior ($1/M$ with shrinkage factor $\lambda = 0.15$):
$$\hat{w}_m = (1 - \lambda) p_m + \lambda \frac{1}{M}$$

### Weighted Expectation & Physical Bound
$$\bar{y} = \sum_{m=1}^M \hat{w}_m \hat{y}_m$$
$$y_{\text{final}} = \begin{cases} \max(0, \bar{y}) & \text{if } v \in \{ \text{rainfall\_mm}, \text{wind\_kmh} \} \\ \bar{y} & \text{if } v = \text{temp\_c} \end{cases}$$

### Inter-Model Dispersion & Model Agreement Index ($A$)
$$\sigma = \sqrt{\sum_{m=1}^M \hat{w}_m (\hat{y}_m - \bar{y})^2}$$

The Agreement Index $A \in (0, 1]$ normalizes this dispersion against domain-specific scale parameters $\sigma_{\text{ref}}$:
$$A = \exp\left( - \frac{\sigma}{\sigma_{\text{ref}}} \right)$$
- $\sigma_{\text{ref, rain}} = 8.0 \text{ mm}$
- $\sigma_{\text{ref, temp}} = 2.5 ^\circ\text{C}$
- $\sigma_{\text{ref, wind}} = 6.0 \text{ km/h}$

When models agree perfectly, $\sigma = 0 \implies A = 1.0$.

---

## 4. IMD Meteorological Extreme Detection

Alerts are triggered using established India Meteorological Department criteria:
- **Precipitation**: Heavy ($\ge 64.5\text{ mm}$), Very Heavy ($\ge 115.6\text{ mm}$), Extremely Heavy ($\ge 204.5\text{ mm}$).
- **Heatwave**: Advisory ($\ge 40^\circ\text{C}$), Heatwave Condition ($\ge 43^\circ\text{C}$), Severe ($\ge 45^\circ\text{C}$).
- **Gale Wind**: Watch ($\ge 50\text{ km/h}$), Gale Warning ($\ge 62\text{ km/h}$), Severe Gale ($\ge 88\text{ km/h}$).

All triggered indicators include:
1. Target time window.
2. Blended expected value and individual model predictions.
3. Official threshold reference.
4. Model agreement confidence percentage.
5. Mandatory advisory disclaimer directing users to official IMD civil protection bulletins.

---

## 5. Deployment & Runtime Operations

- **Production Serverless**: Hosted on Vercel with automated continuous deployment.
- **Serverless Handling**: In serverless environments, file writing (`fs.writeFileSync`) is intercepted via an in-memory generation fallback to prevent read-only filesystem errors (`EROFS`).
- **Caching**: HTTP responses carry `Cache-Control: public, max-age=60` to prevent redundant computations across identical forecast cycles while ensuring rapid updates on cycle issuance.
