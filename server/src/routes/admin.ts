import { Router, Request, Response } from 'express';
import { store } from '../data/store';
import { RegionCode } from '../types';

const router = Router();

router.get('/skill/:region', (req: Request, res: Response) => {
    const raw = Array.isArray(req.params.region) ? req.params.region[0] : String(req.params.region || '');
    const region = raw.toUpperCase() as RegionCode;
    res.json(store.getSkillHistory(region));
});

router.get('/skill-history/:region', (req: Request, res: Response) => {
    const raw = Array.isArray(req.params.region) ? req.params.region[0] : String(req.params.region || '');
    const region = raw.toUpperCase() as RegionCode;
    res.json(store.getSkillHistory(region));
});

router.get('/backtest', (req: Request, res: Response) => {
    const region = req.query.region ? ((req.query.region as string).toUpperCase() as RegionCode) : undefined;
    res.json(store.getBacktestResults(region));
});

router.get('/models', (_req: Request, res: Response) => {
    res.json([
        { 
            source: 'NWP_GFS', 
            name: 'Global Forecast System (GFS)',
            agency: 'NOAA / NCEP (USA)', 
            type: 'Hydrostatic Primitive Equation NWP',
            horizontalResolution: '0.25° (~22 km)',
            temporalResolution: '1h to 3h',
            runCycles: ['00Z', '06Z', '12Z', '18Z'],
            relativeStrength: 'Superior performance at extended forecast horizons (+72h to +96h)',
            knownBias: 'Tendency to over-disperse monsoon synoptic precipitation in maritime Ghats'
        },
        { 
            source: 'NWP_ECMWF', 
            name: 'Integrated Forecasting System (IFS)',
            agency: 'ECMWF (Europe)', 
            type: 'Non-hydrostatic Spectral Global NWP',
            horizontalResolution: '0.1° (~9 km)',
            temporalResolution: '1h to 3h',
            runCycles: ['00Z', '12Z'],
            relativeStrength: 'Top benchmark globally for mid-range synoptic pressure & wind fields',
            knownBias: 'Conservative convective initiation in extreme monsoon bursts'
        },
        { 
            source: 'AI_GRAPHCAST', 
            name: 'GraphCast GNN Weather Predictor',
            agency: 'Google DeepMind', 
            type: 'Autoregressive Spatial Graph Neural Network',
            horizontalResolution: '0.25° (~28 km)',
            temporalResolution: '6h steps',
            runCycles: ['00Z', '12Z'],
            relativeStrength: 'Exceptional speed and high precision on short-range (+24h) convective dynamics',
            knownBias: 'Smoothing effect on extreme values beyond +72h due to autoregressive error accumulation'
        }
    ]);
});

router.post('/pipeline/trigger', (_req: Request, res: Response) => {
    const result = store.runPipeline();
    res.json(result);
});

router.post('/pipeline/run', (_req: Request, res: Response) => {
    const result = store.runPipeline();
    res.json(result);
});

router.get('/pipeline/status/:id', (req: Request, res: Response) => {
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
