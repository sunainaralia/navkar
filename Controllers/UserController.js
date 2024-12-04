import User, { Client, Driver } from '../Models/UserModel.js';
import { Customer } from '../Models/OrderOfClient.js';
import pkg from 'jsonwebtoken';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import sendEmail from '../Utils/SendMail.js';
import crypto from 'crypto';
const { sign } = pkg;
import bcryptjs from 'bcryptjs';
///////////////////// genrate token ////////////////
const genrateToken = (id) => {
  return sign({ id }, process.env.SECRET_KEY, {
    expiresIn: process.env.EXPIRED_TIME
  })
};
// sign up the client /driver / admins
export const signUpUser = asyncFunHandler(async (req, res, next) => {
  const {
    name,
    email,
    phone_no,
    password,
    role,
    confirmPassword,
    zone_assigned,
    status,
    ...roleSpecificData
  } = req.body;

  // If password is not provided, generate a random 8-character password
  let userPassword = password;
  let userConfirmPassword = confirmPassword;
  let generatedPassword;
  if (!password) {
    // Generate random 8-character password
    generatedPassword = crypto.randomBytes(4).toString('hex');
    userPassword = generatedPassword;
    userConfirmPassword = userPassword;
  }

  // Create the common user data in User model
  const newUser = await User.create({
    name,
    email,
    phone_no,
    password: userPassword,
    confirmPassword: userConfirmPassword,
    role,
    zone_assigned,
    status
  });

  // Generate authentication token
  const token = genrateToken(newUser._id);

  // Create the role-specific data in the appropriate model
  let roleData;
  if (role === 'client') {
    const client = await Client.create({
      userId: newUser._id,
      businessName: roleSpecificData.businessName,
      province: roleSpecificData.province,
      city: roleSpecificData.city,
      postalCode: roleSpecificData.postalCode,
      address1: roleSpecificData.address1,
      address2: roleSpecificData.address2,
    });
    roleData = client;
  } else if (role === 'driver') {
    const driver = await Driver.create({
      userId: newUser._id,
      license: roleSpecificData.license,
      license_image: roleSpecificData.license_image,
      address: roleSpecificData.address,
      availability: roleSpecificData.availability ?? true
    });
    roleData = driver;
  }

  // Prepare response data
  let responseData = {
    ...newUser.toObject(),
    personal_id: newUser.personal_id, 
    ...(roleData?.toObject() || {})
  };

  if (generatedPassword) {
    responseData.generatedPassword = generatedPassword;
  }

  // Send an email to clients with the generated password
  if (role === "client") {
    try {
      const msg = `You are registered as a client with password: ${userPassword}. Please copy your password to log in using the following link:\n\nhttps://navkar-logistics-5y5m.vercel.app/login`;
      sendEmail({
        msg: msg,
        email: email,
        subject: "Registration Details"
      });
    } catch (err) {
      const errors = new CustomErrorHandler("An error occurred while sending the email.", 500);
      return next(errors);
    }
  }

  // Send the response
  return res.status(201).json({
    success: true,
    msg: `${role} created successfully. The password is sent to the client's email.`,
    data: responseData,
    token
  });
});


//////////////////////// login the client/////////////////////
export const LoginUser = asyncFunHandler(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    let err = new CustomErrorHandler("email or password is not provided", 400)
    return next(err);
  }
  const user = await User.findOne({ email })
  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    let err = new CustomErrorHandler("email or password is not correct", 400)
    return next(err);
  }
  let token = genrateToken(user._id)
  res.status(200).json({
    success: true,
    msg: "user is login successfully",
    data: user,
    token
  })
})

////////////////////////// get client profile //////////////////
export const getUserProfile = asyncFunHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new CustomErrorHandler("User not found", 404));
  }

  let profileData;

  // Check the user's role and fetch data from the relevant schema
  if (user.role === 'client') {
    profileData = await Client.findOne({ userId: user._id });
  } else if (user.role === 'driver') {
    profileData = await Driver.findOne({ userId: user._id });
  }

  // Combine user data with profile data, if available
  let fullProfile;
  if (profileData) {
    fullProfile = {
      ...user.toObject(),
      ...profileData.toObject() || {} // Spread profile data if it exists
    };
  } else {
    fullProfile = {
      ...user.toObject()
    };
  }

  res.status(200).json({
    success: true,
    msg: "User profile fetched successfully",
    data: fullProfile
  });
});

