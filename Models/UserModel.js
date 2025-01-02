import mongoose from 'mongoose';
import validator from 'validator';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto'

const permissionSchema = new mongoose.Schema({
  role: {
    type: String
  },
  assign_permission: {
    type: [String]
  }
});
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
  isAdmin: {
    type: Boolean,
    default: false,
    immutable: true
  },
  warehouse: {
    type: String,
  },
  resetToken: String,
  resetTokenExpiresIn: Date,
  personal_id: {
    type: String,
    unique: true
  }
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
    price: {
      type: String
    },
    address2: {
      type: String,
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

userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(this.password, 12);
    this.confirmPassword = undefined;
  }

  // Generate personal_id if not already set
  if (!this.personal_id) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
    const rolePrefix = this.role === 'client' ? 'cus' : this.role === 'driver' ? 'dri' : 'adm';
    const namePrefix = this.name.toLowerCase().substring(0, 3); // First three letters of the name
    this.personal_id = `${rolePrefix}_${namePrefix}${randomNum}`;
  }
  next();
});



// method to compare the password
userSchema.methods.comparePasswordInDb = async function (pass, passInDb) {
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
export const permission = mongoose.model('Permission', permissionSchema)
export const Driver = mongoose.model('Driver', DriverSchema);
export const Client = mongoose.model('Client', ClientSchema);
export default User;

