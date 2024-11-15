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
  email_address: {
    type: String,
    required: [true, "Email address is required"],
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email address"]
  }
}, { timestamps: true });

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

export default ContactUs;
