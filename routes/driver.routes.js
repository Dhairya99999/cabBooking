import express from 'express';
import { updateLocationController } from '../controllers/driver.controller.js';

const driverRouter = express.Router();

driverRouter.post('/update-location', updateLocationController);


export default driverRouter;
