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

// ////////////////////////////////Get all Customers////////////////////////////
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

/////////////////////////////// Update customer by ID ///////////////////////////////////
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

///////////////////////////////////// create order///////////////////////////////
export const createOrder = asyncFunHandler(async (req, res, next) => {
  const {
    userId, address2, service_type, msg,
    assigned_driver, pickUpDate,
    DropUpDate, shift
  } = req.body;

  // Ensure the customer exists
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
    pickUpDate,
    DropUpDate,
    shift,
    status_logs: [
      {
        status: "requested",
        timestamp: new Date(),
        note: "Order created with initial status as 'requested'",
      },
    ],
  });

  // Save the order
  await order.save();

  // Populate the userId field with user details
  const populatedOrder = await Order.findById(order._id).populate('userId');

  res.status(201).json({
    success: true,
    msg: "Order created successfully",
    data: populatedOrder,
  });
});

//////////////////////// Controller to get all orders //////////////////////////
export const getAllOrders = asyncFunHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { order_status } = req.query;

  // Calculate the skip value
  const skip = (page - 1) * limit;

  // Build the filter condition
  const filter = {};
  if (order_status) {
    filter.order_status = order_status; // Apply the status filter only if provided
  }

  // Get total count of orders matching the filter for pagination metadata
  const totalOrders = await Order.countDocuments(filter);

  // Fetch paginated orders
  const orders = await Order.find(filter)
    .populate('userId')
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: orders,
    msg: "Orders fetched successfully",
    pagination: {
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
    },
  });
});



//////////////////////////////  Controller to get an order by userId ///////////////////////
export const getOrderByUserId = asyncFunHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Fetch the order using userId instead of order ID
  const order = await Order.findOne({ userId }).populate('userId');

  if (!order) {
    return next(new CustomErrorHandler("Order not found for the provided user ID", 404));
  }

  res.status(200).json({
    success: true,
    data: order,
    msg: "order is retrieved successfully"
  });
});


///////////////////////////////// Controller to update an order by ID //////////////////////////////
export const updateOrderByCustomerId = asyncFunHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { order_status, assigned_driver, reason, ...updateData } = req.body;

  // Find the order for the given customer
  const order = await Order.findById(userId);
  if (!order) {
    return next(new CustomErrorHandler("Order not found", 404));
  }

  // Handle order status updates
  if (order_status && order_status !== order.order_status) {
    order.order_status = order_status;
    order.status_logs.push({
      status: order_status,
      timestamp: new Date(),
      note: `Order status updated to '${order_status}'`,
    });
  }

  // Handle driver assignments
  if (assigned_driver) {
    const isDriverAssigned =
      order.assigned_driver && order.assigned_driver.toString() === assigned_driver;

    if (!isDriverAssigned) {
      // Update assigned driver
      order.assigned_driver = assigned_driver;

      // Log the new driver assignment
      order.driver_logs.push({
        driverId: assigned_driver,
        assigned_date: new Date(),
        note: `Driver assigned to the order`,
        reason: reason || "No reason provided",
      });

      // Mark the driver as updated
      order.isDriverUpdated = true;
    } else if (reason) {
      // Log reassignment with the reason
      order.driver_logs.push({
        driverId: assigned_driver,
        assigned_date: new Date(),
        note: `Driver reassigned to the order`,
        reason: reason,
      });
    }
  }

  // Update other order details (address2, service_type, msg, etc.)
  Object.assign(order, updateData);

  // Save the updated order
  await order.save();
  const populatedOrder = await Order.findById(order._id).populate('userId');
  res.status(200).json({
    success: true,
    msg: "Order updated successfully with logs",
    data: populatedOrder,
  });
});


// get order by tracking order id 
export const getOrderByTrackingCode = asyncFunHandler(async (req, res, next) => {
  const { track_order } = req.params;
  const getOrder = await Order.findOne({ track_order }).populate('userId');
  if (!getOrder) {
    return next(new CustomErrorHandler("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    data: getOrder,
    msg: "order logs are found"
  })
});