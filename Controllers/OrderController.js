import { Customer } from '../Models/OrderOfClient.js';
import User from '../Models/UserModel.js';
import Order from '../Models/OrderOfClient.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import mongoose from 'mongoose';
import { Rack, RackOrder } from "../Models/OrderOfClient.js";
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
    const savedOrder = await newOrder.save();

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

  const totalOrders = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    })
    .populate({
      path: "assigned_driver",
      match: { _id: { $exists: true } },
    })
    .skip(skip)
    .limit(limit);

  const formattedOrders = orders.map((order) => {
    const recieverId = order.recieverId ? { ...order.recieverId._doc } : {};

    // Safely get senderId if available after populate
    const senderId = recieverId && recieverId.senderId ? recieverId.senderId : null;

    // If senderId exists, delete it from recieverId to prevent sending unnecessary data
    if (recieverId && recieverId.senderId) {
      delete recieverId.senderId;
    }

    return {
      ...order._doc,
      recieverId,
      senderId,
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
  const senderId = order.recieverId.senderId;
  const formattedRecieverId = { ...order.recieverId._doc };
  delete formattedRecieverId.senderId; 

  const formattedOrder = {
    ...order._doc,
    recieverId: formattedRecieverId,
    senderId,
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
    const order = await Order.findById(recieverId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const logs = [];
    let combinedLogMessage = "";
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

    const updatedOrder = await order.save();

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate("assigned_driver", "name")
      .populate({
        path: "recieverId",
        populate: { path: "senderId", model: "User" },
      });

    // Restructure the response to move senderId to the top level
    const senderId = populatedOrder.recieverId.senderId;
    const formattedRecieverId = { ...populatedOrder.recieverId._doc };
    delete formattedRecieverId.senderId;

    const formattedOrder = {
      ...populatedOrder._doc,
      recieverId: formattedRecieverId,
      senderId,
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

  const getOrder = await Order.findOne({ track_order })
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    });

  if (!getOrder) {
    return next(new CustomErrorHandler("Order not found", 404));
  }
  const senderId = getOrder.recieverId.senderId;
  const formattedRecieverId = { ...getOrder.recieverId._doc };
  delete formattedRecieverId.senderId;
  const formattedOrder = {
    ...getOrder._doc,
    recieverId: formattedRecieverId,
    senderId,
  };

  res.status(200).json({
    success: true,
    data: formattedOrder,
    msg: "Order logs are found",
  });
});



/////////////////////////////////////// get total list of all orders /////////////////////////
export const getOrderStatusSummary = asyncFunHandler(async (req, res, next) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const statusSummary = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: "$order_status",
        total: { $sum: 1 } 
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
  const filteredOrders = orders
    .filter((order) => order.recieverId !== null)
    .map((order) => {
      const senderId = order.recieverId.senderId;
      const formattedRecieverId = { ...order.recieverId._doc };
      delete formattedRecieverId.senderId;

      return {
        ...order._doc,
        recieverId: formattedRecieverId,
        senderId,
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
  const driver = await User.findById(driverId).select("name");
  if (!driver) {
    return next(new CustomErrorHandler("Driver not found", 404));
  }
  const allowedStatuses = ["assigned", "unassigned", "pickup", "intransit", "delivered", "unfulfilled"];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0); 
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const orders = await Order.find({
    assigned_driver: driverId,
    "logs.date": { $gte: startOfDay, $lte: endOfDay },
  }).select("logs");
  const statusCounts = {};
  allowedStatuses.forEach((status) => (statusCounts[status] = 0));

  orders.forEach((order) => {
    const todayLogs = order.logs.filter(
      (log) => log.date >= startOfDay && log.date <= endOfDay
    );

    if (todayLogs.length > 0) {
      const latestLog = todayLogs.sort((a, b) => b.date - a.date)[0];
      if (allowedStatuses.includes(latestLog.order_status)) {
        statusCounts[latestLog.order_status] += 1;
      }
    }
  });
  const fullStatusSummary = allowedStatuses.map((status) => ({
    order_status: status,
    total: statusCounts[status] || 0,
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
  const orders = await Order.find({
    assigned_driver: driverId,
    "logs.date": { $gte: startOfDay, $lte: endOfDay },
  })
    .populate({
      path: "recieverId",
      select: "-password",
      populate: { path: "senderId", model: "User", select: "-password" },
    })
    .populate({
      path: "assigned_driver",
      select: "-password",
    });
  const filteredOrders = orders.filter((order) => {
    const todayLogs = order.logs.filter(
      (log) => log.date >= startOfDay && log.date <= endOfDay
    );

    if (todayLogs.length > 0) {
      const latestLog = todayLogs.sort((a, b) => b.date - a.date)[0];
      return latestLog.order_status === order_status;
    }
    return false;
  });


  const response = filteredOrders.map((order) => {
    const orderObject = order.toObject();
    const { recieverId } = orderObject;
    const senderId = recieverId?.senderId || null;

    delete orderObject.logs; 
    delete orderObject.recieverId.senderId; 

    return {
      ...orderObject,
      recieverId,
      senderId,
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
  const order = await Order.findOne({ order_token })
    .populate("recieverId")
    .populate("assigned_driver")
    .select("-logs")
    .populate({
      path: "recieverId",
      populate: { path: "senderId", model: "User" },
    });

  if (!order) {
    return next(new CustomErrorHandler("Order not found", 404));
  }
  const orderObject = order.toObject();
  const senderId = orderObject.recieverId?.senderId || null; 
  delete orderObject.recieverId.senderId;  
  res.status(200).json({
    success: true,
    data: {
      ...orderObject,
      recieverId: orderObject.recieverId,
      senderId,
      assigned_driver: orderObject.assigned_driver, 
    },
    message: "Order retrieved successfully",
  });
});


/////////////////////////////////////// rack //////////////////////////////////////
export const createRack = asyncFunHandler(async (req, res, next) => {
  const { rowId, rowNo, colNo } = req.body;

  const rack = new Rack({ rowId, rowNo, colNo });
  await rack.save();

  res.status(201).json({
    success: true,
    msg: "Rack created successfully",
    data: rack,
  });
});

///////////////////////////////// Get All Racks ///////////////////////////////
export const getAllRacks = asyncFunHandler(async (req, res, next) => {
  const racks = await Rack.find();

  res.status(200).json({
    success: true,
    data: racks,
  });
});

///////////////////////////////// Get Rack By ID ///////////////////////////////
export const getRackById = asyncFunHandler(async (req, res, next) => {
  const rack = await Rack.findById(req.params.id);

  if (!rack) {
    return next(new CustomErrorHandler("Rack not found", 404));
  }

  res.status(200).json({
    success: true,
    data: rack,
  });
});

///////////////////////////////// Delete Rack By ID ////////////////////////////
export const deleteRackById = asyncFunHandler(async (req, res, next) => {
  const rack = await Rack.findByIdAndDelete(req.params.id);

  if (!rack) {
    return next(new CustomErrorHandler("Rack not found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Rack deleted successfully",
    data: rack,
  });
});

///////////////////////////////// Update Rack By ID ////////////////////////////
export const updateRackById = asyncFunHandler(async (req, res, next) => {
  const { rowId, rowNo, colNo } = req.body;

  const rack = await Rack.findByIdAndUpdate(
    req.params.id,
    { rowId, rowNo, colNo },
    { new: true, runValidators: true }
  );

  if (!rack) {
    return next(new CustomErrorHandler("Rack not found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Rack updated successfully",
    data: rack,
  });
});


// /////////////////// ////////// add product on rack /////////////////////
export const createRackOrder = asyncFunHandler(async (req, res, next) => {
  const { rowId, orderId } = req.body;

  const rackOrder = new RackOrder({ rowId, orderId });
  await rackOrder.save();

  const populatedRackOrder = await RackOrder.findById(rackOrder._id).populate({
    path: 'orderId',
    select: 'product',
  });

  res.status(201).json({
    success: true,
    msg: "RackOrder created successfully",
    data: populatedRackOrder,
  });
});

///////////////////////////////// Get All RackOrders //////////////////////////
export const getAllRackOrders = asyncFunHandler(async (req, res, next) => {
  const rackOrders = await RackOrder.find().populate({
    path: 'orderId',
    select: 'product',
  });

  res.status(200).json({
    success: true,
    data: rackOrders,
  });
});

///////////////////////////////// Get RackOrder By ID /////////////////////////
export const getRackOrderById = asyncFunHandler(async (req, res, next) => {
  const rackOrder = await RackOrder.findById(req.params.id).populate({
    path: 'orderId',
    select: 'product',
  });

  if (!rackOrder) {
    return next(new CustomErrorHandler("RackOrder not found", 404));
  }

  res.status(200).json({
    success: true,
    data: rackOrder,
  });
});

///////////////////////////////// Update RackOrder By ID //////////////////////
export const updateRackOrderById = asyncFunHandler(async (req, res, next) => {
  const { rowId, orderId } = req.body;

  const rackOrder = await RackOrder.findByIdAndUpdate(
    req.params.id,
    { rowId, orderId },
    { new: true, runValidators: true }
  ).populate({
    path: 'orderId',
    select: 'product',
  });

  if (!rackOrder) {
    return next(new CustomErrorHandler("RackOrder not found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "RackOrder updated successfully",
    data: rackOrder,
  });
});

///////////////////////////////// Delete RackOrder By ID //////////////////////
export const deleteRackOrderById = asyncFunHandler(async (req, res, next) => {
  const rackOrder = await RackOrder.findByIdAndDelete(req.params.id);

  if (!rackOrder) {
    return next(new CustomErrorHandler("RackOrder not found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "RackOrder deleted successfully",
  });
});

///////////////////////////////// Get RackOrders By RowID ////////////////////
export const getRackOrdersByRowId = asyncFunHandler(async (req, res, next) => {
  const rackOrders = await RackOrder.find({ rowId: req.params.rowId }).populate({
    path: 'orderId',
    select: 'product',
  });

  res.status(200).json({
    success: true,
    data: rackOrders,
  });
});