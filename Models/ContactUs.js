import mongoose from 'mongoose';
import validator from 'validator';

const contactUsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"]
  },
  message: {
    type: String,
    required: [true, "Message is required"]
  },
  phone_no: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v); 
      },
      message: "Please enter a valid 10-digit phone number"
    }
  }
}, { timestamps: true });

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

export default ContactUs;
