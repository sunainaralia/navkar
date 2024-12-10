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
  customerOf: {
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    address2: { type: String, default: null },
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
    isDriverUpdated: {
      type: Boolean,
      default: false,
    },
    pickUpDate: { type: Date, default: null },
    DropUpDate: { type: Date, default: null },
    shift: { type: String, default: null },
    receiver_sign: { type: String, default: null },
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
  // Generate tracking code
  if (!this.track_order) {
    const counter = await Counter.findOneAndUpdate(
      { name: "order_track" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const paddedNumber = counter.count.toString().padStart(4, "0");
    this.track_order = `NL${paddedNumber}`;
  }

  // Generate order token
  if (!this.order_token) {
    this.order_token = `${this._id}_${Date.now()}`; 
  }

  next();
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;
