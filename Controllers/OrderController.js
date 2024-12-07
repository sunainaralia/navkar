import { Customer } from '../Models/OrderOfClient.js';
import Order from '../Models/OrderOfClient.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import mongoose from 'mongoose';
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
    userId,
    address2,
    service_type,
    msg,
    assigned_driver,
    pickUpDate,
    DropUpDate,
    shift,
    product, // New field
  } = req.body;

  // Ensure the customer exists
  const customer = await Customer.findById(userId);
  if (!customer) {
    return next(new CustomErrorHandler("Customer not found", 404));
  }

  // Validate product field
  if (!Array.isArray(product) || product.length === 0) {
    return next(new CustomErrorHandler("Product details are required", 400));
  }

  // Validate each product item
  for (const item of product) {
    if (!item.name || typeof item.name !== "string") {
      return next(new CustomErrorHandler("Each product must have a valid name", 400));
    }
    if (!item.quantity || typeof item.quantity !== "number") {
      return next(new CustomErrorHandler("Each product must have a valid quantity", 400));
    }
  }

  // Create the order
  const order = new Order({
    userId,
    address2,
    service_type,
    msg,
    assigned_driver,
    pickUpDate,
    DropUpDate,
    shift,
    product, // Assign the product array
    status_logs: [
      {
        status: "unassigned",
        timestamp: new Date(),
        note: "Order created with initial status as 'unassigned'",
      },
    ],
  });

  // Save the order
  await order.save();

  // Populate the userId and assigned_driver fields with user details
  const populatedOrder = await Order.findById(order._id)
    .populate("userId")
    .populate("assigned_driver");

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
  const skip = (page - 1) * limit;
  const filter = {};
  if (order_status) {
    filter.order_status = order_status;
  }

  // Get total count of orders matching the filter for pagination metadata
  const totalOrders = await Order.countDocuments(filter);

  // Fetch paginated orders
  const orders = await Order.find(filter)
    .populate('userId')
    .populate({
      path: 'assigned_driver',
      match: { _id: { $exists: true } }, // Ensure the driver exists
    })
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


/////////////////////////////////////// get total list of all orders /////////////////////////
export const getOrderStatusSummary = asyncFunHandler(async (req, res, next) => {
  // Get the start and end of the current day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59

  // Perform aggregation
  const statusSummary = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay } // Filter orders for today
      }
    },
    {
      $group: {
        _id: "$order_status", // Group by order status
        total: { $sum: 1 } // Count orders per status
      }
    },
    {
      $project: {
        _id: 0,
        order_status: "$_id",
        total: 1
      }
    }
  ]);

  // Handle case when no orders exist
  if (!statusSummary || statusSummary.length === 0) {
    return next(new CustomErrorHandler("No orders found for today", 404));
  }

  res.status(200).json({
    success: true,
    data: statusSummary,
    msg: "Today's order status summary fetched successfully"
  });
});

/////////////////////////////// get all order according to client id ////////////////////////////////
export const getAllOrdersByCustomerOfIdAndStatus = asyncFunHandler(async (req, res, next) => {
  const { customerOfId } = req.params;
  const { order_status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (order_status) {
    filter.order_status = order_status;
  }
  const orders = await Order.find(filter)
    .populate({
      path: 'userId',
      match: { customerOf: customerOfId }
    })
    .populate({
      path: 'assigned_driver',
      select: 'name email phone_no',
    })
    .skip(skip)
    .limit(parseInt(limit));
  const filteredOrders = orders.filter(order => order.userId !== null);
  const totalOrders = await Order.countDocuments({
    ...filter,
    userId: { $ne: null },
  });

  // If no orders found
  if (filteredOrders.length === 0) {
    return next(new CustomErrorHandler("No orders found for this customerOf ID and order status", 404));
  }

  // Send the response
  res.status(200).json({
    success: true,
    data: filteredOrders,
    msg: "Orders fetched successfully",
    pagination: {
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      limit: parseInt(limit),
    },
  });
});


// get order status summary of particular driver only 
export const getOrderStatusSummaryForDriver = asyncFunHandler(async (req, res, next) => {
  // Extract driver ID from token
  const driverId = req.user.id; // Assuming the driver ID is available in `req.user` after token verification

  if (!driverId) {
    return next(new CustomErrorHandler("Driver ID not found in token", 401));
  }

  // Define allowed order statuses
  const allowedStatuses = ["assigned", "unassigned", "pickup", "intransit", "delivered", "unfulfilled"];

  // Get the start and end of the current day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59

  // Perform aggregation
  const statusSummary = await Order.aggregate([
    {
      $match: {
        assigned_driver: new mongoose.Types.ObjectId(driverId), // Filter by driver ID
        createdAt: { $gte: startOfDay, $lte: endOfDay } // Filter orders for today
      }
    },
    {
      $group: {
        _id: "$order_status", // Group by order status
        total: { $sum: 1 } // Count orders per status
      }
    },
    {
      $project: {
        _id: 0,
        order_status: "$_id",
        total: 1
      }
    }
  ]);

  // Build the complete response with zero counts for missing statuses
  const fullStatusSummary = allowedStatuses.map((status) => {
    const statusData = statusSummary.find((item) => item.order_status === status);
    return {
      order_status: status,
      total: statusData ? statusData.total : 0 // Default to 0 if the status is not found
    };
  });

  // Send response
  res.status(200).json(fullStatusSummary);
});
