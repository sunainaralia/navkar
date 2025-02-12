import mongoose from "mongoose";
import User from "./UserModel.js";

// Customer schema
const CustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  businessName: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  mobileNumber: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: "Please enter a valid 10-digit phone number",
    },
  },
  province: { type: String, default: null },
  city: { type: String, default: null },
  postalCode: { type: Number, default: null },
  address1: { type: String, default: null },
  address2: { type: String, default: null },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
export const Customer = mongoose.model("Customer", CustomerSchema);

// Counter schema to count track orders
const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  count: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", CounterSchema);
const allowedStatuses = [
  "assigned",
  "unassigned",
  "pickup",
  "intransit",
  "delivered",
  "unfulfilled",
];

// Order schema
const OrderSchema = new mongoose.Schema(
  {
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    service_type: { type: [String], default: [] },
    msg: { type: String, default: null },
    order_status: {
      type: String,
      enum: allowedStatuses,
      default: "unassigned",
    },
    delivered_to: { type: String, default: null },
    track_order: { type: String, default: null },
    assigned_driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickUpDate: { type: Date, default: null },
    DropUpDate: { type: Date, default: null },
    shift: { type: String, default: null },
    deliever_sign: { type: String, default: null },
    product: [
      {
        name: { type: String, default: null },
        quantity: { type: Number, default: null },
      },
    ],
    logs: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        order_status: {
          type: String,
          default: null,
        },
        assigned_driver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        message: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          default: "No specific reason provided.",
        },
      },
    ],
    order_token: { type: String, default: null },
  },
  { timestamps: true }
);

// Pre-save hook for generating `track_order` and `order_token`
OrderSchema.pre("save", async function (next) {
  if (!this.track_order) {
    const counter = await Counter.findOneAndUpdate(
      { name: "order_track" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const paddedNumber = counter.count.toString().padStart(4, "0");
    this.track_order = `NL${paddedNumber}`;
  }

  if (!this.order_token) {
    this.order_token = `${this._id}_${Date.now()}`;
  }

  next();
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;



/////////////////////////////////// rack Schema /////////////////////////////////
const RackSchema = new mongoose.Schema(
  {
    rowId: {
      type: String,
      required: true
    },
    rowNo: {
      type: Number,
      required: true
    },
    colNo: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// validate rack uniqueness
RackSchema.pre("save", async function (next) {
  const existingItem = await mongoose.models.Rack.findOne({
    rowNo: this.rowNo,
    colNo: this.colNo,
  });

  if (existingItem) {
    const err = new Error("A grid item with the same row and column already exists.");
    return next(err);
  }
  next();
});

export const Rack = mongoose.model("Rack", RackSchema);


// ///////////////////////////// add product on rack /////////////////////////////////


// RackOrder Schema
const RackOrderSchema = new mongoose.Schema(
  {
    rowId: {
      type: String, 
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
  },
  { timestamps: true }
);

export const RackOrder = mongoose.model('RackOrder', RackOrderSchema);




