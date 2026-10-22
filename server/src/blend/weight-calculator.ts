import { ModelSource } from '../types';

/**
 * Computes regularized inverse-MAE blend weights with Laplace shrinkage.
 * 
 * Formula:
 * raw_score_i = 1 / (MAE_i + epsilon)
 * normalized_i = raw_score_i / sum(raw_score_j)
 * regularized_w_i = (1 - lambda) * normalized_i + lambda * (1 / M)
 * 
 * Where:
 * - epsilon = 0.05 prevents division by zero
 * - lambda = 0.15 acts as a shrinkage parameter toward equal-weight prior (prevents overfitting)
 * - All weights are strictly positive and guaranteed to sum to 1.0
 */
export function calculateWeights(
    maes: Record<string, number>,
    shrinkageLambda: number = 0.15
): Record<string, Record<ModelSource, number>> {
    const groups: Record<string, { model: ModelSource; mae: number }[]> = {};
    
    for (const key in maes) {
        const [region, lead, variable, regime, model] = key.split('|');
        const groupKey = `${region}|${lead}|${variable}|${regime}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push({ model: model as ModelSource, mae: maes[key] });
    }

    const epsilon = 0.05;
    const weights: Record<string, Record<ModelSource, number>> = {};

    for (const groupKey in groups) {
        const group = groups[groupKey];
        const M = group.length;

        if (M === 0) continue;

        if (M === 1) {
            weights[groupKey] = { [group[0].model]: 1.0 } as Record<ModelSource, number>;
            continue;
        }

        let totalRawScore = 0;
        const rawScores = group.map(g => {
            // Protect against negative or NaN MAE
            const cleanMae = Math.max(0, isNaN(g.mae) ? 5.0 : g.mae);
            const score = 1 / (cleanMae + epsilon);
            totalRawScore += score;
            return { model: g.model, score };
        });

        const groupWeights: Partial<Record<ModelSource, number>> = {};
        let sumWeights = 0;

        for (const s of rawScores) {
            const normalized = totalRawScore > 0 ? s.score / totalRawScore : 1 / M;
            // Apply shrinkage toward uniform baseline (1/M)
            const regularized = (1 - shrinkageLambda) * normalized + shrinkageLambda * (1 / M);
            groupWeights[s.model] = regularized;
            sumWeights += regularized;
        }

        // Final normalization pass to ensure exact 1.0 sum
        for (const modelKey in groupWeights) {
            const m = modelKey as ModelSource;
            groupWeights[m] = (groupWeights[m] || 0) / sumWeights;
        }

        weights[groupKey] = groupWeights as Record<ModelSource, number>;
    }

    return weights;
}
