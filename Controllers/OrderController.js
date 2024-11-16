import { Customer } from '../Models/OrderOfClient.js';
import Order from '../Models/OrderOfClient.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';

// Create a new Customer
export const createCustomer = asyncFunHandler(async (req, res, next) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({
    success: true,
    msg: "Customer created successfully",
    data: customer
  });
});

// Get all Customers
export const getAllCustomers = asyncFunHandler(async (req, res, next) => {
  const customers = await Customer.find()
  res.status(200).json({
    success: true,
    data: customers
  });
});

// Get Customer by ID
export const getCustomerById = asyncFunHandler(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new CustomErrorHandler("Customer not found", 404));
  }
  res.status(200).json({
    success: true,
    data: customer
  });
});

// Update customer by ID with token verification
export const updateCustomerById = asyncFunHandler(async (req, res, next) => {
  const userId = await Customer.findById(req.params.id);

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  // If customer is not found
  if (!customer) {
    return next(new CustomErrorHandler("Customer not found", 404));
  }
  res.status(200).json({
    success: true,
    msg: "Customer updated successfully",
    data: customer,
  });
});

// Controller to create an order
export const createOrder = asyncFunHandler(async (req, res, next) => {
  const { userId, address2, service_type, msg, assigned_driver, reason, pickUpDate, DropUpDate, shift } = req.body;

  // Ensure customer exists
  const customer = await Customer.findById(userId);
  if (!customer) {
    return next(new CustomErrorHandler("Customer not found", 404));
  }

  // Create the order (track_order will be set automatically in the schema)
  const order = new Order({
    userId,
    address2,
    service_type,
    msg,
    assigned_driver,
    reason,
    pickUpDate,
    DropUpDate,
    shift
  });

  // Save the order, triggering the 'pre-save' middleware to set the track_order
  await order.save();

  res.status(201).json({
    success: true,
    msg: "Order created successfully",
    data: order
  });
});

// Controller to get all orders
export const getAllOrders = asyncFunHandler(async (req, res, next) => {
  const orders = await Order.find().populate('userId');
  res.status(200).json({
    success: true,
    data: orders
  });
});

// Controller to get an order by userId
export const getOrderByUserId = asyncFunHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Fetch the order using userId instead of order ID
  const order = await Order.findOne({ userId }).populate('userId');

  if (!order) {
    return next(new CustomErrorHandler("Order not found for the provided user ID", 404));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});


// Controller to update an order by ID
export const updateOrderByCustomerId = asyncFunHandler(async (req, res, next) => {
  const { customer_id } = req.params;
  const updatedOrder = await Order.findOneAndUpdate(
    { customer_id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedOrder) {
    return next(new CustomErrorHandler("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Order updated successfully",
    data: updatedOrder
  });
});

