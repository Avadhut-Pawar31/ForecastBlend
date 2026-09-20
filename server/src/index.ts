import express from 'express';
import cors from 'cors';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';
import { store } from './data/store';

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.use('/api/v1', publicRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

const PORT = 3001;

async function start() {
    console.log('Loading data and running pipeline...');
    store.load();
    store.runPipeline();
    console.log('Pipeline complete.');
    
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please stop the running server on port ${PORT} and try again.`);
            process.exit(1);
        } else {
            console.error('Server failed to start:', err);
            process.exit(1);
        }
    });
}

start();
