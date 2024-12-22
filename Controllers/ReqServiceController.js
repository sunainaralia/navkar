import Contact from '../Models/RequestService.js'; 
import CustomErrorHandler from '../Utils/CustomErrorHandler.js';
import asyncFunHandler from '../Utils/asyncFunHandler.js';
import mongoose from 'mongoose';

///////////////////////////////// Get all contacts //////////////////////
export const getAllContacts = asyncFunHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const skip = (pageNumber - 1) * limitNumber;
  const contacts = await Contact.find().skip(skip).limit(limitNumber);
  const totalContacts = await Contact.countDocuments();

  if (!contacts.length) {
    return next(new CustomErrorHandler("No contacts found", 404));
  }

  res.status(200).json({
    success: true,
    msg: "Contacts fetched successfully",
    data: contacts,
    pagination: {
      total: totalContacts,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalContacts / limitNumber),
      perPage: limitNumber,
    },
  });
});

///////////////////////////// Create a new contact /////////////////////////
export const createContact = asyncFunHandler(async (req, res, next) => {
  const contact = new Contact(req.body);

  await contact.save();

  res.status(201).json({
    success: true,
    msg: "Contact created successfully",
    data: contact
  });
});

/////////////////////////// Get contact by ID ///////////////////////////
export const getContactById = asyncFunHandler(async (req, res, next) => {
  const contactId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new CustomErrorHandler("Invalid contact ID", 400));
  }

  const contact = await Contact.findById(contactId);

  if (!contact) {
    return next(new CustomErrorHandler("No contact found", 404)); 
  }

  res.status(200).json({
    success: true,
    msg: "Contact fetched successfully",
    data: contact
  });
});

///////////////////////////////// Delete contact by ID //////////////////////
export const deleteContactById = asyncFunHandler(async (req, res, next) => {
  const contactId = req.params.id;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new CustomErrorHandler("Invalid contact ID", 400));
  }

  const contact = await Contact.findByIdAndDelete(contactId);

  if (!contact) {
    return next(new CustomErrorHandler("No contact found", 404));
  }

  res.status(204).send();
});
