import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app, { ensureStoreInitialized } from '../src/app';
import http from 'http';

describe('Server API Endpoints Integration Tests', () => {
    let server: http.Server;
    let baseUrl: string;

    beforeAll(async () => {
        ensureStoreInitialized();
        await new Promise<void>((resolve) => {
            server = app.listen(0, () => {
                const address = server.address();
                if (address && typeof address === 'object') {
                    baseUrl = `http://127.0.0.1:${address.port}`;
                }
                resolve();
            });
        });
    });

    afterAll(async () => {
        await new Promise<void>((resolve) => {
            server.close(() => resolve());
        });
    });

    it('GET /health returns 200 OK with service metadata', async () => {
        const res = await fetch(`${baseUrl}/health`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('ok');
        expect(data.service).toContain('ForecastBlend');
    });

    it('GET /api/v1/forecast/PUN returns valid multi-model blended forecast', async () => {
        const res = await fetch(`${baseUrl}/api/v1/forecast/PUN`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.region).toBe('PUN');
        expect(data.forecast).toBeDefined();
        expect(data.forecast.temp_c).toBeDefined();
        expect(data.forecast.rainfall_mm).toBeDefined();
        expect(data.forecast.wind_kmh).toBeDefined();
        expect(data.location).toBeDefined();
        expect(data.location.name).toBe('Pune');
    });

    it('GET /api/v1/forecast/INVALID returns 400 Bad Request with error explanation', async () => {
        const res = await fetch(`${baseUrl}/api/v1/forecast/INVALID`);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeDefined();
        expect(data.error).toContain('Invalid region code');
    });

    it('GET /api/v1/locations returns all configured meteorological stations', async () => {
        const res = await fetch(`${baseUrl}/api/v1/locations`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThanOrEqual(3);
        const pune = data.find((l: any) => l.code === 'PUN');
        expect(pune).toBeDefined();
        expect(pune.latitude).toBeCloseTo(18.52, 1);
    });

    it('GET /api/v1/insights/PUN returns rule-based data-grounded insights', async () => {
        const res = await fetch(`${baseUrl}/api/v1/insights/PUN`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
    });

    it('GET /api/v1/alerts returns extreme weather indicators', async () => {
        const res = await fetch(`${baseUrl}/api/v1/alerts`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
    });

    it('GET /api/v1/verification-summary/PUN returns empirical verification metrics', async () => {
        const res = await fetch(`${baseUrl}/api/v1/verification-summary/PUN`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.region).toBe('PUN');
        expect(data.totalEvaluations).toBeGreaterThan(0);
        expect(data.evalWindow).toBeDefined();
        expect(data.averageErrorReductionPct).toBeDefined();
    });
});
