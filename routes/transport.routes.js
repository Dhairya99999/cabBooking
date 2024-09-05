import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { getAvailableTransportController } from '../controllers/transport.controller.js';

const transportRouter = express.Router();

transportRouter.get('/transport-listing', getAvailableTransportController);

export default transportRouter;