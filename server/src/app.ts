import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { store } from './data/store';

const app = express();

// Enable CORS for all origins in development and production
app.use(cors());
app.use(express.json());

// Lazy-initialization middleware to ensure data is loaded and pipeline is run
let isInitialized = false;
export function ensureStoreInitialized() {
    if (!isInitialized) {
        store.load();
        store.runPipeline();
        isInitialized = true;
    }
}

app.use((_req, _res, next) => {
    ensureStoreInitialized();
    next();
});

// Health check routes
app.get(['/health', '/api/health', '/api/v1/health'], (_req, res) => {
    res.json({
        status: 'ok',
        service: 'ForecastBlend API',
        timestamp: new Date().toISOString()
    });
});

// Public and Admin routes with all common prefixes
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

export { app };
export default app;
