import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomerById,
  createOrder,
  getAllOrders,
  getOrderByUserId,
  updateOrderByCustomerId
} from "../Controllers/OrderController.js";

const clientOrderRouter = Router();

// ============================ Customer Routes ============================
clientOrderRouter.route('/customers')
  .post(createCustomer)
  .get(VerifyToken, getAllCustomers);
clientOrderRouter.route('/customers/:id')
  .get(VerifyToken, getCustomerById)
  .patch(VerifyToken, updateCustomerById); 

// ============================ Order Routes ============================
clientOrderRouter.route('/')
  .post(VerifyToken, createOrder)
  .get(VerifyToken, getAllOrders)

// Get a specific order by userId
clientOrderRouter.route('/:userId')
  .get(VerifyToken, getOrderByUserId)
  .patch(VerifyToken, updateOrderByCustomerId)

export default clientOrderRouter;