//////////////// update the client profile //////////////////
export const editUser = asyncFunHandler(async (req, res) => {
  let role = req.user.role
  const { name, email, phone_no, password, confirmPassword, zone_assigned, status, businessName, province, city, postalCode, address1, license, license_image, availability, address, address2 } = req.body;
  const getUserndUpdate = await User.findByIdAndUpdate(req.user.id, { name, email, phone_no, password, role, confirmPassword, zone_assigned, status }, { new: true, runValidators: true });
  // Update role-specific data in the appropriate model
  let roleData;
  if (role === 'client') {
    roleData = await Client.findOneAndUpdate(
      { userId: req.user.id },
      { businessName, province, city, postalCode, address1, address2 },
      { new: true, runValidators: true }
    );
  } else if (role === 'driver') {
    roleData = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      { license, license_image, address, availability },
      { new: true, runValidators: true }
    );
  }

  let responseData;
  if (roleData) {
    responseData = {
      ...getUserndUpdate.toObject(),
      ...(roleData?.toObject() || {})
    };
  } else {
    responseData = {
      ...getUserndUpdate.toObject()
    };
  }
  res.status(200).json({
    success: true,
    msg: "user is updated succesfully",
    data: responseData
  })
});


////////////////// change password//////////////////////
export const changePassword = asyncFunHandler(async (req, res, next) => {
  let user = await User.findById(req.user._id)
  let savedPassword = user.password;
  let currentPassword = req.body.currentPassword
  if (!currentPassword) {
    const err = new CustomErrorHandler("plz provide current password", 404);
    return next(err);
  }
  let comparepassword = await user.comparePasswordInDb(req.body.currentPassword, savedPassword);
  if (!comparepassword) {
    let err = new CustomErrorHandler("old password is not correct", 403);
    return next(err)
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  let token = genrateToken(user._id);
  res.status(200).json({
    success: true,
    msg: "password is changed successfully",
    token: token
  })
});

///////////////// forgot password ///////////////////////
export const forgotPassword = asyncFunHandler(async (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    const err = new CustomErrorHandler("plz provide the email ", 404);
    next(err);
  }
  const user = await User.findOne({ email })
  if (!user) {
    const err = new CustomErrorHandler("plz provide the valid email this is not registered", 404);
    next(err);
  }
  // send token to the user
  const resetToken = await user.resetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const url = `${req.protocol}://${req.get('host')}/v1/api/user/resetPassword/?reset_token=${resetToken}/`;
  const msg = `email is sent to your registered email plz reset your password by click on following link \n\n ${url}\n\n\n and this is valid upto ${user.resetTokenExpiresIn}`
  try {
    sendEmail({
      msg: msg,
      email: user.email,
      subject: "email for reset password"
    })
    return res.status(200).json({
      success: true,
      resetToken: resetToken,
      msg: "email is sent to your registered mail"
    })
  } catch (err) {
    user.resetToken = undefined;
    user.resetTokenExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });
    const errors = new CustomErrorHandler("some error has occured during sending the email", 500)
    return next(errors);
  }
});


///////////////// reset password////////////////////////
export const resetPassword = asyncFunHandler(async (req, res, next) => {
  let decodedtoken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  let user = await User.findOne({ resetToken: decodedtoken, resetTokenExpiresIn: { $gt: Date.now() } });
  if (!user) {
    let err = new CustomErrorHandler("your token provided is not valid or expired", 403);
    return next(err);
  };
  // setting the user password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.resetToken = undefined;
  user.resetTokenExpiresIn = undefined;
  await user.save();
  const loginToken = genrateToken(user._id);
  return res.status(200).json({
    success: true,
    msg: "password is changed successfully",
    token: loginToken
  })
});


/////////////////////// get all client//////////////////////////////

export const getAllClients = asyncFunHandler(async (req, res, next) => {
  // Fetch all clients and populate the user data
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate the skip value
  const skip = (page - 1) * limit;
  const totalClients = await Client.countDocuments();
  const clients = await Client.find().populate('userId').skip(skip).limit(limit);
  // If no clients are found
  if (!clients.length) {
    let err = new CustomErrorHandler("no client found", 404);
    return next(err);
  }
  const formattedClients = clients.map((client) => ({
    _id: client._id,
    userId: client.userId._id,
    name: client.userId.name,
    email: client.userId.email,
    phone_no: client.userId.phone_no,
    role: client.userId.role,
    status: client.userId.status,
    created_at: client.userId.created_at,
    updated_at: client.userId.updated_at,
    businessName: client.businessName,
    province: client.province,
    city: client.city,
    postalCode: client.postalCode,
    address1: client.address1,
    address2: client.address2
  }));
  res.status(200).json({
    success: true,
    msg: "all Clients fetched successfully",
    data: formattedClients,
    pagination: {
      totalClients,
      currentPage: page,
      totalPages: Math.ceil(totalClients / limit),
      limit,
    },
  });
});

