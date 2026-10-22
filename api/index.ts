import type { Request, Response } from 'express';
import app, { ensureStoreInitialized } from '../server/src/app';

export default function handler(req: Request, res: Response) {
    ensureStoreInitialized();
    return app(req, res);
}

export { app };
