import app, { ensureStoreInitialized } from './app';

const PORT = process.env.PORT || 3001;

async function start() {
    console.log('Loading data and running pipeline...');
    ensureStoreInitialized();
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
