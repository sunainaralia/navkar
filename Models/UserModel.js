import mongoose from 'mongoose';
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto'
// all user schema or admin schema 
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"]
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
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: 5
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "password and confirm password are not the same"
    }
  },
  role: {
    type: String,
    required: true
  },
  zone_assigned: {
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
  resetToken: String,
  resetTokenExpiresIn: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});


// schema for client
const ClientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    businessName: {
      type: String
    },
    province: {
      type: String,
      required: [true, "Please enter your province"],

    },
    city: {
      type: String,
      required: [true, "Please enter your city"]

    },
    postalCode: {
      type: Number,
      required: [true, "Please enter your postal code"],
    },
    address1: {
      type: String,
      required: [true, "Please enter your adress"],
    },
    price:{
      type:Number
    }
  },
);
// driver schema 
const DriverSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  license: {
    type: String,
    required: [true, 'license no is required']
  },
  license_image: {
    type: String,
    required: [true, "license image is required"]
  },
  address: {
    type: String,
    required: [true, "address is required"]
  },
  availability: {
    type: Boolean,
    default: true
  }
})

// Middleware to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash password and remove confirmPassword after validation
  this.password = await bcryptjs.hash(this.password, 12);
  this.confirmPassword = undefined; // Only set to undefined here after hashing
  next();
});



// method to compare the password
userSchema.methods.comparePasswordInDb = async function (pass, passInDb) {
  console.log(pass)
  console.log(passInDb)
  console.log()
  return await bcryptjs.compare(pass, passInDb);

}
// set reset password token
userSchema.methods.resetPasswordToken = async function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetTokenExpiresIn = Date.now() + 10 * 60 * 1000;
  return token;
}

// export all users (admin,client,user)
const User = mongoose.model('User', userSchema);
export const Driver = mongoose.model('Driver', DriverSchema);
export const Client = mongoose.model('Client', ClientSchema);
export default User;

