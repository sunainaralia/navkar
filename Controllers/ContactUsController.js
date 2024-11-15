import ContactUs from '../Models/ContactUs.js';
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import mongoose from 'mongoose';

// ////////////////////////////////// Get all contacts //////////////////////
export const getAllContactsUs = asyncFunHandler(async (req, res, next) => {
  const contacts = await ContactUs.find();

  if (!contacts.length) {
    return next(new CustomErrorHandler("No contacts found", 404)); // Not Found
  }
  res.status(200).json({
    success: true,
    msg: "Contacts fetched successfully",
    data: contacts
  });
});

// ///////////////////////////// Create a new contact /////////////////////////
export const createContactUs = asyncFunHandler(async (req, res, next) => {
  const contact = new ContactUs(req.body);

  await contact.save();

  res.status(201).json({
    success: true,
    msg: "Contact created successfully",
    data: contact
  });
});

// ///////////////////////////// Get contact by ID ///////////////////////////
export const getContactUsById = asyncFunHandler(async (req, res, next) => {
  const contactId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new CustomErrorHandler("Invalid contact ID", 400));
  }

  const contact = await ContactUs.findById(contactId);

  if (!contact) {
    return next(new CustomErrorHandler("No contact found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Contact fetched successfully",
    data: contact
  });
});

// ////////////////////////////// Delete contact by ID //////////////////////
export const deleteContactUsById = asyncFunHandler(async (req, res, next) => {
  const contactId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new CustomErrorHandler("Invalid contact ID", 400));
  }

  const contact = await ContactUs.findByIdAndDelete(contactId);

  if (!contact) {
    return next(new CustomErrorHandler("No contact found", 404));
  }

  res.status(204).send();
});
