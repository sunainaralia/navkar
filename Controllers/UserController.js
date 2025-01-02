import User, { Client, Driver, Permission } from '../Models/UserModel.js';
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
    warehouse,
    admin_address,
    ...roleSpecificData
  } = req.body;
  let userPassword = password;
  let userConfirmPassword = confirmPassword;
  let generatedPassword;
  if (!password) {
    generatedPassword = crypto.randomBytes(4).toString('hex');
    userPassword = generatedPassword;
    userConfirmPassword = userPassword;
  }
  const newUser = await User.create({
    name,
    email,
    phone_no,
    password: userPassword,
    confirmPassword: userConfirmPassword,
    role,
    zone_assigned,
    status,
    warehouse,
    admin_address,
  });
  const token = genrateToken(newUser._id);
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

export const LoginUser = asyncFunHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new CustomErrorHandler("Email or password is not provided", 400));
  }
  const user = await User.findOne({ email });
  // if (user.role !== "client" && user.role !== "driver") {
  //   return next(new CustomErrorHandler("you have no authority to login", 400));
  // }

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomErrorHandler("Email or password is not correct", 400));
  }
  let roleData = {};
  if (user.role === 'driver') {
    roleData = await Driver.findOne({ userId: user._id }).lean();
  }
  const combinedData = {
    ...user.toObject(),
    ...(roleData || {})
  };
  const token = genrateToken(user._id);
  res.status(200).json({
    success: true,
    msg: "User logged in successfully",
    data: combinedData,
    token
  });
});
export const LoginAdmin = asyncFunHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new CustomErrorHandler("Email or password is not provided", 400));
  }

  const user = await User.findOne({ email });
  if (!(user)) {
    return next(new CustomErrorHandler("you are not registered", 400));
  }
  if (!(user.isAdmin)) {
    return next(new CustomErrorHandler("you have no authority to login", 400));
  }
  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomErrorHandler("Email or password is not correct", 400));
  }

  const combinedData = {
    ...user.toObject()
  };
  const token = genrateToken(user._id);
  res.status(200).json({
    success: true,
    msg: "User logged in successfully",
    data: combinedData,
    token
  });
});



////////////////////////// get client profile //////////////////
export const getUserProfile = asyncFunHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new CustomErrorHandler("User not found", 404));
  }

  let profileData;
  if (user.role === 'client') {
    profileData = await Client.findOne({ userId: user._id });
  } else if (user.role === 'driver') {
    profileData = await Driver.findOne({ userId: user._id });
  }

  let fullProfile;
  if (profileData) {
    fullProfile = {
      ...user.toObject(),
      ...profileData.toObject() || {}
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
  const { name, email, phone_no, password, confirmPassword, zone_assigned, status, businessName, province, city, postalCode, address1, license, license_image, availability, address, address2, admin_address, warehouse } = req.body;
  const getUserndUpdate = await User.findByIdAndUpdate(req.user.id, { name, email, phone_no, password, role, confirmPassword, zone_assigned, status, warehouse, admin_address }, { new: true, runValidators: true });
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const totalClients = await Client.countDocuments();
  const clients = await Client.find().populate('userId').skip(skip).limit(limit);
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
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;

  const admins = await User.find({ role: { $nin: ['client', 'driver'] } })
    .skip(skip)
    .limit(limitNumber)
  console.log(admins)

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
  const skip = (page - 1) * limit;
  const totalDrivers = await Driver.countDocuments();
  const drivers = await Driver.find().populate('userId').skip(skip).limit(limit);
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
    availability: driver.availability,
    zone_assigned: driver.userId.zone_assigned

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

  if (user.role === 'client') {
    profileData = await Client.findOne({ userId: user._id });
  } else if (user.role === 'driver') {
    profileData = await Driver.findOne({ userId: user._id });
  }
  let fullProfile;
  if (profileData) {
    fullProfile = {
      ...user.toObject(),
      ...profileData.toObject() || {}
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
  const { name, email, phone_no, password, confirmPassword, zone_assigned, status, businessName, province, city, postalCode, address1, license, license_image, availability, address, address2, warehouse, admin_address } = req.body;
  const getUserndUpdate = await User.findByIdAndUpdate(user.id, { name, email, phone_no, password, role, confirmPassword, zone_assigned, status, warehouse, admin_address }, { new: true, runValidators: true });
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
  if (!user) {
    return next(new CustomErrorHandler("No user found", 404));
  }

  let role = user.role;
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

// Create a new permission
export const createPermission = asyncFunHandler(async (req, res, next) => {
  const { role, assign_permission } = req.body;

  if (!role || !assign_permission || assign_permission.length === 0) {
    return next(new CustomErrorHandler('Role or permissions not provided', 400));
  }

  // Create and save the new permission
  const permission = new Permission({ role, assign_permission });
  await permission.save();

  res.status(201).json({
    success: true,
    msg: 'Permission created successfully',
    data: permission
  });
});

// Get all permissions
export const getAllPermissions = asyncFunHandler(async (req, res, next) => {
  const permissions = await Permission.find();

  if (permissions.length === 0) {
    return next(new CustomErrorHandler('No permissions found', 404));
  }

  res.status(200).json({
    success: true,
    msg: 'Permissions retrieved successfully',
    data: permissions
  });
});

// Get permission by ID
export const getPermissionById = asyncFunHandler(async (req, res, next) => {
  const { id } = req.params;

  const permission = await Permission.findById(id);

  if (!permission) {
    return next(new CustomErrorHandler('Permission not found', 404));
  }

  res.status(200).json({
    success: true,
    msg: 'Permission retrieved successfully',
    data: permission
  });
});

// Update permission by ID
export const updatePermissionById = asyncFunHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role, assign_permission } = req.body;

  if (!role || !assign_permission || assign_permission.length === 0) {
    return next(new CustomErrorHandler('Role or permissions not provided', 400));
  }

  const permission = await Permission.findByIdAndUpdate(id, { role, assign_permission }, { new: true });

  if (!permission) {
    return next(new CustomErrorHandler('Permission not found', 404));
  }

  res.status(200).json({
    success: true,
    msg: 'Permission updated successfully',
    data: permission
  });
});

// Delete permission by ID
export const deletePermissionById = asyncFunHandler(async (req, res, next) => {
  const { id } = req.params;

  const permission = await Permission.findByIdAndDelete(id);

  if (!permission) {
    return next(new CustomErrorHandler('Permission not found', 404));
  }

  res.status(200).json({
    success: true,
    msg: 'Permission deleted successfully',
    data: permission
  });
});
