import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js';
const rackRouter = Router()
import {
  createRack,
  getAllRacks,
  updateRackById,
  getRackById,
  deleteRackById,
  createRackOrder,
  getRackOrderById,
  updateRackOrderById,
  deleteRackOrderById,
  getRackOrdersByRowId,
   getAllRackOrders
} from "../Controllers/OrderController.js";
rackRouter.post('/', VerifyToken, createRack);
rackRouter.get('/', VerifyToken, getAllRacks);
rackRouter.get('/:id', VerifyToken, getRackById);
rackRouter.put('/:id', VerifyToken, updateRackById);
rackRouter.delete('/:id', VerifyToken, deleteRackById);
rackRouter.post('/rackOrders', createRackOrder);
rackRouter.get('/rackOrders', getAllRackOrders);
rackRouter.get('/rackOrders/:id', getRackOrderById);
rackRouter.put('/rackOrders/:id', updateRackOrderById);
rackRouter.delete('/rackOrders/:id', deleteRackOrderById);
rackRouter.get('/rackOrders/row/:rowId', getRackOrdersByRowId);
export default rackRouter;