// ///////////////////////////// get all admin ////////////////////////
export const getAllAdmin = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Default values for page and limit

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber; // Calculate the number of documents to skip

  const admins = await User.find({ role: { $nin: ['client', 'driver'] } })
    .skip(skip)
    .limit(limitNumber);

  const totalAdmins = await User.countDocuments({ role: { $nin: ['client', 'driver'] } });

  if (!admins.length) {
    let err = new CustomErrorHandler("No admin found", 404);
    return next(err);
  }

  return res.status(200).json({
    success: true,
    msg: "All admins fetched successfully",
    data: admins,
    pagination: {
      totalAdmins,
      currentPage: page,
      totalPages: Math.ceil(totalAdmins / limit),
      limit,
    },
  });
});


///////////////////////////////// get all drivers/////////////////////////////////////
export const getAllDrivers = asyncFunHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate the skip value
  const skip = (page - 1) * limit;
  const totalDrivers = await Driver.countDocuments();
  const drivers = await Driver.find().populate('userId').skip(skip).limit(limit);;
  // If no drivers are found
  if (!drivers.length) {
    let err = new CustomErrorHandler("no driver found", 404);
    return next(err);
  }
  const formattedDrivers = drivers.map((driver) => ({
    _id: driver._id,
    userId: driver.userId._id,
    name: driver.userId.name,
    email: driver.userId.email,
    phone_no: driver.userId.phone_no,
    role: driver.userId.role,
    status: driver.userId.status,
    created_at: driver.userId.created_at,
    updated_at: driver.userId.updated_at,
    license: driver.license,
    license_image: driver.license_image,
    address: driver.address,
    availability: driver.availability

  }));
  res.status(200).json({
    success: true,
    msg: "all drivers fetched successfully",
    data: formattedDrivers,
    pagination: {
      totalDrivers,
      currentPage: page,
      totalPages: Math.ceil(totalDrivers / limit),
      limit,
    },
  });
});

////////////////////////////// find client,admin,driver by id////////////////////////

export const getUserProfileById = asyncFunHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomErrorHandler("User not found", 404));
  }

  let profileData;

  // Check the user's role and fetch data from the relevant schema
  if (user.role === 'client') {
    profileData = await Client.findOne({ userId: user._id });
  } else if (user.role === 'driver') {
    profileData = await Driver.findOne({ userId: user._id });
  }

  // Combine user data with profile data, if available
  let fullProfile;
  if (profileData) {
    fullProfile = {
      ...user.toObject(),
      ...profileData.toObject() || {} // Spread profile data if it exists
    };
  } else {
    fullProfile = {
      ...user.toObject()
    };
  }
  res.status(200).json({
    success: true,
    msg: "User profile fetched successfully",
    data: fullProfile
  });
});

////////////////////////////// edit client,admin,driver by id////////////////////////
export const editUserById = asyncFunHandler(async (req, res) => {
  let user = await User.findById(req.params.id)
  if (!user) {
    return next(new CustomErrorHandler("User not found", 404));
  };
  let role = user.role
  const { name, email, phone_no, password, confirmPassword, zone_assigned, status, businessName, province, city, postalCode, address1, license, license_image, availability, address, address2 } = req.body;
  const getUserndUpdate = await User.findByIdAndUpdate(user.id, { name, email, phone_no, password, role, confirmPassword, zone_assigned, status }, { new: true, runValidators: true });
  // Update role-specific data in the appropriate model
  let roleData;
  if (role === 'client') {
    roleData = await Client.findOneAndUpdate(
      { userId: user.id },
      { businessName, province, city, postalCode, address1, address2 },
      { new: true, runValidators: true }
    );
  } else if (role === 'driver') {
    roleData = await Driver.findOneAndUpdate(
      { userId: user.id },
      { license, license_image, address, availability },
      { new: true, runValidators: true }
    );
  }

  let responseData;
  if (roleData) {
    responseData = {
      ...getUserndUpdate.toObject(),
      ...(roleData?.toObject() || {})
    };
  } else {
    responseData = {
      ...getUserndUpdate.toObject()
    };
  }
  res.status(200).json({
    success: true,
    msg: "user is updated succesfully",
    data: responseData
  })
});


////////////////////////////// delete client,admin,driver by id////////////////////////
export const deleteUserById = asyncFunHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  // Check if user exists
  if (!user) {
    return next(new CustomErrorHandler("No user found", 404)); // Return the error
  }

  let role = user.role;

  // Handle role-specific deletions
  if (role === "client") {
    await Customer.findOneAndDelete({ customerOf: user.id });
    await Client.findOneAndDelete({ userId: user.id });
  } else if (role === "driver") {
    await Driver.findOneAndDelete({ userId: user.id });
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    msg: `${role} is deleted successfully`
  });
});
