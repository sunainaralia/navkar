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
  updateOrder,
  getOrderByTrackingCode,
  getOrderStatusSummary,
  getAllOrdersByCustomerOfIdAndStatus,
  getOrderStatusSummaryForDriver,
  getOrdersByStatusForDriver,
  getOrderByOrderToken
} from "../Controllers/OrderController.js";

const clientOrderRouter = Router();
// get order by scanner or order_token
clientOrderRouter.route("/order-token/:order_token")
  .get(VerifyToken, getOrderByOrderToken)
// get total no of order status acc.to the driver id 
clientOrderRouter.route("/sum-order-driver/")
  .get(VerifyToken, getOrderStatusSummaryForDriver)
clientOrderRouter.route("/driver-order/")
  .get(VerifyToken, getOrdersByStatusForDriver)
// get total no  of all order status
clientOrderRouter.route("/sum-order")
  .get(VerifyToken, getOrderStatusSummary)
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
clientOrderRouter.route('/:recieverId')
  .get(VerifyToken, getOrderByUserId)
  .patch(VerifyToken, updateOrder)

// get all order logs using tracking code
clientOrderRouter.route("/track-order/:track_order")
  .get(VerifyToken, getOrderByTrackingCode)

// get all order according to client id 
clientOrderRouter.route("/order-client/:customerOfId")
  .get(VerifyToken, getAllOrdersByCustomerOfIdAndStatus)

export default clientOrderRouter;
