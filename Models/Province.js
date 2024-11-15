import mongoose from 'mongoose';
// ///////////////////////Province model /////////////////////////
const ProvinceSchema = new mongoose.Schema({
  province_name: {
    type: String,
    required: [true, "province_name is required"],
    unique: true
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Province = mongoose.model('Province', ProvinceSchema);


// ////////////////////////city model ///////////////////////////
const CitySchema = new mongoose.Schema({
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
    required: true
  },
  city_name: {
    type: String,
    required: [true, "city_name is required"],
    unique: true
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const City = mongoose.model('City', CitySchema);


// ///////////////////////////////postal code model ////////////////////////////
const PostalCodeSchema = new mongoose.Schema({
  postalCode_name: {
    type: String,
    required: [true, "province_name is required"]
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const PostalCode = mongoose.model('PostalCode', PostalCodeSchema);


// ///////////////////////// zone model //////////////////////////
const ZoneSchema = new mongoose.Schema({
  postalCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostalCode',
    required: true
  },
  zone_name: {
    type: String,
    required: [true, "zone_name is required"]
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export const Zone = mongoose.model('Zone', ZoneSchema);