import { Customer } from '../Models/OrderOfClient.js';
import User from '../Models/UserModel.js';
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
export const createOrder = async (req, res, next) => {
  try {
    let {
      recieverId,
      service_type,
      msg,
      product,
      pickUpDate,
      DropUpDate,
      shift,
    } = req.body;

    const newOrder = new Order({
      recieverId,
      service_type,
      msg,
      product,
      pickUpDate,
      DropUpDate,
      shift,
    });
    newOrder.logs.push({
      order_status: "unassigned",
      message: "Order created with initial status as 'unassigned'.",
    });

    // Save the order
    const savedOrder = await newOrder.save();

    // Populate the customer and their senderId field
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate({
        path: "recieverId",
        populate: { path: "senderId", model: "User" },
      });

    const senderId = populatedOrder.recieverId.senderId;
    recieverId = { ...populatedOrder.recieverId._doc }; 
    delete recieverId.senderId; 

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        ...populatedOrder._doc,
        recieverId,
        senderId,
      },
    });
  } catch (error) {
    next(error);
  }
};


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
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    })
    .populate({
      path: "assigned_driver",
      match: { _id: { $exists: true } }, // Ensure the driver exists
    })
    .skip(skip)
    .limit(limit);

  // Restructure each order to include senderId as a top-level field
  const formattedOrders = orders.map((order) => {
    const senderId = order.recieverId.senderId;
    const recieverId = { ...order.recieverId._doc };
    delete recieverId.senderId; // Remove senderId from nested recieverId

    return {
      ...order._doc,
      recieverId,
      senderId, // Add senderId as a top-level field
    };
  });

  res.status(200).json({
    success: true,
    data: formattedOrders,
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
  const { recieverId } = req.params;

  // Fetch the order using recieverId
  const order = await Order.findOne({ recieverId })
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    });

  if (!order) {
    return next(
      new CustomErrorHandler("Order not found for the provided user ID", 404)
    );
  }

  // Restructure the order to include senderId as a top-level field
  const senderId = order.recieverId.senderId;
  const formattedRecieverId = { ...order.recieverId._doc };
  delete formattedRecieverId.senderId; // Remove senderId from nested recieverId

  const formattedOrder = {
    ...order._doc,
    recieverId: formattedRecieverId,
    senderId, // Add senderId as a top-level field
  };

  res.status(200).json({
    success: true,
    data: formattedOrder,
    msg: "Order is retrieved successfully",
  });
});


///////////////////////////////// Controller to update an order by ID///////////
export const updateOrder = async (req, res, next) => {
  try {
    const { recieverId } = req.params;
    const { order_status, assigned_driver, reason } = req.body;

    // Find the order by ID
    const order = await Order.findById(recieverId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const logs = [];
    let combinedLogMessage = "";

    // Update order_status and log the change
    if (order_status && order_status !== order.order_status) {
      let statusMessage = `Order status updated to '${order_status}'`;
      if (order_status === "pickup") {
        statusMessage = `Order picked up`;
      } else if (order_status === "intransit") {
        statusMessage = `Order is now in transit`;
      } else if (order_status === "delivered") {
        statusMessage = `Order successfully delivered`;
      }

      combinedLogMessage += statusMessage;
      order.order_status = order_status;
    }

    // Update assigned_driver and log the change
    if (assigned_driver && assigned_driver !== String(order.assigned_driver)) {
      const driver = await User.findById(assigned_driver).select("name");
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }

      const driverMessage = `Driver '${driver.name}' assigned to the order`;
      combinedLogMessage += combinedLogMessage ? ` | ${driverMessage}` : driverMessage;

      order.assigned_driver = assigned_driver;
    }

    if (!combinedLogMessage) {
      return res.status(400).json({ success: false, message: "No changes to update" });
    }

    // Add logs
    logs.push({
      order_status: order.order_status,
      assigned_driver: assigned_driver || order.assigned_driver,
      message: combinedLogMessage,
      reason: reason || "No reason provided",
      date: new Date(),
    });

    if (logs.length > 0) {
      order.logs.push(...logs);
    }

    // Save the updated order
    const updatedOrder = await order.save();

    // Populate nested fields
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("assigned_driver", "name")
      .populate({
        path: "recieverId",
        populate: { path: "senderId", model: "User" },
      });

    // Restructure the response to move senderId to the top level
    const senderId = populatedOrder.recieverId.senderId;
    const formattedRecieverId = { ...populatedOrder.recieverId._doc };
    delete formattedRecieverId.senderId; // Remove senderId from nested recieverId

    const formattedOrder = {
      ...populatedOrder._doc,
      recieverId: formattedRecieverId,
      senderId, // Add senderId as a top-level field
    };

    res.status(200).json({
      success: true,
      message: "Order updated successfully with detailed logs",
      data: formattedOrder,
    });
  } catch (error) {
    next(error);
  }
};



