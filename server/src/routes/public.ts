import { Router, Request, Response } from 'express';
import { store } from '../data/store';
import { RegionCode, Variable, REGIONS_METADATA } from '../types';

const router = Router();

const VALID_REGIONS = Object.keys(REGIONS_METADATA) as RegionCode[];
const VALID_VARIABLES: Variable[] = ['rainfall_mm', 'temp_c', 'wind_kmh'];

function validateRegion(regionParam: string | string[] | undefined): RegionCode | null {
    const raw = Array.isArray(regionParam) ? regionParam[0] : (regionParam || '');
    const upper = String(raw).toUpperCase() as RegionCode;
    if (VALID_REGIONS.includes(upper)) return upper;
    return null;
}

// Location endpoints
router.get('/locations', (_req: Request, res: Response) => {
    res.json(store.getAllLocations());
});

router.get('/locations/:region', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ 
            error: 'Invalid region code', 
            validRegions: VALID_REGIONS 
        });
    }
    res.json(store.getLocationMetadata(region));
});

// Blended forecast
router.get('/forecast/:region', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ 
            error: 'Invalid region code', 
            validRegions: VALID_REGIONS 
        });
    }
    const data = store.getLatestBlended(region);
    if (!data) {
        return res.status(404).json({ error: `No active forecast found for region ${region}` });
    }
    res.json(data);
});

router.get('/forecast/:region/:variable', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ error: 'Invalid region code', validRegions: VALID_REGIONS });
    }
    const variable = req.params.variable as Variable;
    if (!VALID_VARIABLES.includes(variable)) {
        return res.status(400).json({ error: 'Invalid variable', validVariables: VALID_VARIABLES });
    }

    const data = store.getLatestBlended(region);
    if (!data) return res.status(404).json({ error: 'Not found' });
    
    const filtered = {
        ...data,
        forecast: {
            [variable]: data.forecast[variable] || {}
        }
    };
    res.json(filtered);
});

// Weights
router.get('/weights/:region', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ error: 'Invalid region code', validRegions: VALID_REGIONS });
    }
    res.json(store.getWeights(region));
});

// Extreme alerts
router.get('/alerts', (req: Request, res: Response) => {
    const regionParam = req.query.region as string | undefined;
    const region = regionParam ? validateRegion(regionParam) : undefined;
    res.json(store.getAlerts(region || undefined));
});

router.get('/alerts/:region', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ error: 'Invalid region code', validRegions: VALID_REGIONS });
    }
    res.json(store.getAlerts(region));
});

// Meteorological insights
router.get('/insights/:region', (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ error: 'Invalid region code', validRegions: VALID_REGIONS });
    }
    res.json(store.getWeatherInsights(region));
});

// Verification summary
router.get(['/verification/:region', '/verification-summary/:region'], (req: Request, res: Response) => {
    const region = validateRegion(req.params.region);
    if (!region) {
        return res.status(400).json({ error: 'Invalid region code', validRegions: VALID_REGIONS });
    }
    res.json(store.getVerificationSummary(region));
});

export default router;
