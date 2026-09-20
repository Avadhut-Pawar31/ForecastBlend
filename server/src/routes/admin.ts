import { Router } from 'express';
import { store } from '../data/store';
import { RegionCode } from '../types';

const router = Router();

router.get('/skill/:region', (req, res) => {
    const region = req.params.region as RegionCode;
    res.json(store.getSkillHistory(region));
});

router.get('/skill-history/:region', (req, res) => {
    const region = req.params.region as RegionCode;
    res.json(store.getSkillHistory(region));
});

router.get('/backtest', (req, res) => {
    res.json(store.getBacktestResults());
});

router.get('/models', (req, res) => {
    res.json([
        { source: 'NWP_GFS', type: 'physical' },
        { source: 'NWP_ECMWF', type: 'physical' },
        { source: 'AI_GRAPHCAST', type: 'ai' }
    ]);
});

router.post('/pipeline/trigger', (req, res) => {
    const result = store.runPipeline();
    res.json(result);
});

router.post('/pipeline/run', (req, res) => {
    const result = store.runPipeline();
    res.json(result);
});

router.get('/pipeline/status/:id', (req, res) => {
    res.json({
        executionId: req.params.id,
        status: 'SUCCEEDED',
        startedAt: new Date().toISOString(),
        stages: [
            { name: 'Ingest Model Outputs', status: 'SUCCEEDED' },
            { name: 'Normalize & Validate', status: 'SUCCEEDED' },
            { name: 'Compute Skill Scores', status: 'SUCCEEDED' },
            { name: 'Invoke Blend Weight Model', status: 'SUCCEEDED' },
            { name: 'Compute Blended Forecast', status: 'SUCCEEDED' },
            { name: 'Detect Extreme Conditions', status: 'SUCCEEDED' },
            { name: 'Run Backtest', status: 'SUCCEEDED' },
        ]
    });
});

export default router;
