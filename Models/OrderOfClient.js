import mongoose from "mongoose";
const ClientCustomerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  businessName: { type: String },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true, unique: true }
});
export const User = mongoose.model('User', ClientCustomerSchema);

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  province: String,
  city: String,
  postalCode: Number,
  address1: String,
  address2: String,
  accountNo: String,
  service_type: String,
  message: String
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;

