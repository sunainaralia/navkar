import mongoose from "mongoose";
import User from "./UserModel.js";
// customer schema
const CustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  businessName: { type: String },
  email: { type: String, required: true, unique: true },
  mobileNumber: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: "Please enter a valid 10-digit phone number"
    }
  },
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
const allowedStatuses = ["assigned", "unassigned", "pickup", "intransit", "delivered", "unfulfilled"];
// order of customer 
// const OrderSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Customer',
//     required: true
//   },
//   address2: String,
//   service_type: {
//     type: [String],
//   },
//   msg: String,
//   order_status: {
//     type: String,
//     enum: allowedStatuses,
//     default: "unassigned"
//   },
//   delieverd_to: {
//     type: String
//   },
//   track_order: {
//     type: String,
//   },
//   assigned_driver: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
//   },
//   isDriverUpdated: {
//     type: Boolean,
//     default: false
//   },
//   pickUpDate: {
//     type: Date
//   },
//   DropUpDate: {
//     type: Date
//   },
//   shift: {
//     type: String
//   },
//   reciever_sign: {
//     type: String
//   },
//   product: [
//     {
//       name: {
//         type: String
//       },
//       quantity: {
//         type: Number
//       }
//     }
//   ],
//   status_logs: [
//     {
//       status: {
//         type: String,
//         required: true
//       },
//       timestamp: {
//         type: Date,
//         default: Date.now
//       },
//       note: {
//         type: String,
//         default: ''
//       }
//     }
//   ],
//   driver_logs: [
//     {
//       driverId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//       },
//       assigned_date: {
//         type: Date,
//         default: Date.now
//       },
//       note: String
//     }
//   ],
//   reason: {
//     type: String
//   }
// }, { timestamps: true });
// OrderSchema.pre('save', async function (next) {
//   if (!this.track_order) {
//     const counter = await Counter.findOneAndUpdate(
//       { name: 'order_track' },
//       { $inc: { count: 1 } },
//       { new: true, upsert: true }
//     );
//     const paddedNumber = counter.count.toString().padStart(Math.max(4, counter.count.toString().length), '0');
//     this.track_order = `NL${paddedNumber}`;
//   }
//   next();
// });
// const Order = mongoose.model('Order', OrderSchema);
// export default Order;

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  address2: String,
  service_type: [String],
  msg: String,
  order_status: {
    type: String,
    enum: allowedStatuses,
    default: "unassigned",
  },
  delivered_to: String,
  track_order: String,
  assigned_driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isDriverUpdated: {
    type: Boolean,
    default: false,
  },
  pickUpDate: Date,
  DropUpDate: Date,
  shift: String,
  receiver_sign: String,
  product: [
    {
      name: String,
      quantity: Number,
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
}, { timestamps: true });

// Pre-save hook for generating `track_order`
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
  next();
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;