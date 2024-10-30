import mongoose from 'mongoose';
import validator from 'validator';

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  business_name: {
    type: String,
    required: [true, "Business name is required"]
  },
  mobile_no: {
    type: Number,
    required: [true, "Mobile number is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"]
  },
  city: {
    type: String,
    required: [true, "City is required"]
  },
  province: {
    type: String,
    required: [true, "Province is required"]
  },
  postalCode: {
    type: Number,
    required: [true, "Postal code is required"]
  },
  message: {
    type: String,
    required: [true, "Message is required"]
  }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
