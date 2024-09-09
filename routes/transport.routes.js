import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import { getAvailableTransportController, getGoodsController, getTransportVehicleDetailsController, triggerParcelRequestController, cancelRideRequestController, completeRideController } from '../controllers/transport.controller.js';

const transportRouter = express.Router();

transportRouter.get('/transport-listing', getAvailableTransportController);
transportRouter.post('/transport-details', getTransportVehicleDetailsController);
transportRouter.get('/goods-list/:category_id', getGoodsController);
transportRouter.post('/trigger-parcel-request', verifyToken, triggerParcelRequestController);
transportRouter.post('/cancel', verifyToken, cancelRideRequestController);
transportRouter.post('/completed', completeRideController);

export default transportRouter;