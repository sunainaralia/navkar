import { Router } from "express";
import VerifyToken from "../Controllers/VerifyToken.js";
import { getAllContacts, getContactById, deleteContactById, createContact } from "../Controllers/ReqServiceController.js";

export const contactRouter = Router();
contactRouter.route('/')
  .post(createContact)
  .get(VerifyToken, getAllContacts)
contactRouter.route('/:id/')
  .delete(VerifyToken, deleteContactById)
  .get(VerifyToken, getContactById);