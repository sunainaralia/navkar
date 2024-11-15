import { Router } from "express";
import VerifyToken from '../Middlewares/VerifyToken.js';
import {
  getAllContactsUs,
  getContactUsById,
  deleteContactUsById,
  createContactUs } from "../Controllers/ContactUsController.js";

export const contactUsRouter = Router();

contactUsRouter.route('/')
  .post(createContactUs)
  .get(VerifyToken, getAllContactsUs);

contactUsRouter.route('/:id')
  .get(VerifyToken, getContactUsById)
  .delete(VerifyToken, deleteContactUsById); 
