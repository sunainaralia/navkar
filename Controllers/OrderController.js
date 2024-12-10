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
    const { userId, address2, service_type, msg, product, pickUpDate, DropUpDate, shift } = req.body;

    const newOrder = new Order({
      userId,
      address2,
      service_type,
      msg,
      product,
      pickUpDate,
      DropUpDate,
      shift,
    });

    // Add initial log for the order
    newOrder.logs.push({
      order_status: "unassigned",
      message: "Order created with initial status as 'unassigned'.",
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
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
// export const updateOrderByCustomerId = asyncFunHandler(async (req, res, next) => {
//   const { userId } = req.params;
//   const { order_status, assigned_driver, reason, ...updateData } = req.body;

//   // Find the order for the given customer
//   const order = await Order.findById(userId);
//   if (!order) {
//     return next(new CustomErrorHandler("Order not found", 404));
//   }

//   // Handle order status updates
//   if (order_status && order_status !== order.order_status) {
//     order.order_status = order_status;
//     order.status_logs.push({
//       status: order_status,
//       timestamp: new Date(),
//       note: `Order status updated to '${order_status}'`,
//     });
//   }

//   // Handle driver assignments
//   if (assigned_driver) {
//     const isDriverAssigned =
//       order.assigned_driver && order.assigned_driver.toString() === assigned_driver;

//     if (!isDriverAssigned) {
//       // Update assigned driver
//       order.assigned_driver = assigned_driver;

//       // Log the new driver assignment
//       order.driver_logs.push({
//         driverId: assigned_driver,
//         assigned_date: new Date(),
//         note: `Driver assigned to the order`,
//         reason: reason || "No reason provided",
//       });

//       // Mark the driver as updated
//       order.isDriverUpdated = true;
//     } else if (reason) {
//       // Log reassignment with the reason
//       order.driver_logs.push({
//         driverId: assigned_driver,
//         assigned_date: new Date(),
//         note: `Driver reassigned to the order`,
//         reason: reason,
//       });
//     }
//   }

//   // Update other order details (address2, service_type, msg, etc.)
//   Object.assign(order, updateData);

//   // Save the updated order
//   await order.save();
//   const populatedOrder = await Order.findById(order._id).populate('userId');
//   res.status(200).json({
//     success: true,
//     msg: "Order updated successfully with logs",
//     data: populatedOrder,
//   });
// });
export const updateOrder = async (req, res, next) => {
  try {
    const { userId } = req.params; // Order ID
    const { order_status, assigned_driver, reason } = req.body;

    // Find the order
    const order = await Order.findById(userId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const logs = []; // To accumulate log changes
    let combinedLogMessage = ""; // For creating a single log message

    // Handle `order_status` update
    if (order_status && order_status !== order.order_status) {
      let statusMessage = `Order status updated to '${order_status}'`;
      if (order_status === "pickup") {
        statusMessage = `Order picked up`;
      } else if (order_status === "intransit") {
        statusMessage = `Order is now in transit`;
      } else if (order_status === "delivered") {
        statusMessage = `Order successfully delivered`;
      }

      combinedLogMessage += statusMessage; // Add to combined message
      order.order_status = order_status;
    }

    // Handle `assigned_driver` update
    if (assigned_driver && assigned_driver !== String(order.assigned_driver)) {
      const driver = await User.findById(assigned_driver).select("name");
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }

      const driverMessage = `Driver '${driver.name}' assigned to the order`;
      combinedLogMessage += combinedLogMessage ? ` | ${driverMessage}` : driverMessage;

      order.assigned_driver = assigned_driver; // Store only the ID in the order
    }

    // If no changes, return without update
    if (!combinedLogMessage) {
      return res.status(400).json({ success: false, message: "No changes to update" });
    }

    // Create a single log entry if any updates occurred
    logs.push({
      order_status: order.order_status,
      assigned_driver: assigned_driver || order.assigned_driver, // Keep the current driver ID if not updated
      message: combinedLogMessage,
      reason: reason || "No reason provided",
      date: new Date(),
    });

    // Append logs and save the order
    if (logs.length > 0) {
      order.logs.push(...logs);
    }

    const updatedOrder = await order.save();

    // Populate `assigned_driver` for response (for frontend purposes)
    const populatedOrder = await Order.findById(updatedOrder._id).populate("assigned_driver", "name");

    res.status(200).json({
      success: true,
      message: "Order updated successfully with detailed logs",
      data: populatedOrder,
    });
  } catch (error) {
    next(error);
  }
};



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

/////////////////////////////// get all order according to client id///////////////////////
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
      path: "userId",
      select: "-password", // Exclude password for security
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

  // Format the response and remove logs
  const response = filteredOrders.map((order) => {
    const orderObject = order.toObject();
    delete orderObject.logs; // Remove the logs field
    return {
      ...orderObject,
      userId: order.userId,
      assigned_driver: order.assigned_driver,
    };
  });

  res.status(200).json({
    order_status: order_status,
    total_orders: response.length,
    orders: response,
  });
});


