import mongoose from 'mongoose';
// ///////////////////////Province model /////////////////////////
const ProvinceSchema = new mongoose.Schema({
  province: {
    type: String,
    required: [true, "province is required"]
  },
  status: {
    type: Boolean,
    default: true
  },
  city: {
    type: String,
    required: [true, "city_name is required"]
  },
  postal_code: {
    type: String,
    required: [true, "postalCode is required"]
  },
  zone: {
    type: String,
    required: [true, "zone_name is required"],
    unique:true
  },
  service_charge: {
    type: String,
    required: [true, "service charge is required"]
  },
}, { timestamps: true });

export const Province = mongoose.model('Province', ProvinceSchema);


