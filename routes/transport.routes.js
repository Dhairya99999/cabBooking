import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { getAvailableTransportController, getGoodsController, getTransportVehicleDetailsController } from '../controllers/transport.controller.js';

const transportRouter = express.Router();

transportRouter.get('/transport-listing', getAvailableTransportController);
transportRouter.post('/transport-details', getTransportVehicleDetailsController);
transportRouter.get('/goods-list/:category_id', getGoodsController);

export default transportRouter;