// get order by tracking order id 
export const getOrderByTrackingCode = asyncFunHandler(async (req, res, next) => {
  const { track_order } = req.params;

  // Find the order and populate fields
  const getOrder = await Order.findOne({ track_order })
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    });

  if (!getOrder) {
    return next(new CustomErrorHandler("Order not found", 404));
  }

  // Extract and restructure senderId
  const senderId = getOrder.recieverId.senderId;
  const formattedRecieverId = { ...getOrder.recieverId._doc };
  delete formattedRecieverId.senderId; // Remove senderId from nested recieverId

  // Restructure the order object
  const formattedOrder = {
    ...getOrder._doc,
    recieverId: formattedRecieverId,
    senderId, // Add senderId as a top-level field
  };

  res.status(200).json({
    success: true,
    data: formattedOrder,
    msg: "Order logs are found",
  });
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

/////////////////////////////// get all order according to client id///////////////////////
export const getAllOrdersByCustomerOfIdAndStatus = asyncFunHandler(async (req, res, next) => {
  const { customerOfId } = req.params;
  const { order_status, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};
  if (order_status) {
    filter.order_status = order_status;
  }

  // Fetch orders and populate necessary fields
  const orders = await Order.find(filter)
    .populate({
      path: "recieverId",
      match: { senderId: customerOfId },
      populate: { path: "senderId", model: "User" },
    })
    .populate({
      path: "assigned_driver",
      select: "name email phone_no",
    })
    .skip(skip)
    .limit(parseInt(limit));

  // Filter out orders where recieverId does not match the condition
  const filteredOrders = orders
    .filter((order) => order.recieverId !== null)
    .map((order) => {
      const senderId = order.recieverId.senderId;
      const formattedRecieverId = { ...order.recieverId._doc };
      delete formattedRecieverId.senderId; // Remove senderId from nested recieverId

      return {
        ...order._doc,
        recieverId: formattedRecieverId,
        senderId, // Add senderId as a top-level field
      };
    });

  const totalOrders = await Order.countDocuments({
    ...filter,
    recieverId: { $ne: null },
  });

  // If no orders found
  if (filteredOrders.length === 0) {
    return next(new CustomErrorHandler("No orders found for this senderId and order status", 404));
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

////////// get order status summary of particular driver only //////////////
export const getOrderStatusSummaryForDriver = asyncFunHandler(async (req, res, next) => {
  const driverId = req.user.id;

  if (!driverId) {
    return next(new CustomErrorHandler("Driver ID not found in token", 401));
  }

  // Fetch the driver's name
  const driver = await User.findById(driverId).select("name");
  if (!driver) {
    return next(new CustomErrorHandler("Driver not found", 404));
  }

  // Define allowed order statuses
  const allowedStatuses = ["assigned", "unassigned", "pickup", "intransit", "delivered", "unfulfilled"];

  // Get the start and end of the current day
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59

  // Fetch orders for the driver with logs for today
  const orders = await Order.find({
    assigned_driver: driverId,
    "logs.date": { $gte: startOfDay, $lte: endOfDay },
  }).select("logs");

  // Initialize counts for each status
  const statusCounts = {};
  allowedStatuses.forEach((status) => (statusCounts[status] = 0));

  orders.forEach((order) => {
    // Find the most recent log for today
    const todayLogs = order.logs.filter(
      (log) => log.date >= startOfDay && log.date <= endOfDay
    );

    if (todayLogs.length > 0) {
      // Sort logs by date descending to get the latest status
      const latestLog = todayLogs.sort((a, b) => b.date - a.date)[0];

      // Increment the count for the latest status
      if (allowedStatuses.includes(latestLog.order_status)) {
        statusCounts[latestLog.order_status] += 1;
      }
    }
  });

  // Build the final response
  const fullStatusSummary = allowedStatuses.map((status) => ({
    order_status: status,
    total: statusCounts[status] || 0, // Default to 0 if the status is missing
  }));

  res.status(200).json({
    driver_name: driver.name,
    status_summary: fullStatusSummary,
  });
});

////// get order status summary of particular driver with order status /////////
export const getOrdersByStatusForDriver = asyncFunHandler(async (req, res, next) => {
  const driverId = req.user.id;
  const { order_status } = req.query;

  if (!driverId) {
    return next(new CustomErrorHandler("Driver ID not found in token", 401));
  }

  if (!order_status) {
    return next(new CustomErrorHandler("Order status parameter is required", 400));
  }

  const allowedStatuses = ["assigned", "unassigned", "pickup", "intransit", "delivered", "unfulfilled"];
  if (!allowedStatuses.includes(order_status)) {
    return next(new CustomErrorHandler("Invalid order status", 400));
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch orders for the driver with logs for today
  const orders = await Order.find({
    assigned_driver: driverId,
    "logs.date": { $gte: startOfDay, $lte: endOfDay },
  })
    .populate({
      path: "recieverId",
      select: "-password", // Exclude password for security
      populate: { path: "senderId", model: "User", select: "-password" },
    })
    .populate({
      path: "assigned_driver",
      select: "-password", // Exclude password for security
    });

  // Filter orders based on the latest status log for today
  const filteredOrders = orders.filter((order) => {
    const todayLogs = order.logs.filter(
      (log) => log.date >= startOfDay && log.date <= endOfDay
    );

    if (todayLogs.length > 0) {
      // Sort logs by date descending to get the latest log
      const latestLog = todayLogs.sort((a, b) => b.date - a.date)[0];
      return latestLog.order_status === order_status;
    }
    return false;
  });

  // Format the response and separate senderId from recieverId
  const response = filteredOrders.map((order) => {
    const orderObject = order.toObject();
    const { recieverId } = orderObject;
    const senderId = recieverId?.senderId || null; // Extract senderId

    delete orderObject.logs; // Remove the logs field
    delete orderObject.recieverId.senderId; // Remove senderId from recieverId

    return {
      ...orderObject,
      recieverId,
      senderId, // Include senderId at the top level
      assigned_driver: order.assigned_driver,
    };
  });

  res.status(200).json({
    order_status: order_status,
    total_orders: response.length,
    orders: response,
  });
});


//////////////////////// API to get order by order_token ////////////////////////////
export const getOrderByOrderToken = asyncFunHandler(async (req, res, next) => {
  const { order_token } = req.params;

  // Fetch the order based on the order_token
  const order = await Order.findOne({ order_token })
    .populate("recieverId")  // Populate recieverId
    .populate("assigned_driver")  // Populate assigned_driver
    .select("-logs")  // Exclude logs from the result
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },  // Populate senderId within recieverId
    });

  if (!order) {
    return next(new CustomErrorHandler("Order not found", 404));
  }

  // Extract senderId from recieverId and include it at the top level
  const orderObject = order.toObject();
  const senderId = orderObject.recieverId?.senderId || null;  // Extract senderId
  delete orderObject.recieverId.senderId;  // Remove senderId from recieverId

  // Send the response with senderId as a top-level field
  res.status(200).json({
    success: true,
    data: {
      ...orderObject,
      recieverId: orderObject.recieverId,  // Keep recieverId, without senderId nested
      senderId,  // Include senderId at the top level
      assigned_driver: orderObject.assigned_driver,  // Keep assigned_driver
    },
    message: "Order retrieved successfully",
  });
});
