import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { store } from './data/store';

const app = express();

// Enable CORS for all origins in development and production
app.use(cors());
app.use(express.json());

// Security and caching headers
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Lazy-initialization middleware to ensure data is loaded and pipeline is run
let isInitialized = false;
export function ensureStoreInitialized() {
    if (!isInitialized) {
        store.load();
        store.runPipeline();
        isInitialized = true;
    }
}

app.use((_req: Request, _res: Response, next: NextFunction) => {
    ensureStoreInitialized();
    next();
});

// Health check routes
app.get(['/health', '/api/health', '/api/v1/health'], (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'ForecastBlend Meteorological Intelligence Platform',
        version: '1.2.0',
        timestamp: new Date().toISOString()
    });
});

// Public and Admin routes with all standard prefixes
app.use('/api/v1', publicRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api', publicRoutes);
app.use('/api', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use('/v1', publicRoutes);
app.use('/v1', adminRoutes);

// 404 Handler for undefined API routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist on ForecastBlend API`,
        documentation: '/api/health'
    });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err?.message || 'An unexpected error occurred during weather processing.'
    });
});

export { app };
export default app;
