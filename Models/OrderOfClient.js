import mongoose from "mongoose";
import User from "./UserModel.js";
// customer schema
const CustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  businessName: { type: String },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true },
  province: String,
  city: String,
  postalCode: Number,
  address1: String,
  customerOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});
export const Customer = mongoose.model('Customer', CustomerSchema);


// counter schema to count track order
const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Identifier for the counter (e.g., 'order_track')
  count: { type: Number, default: 0 }      // The current count value
});

const Counter = mongoose.model('Counter', CounterSchema)

// order of customer 
const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  address2: String,
  service_type: String,
  message: String,
  order_status: {
    type: String,
    default: "picked"
  },
  track_order: {
    type: String,

  },
  assigned_driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reason: {
    type: String
  },
  isDriverUpdated:{
    type:Boolean,
    default:false
  },
  pickUpDate:{
    type:Date
  },
  DropUpDate:{
    type: Date
  },
  shift:{
    type:String
  }
}, { timestamps: true });
OrderSchema.pre('save', async function (next) {
  if (!this.track_order) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'order_track' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const paddedNumber = counter.count.toString().padStart(Math.max(4, counter.count.toString().length), '0');
    this.track_order = `NL${paddedNumber}`;
  }
  next();
});
const Order = mongoose.model('Order', OrderSchema);
export default Order;

