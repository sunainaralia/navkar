import { Router } from "express";
import { signUpUser, LoginUser, getUserProfile, editUser, changePassword, forgotPassword, resetPassword, getAllClients, getAllAdmin, getAllDrivers, getUserProfileById, editUserById, deleteUserById } from "../Controllers/UserController.js";
import VerifyToken from "../Controllers/VerifyToken.js";

export const userRouter = Router();
userRouter.route('/')
  .post(signUpUser)
  .get(VerifyToken, getUserProfile)
  .patch(VerifyToken, editUser)
userRouter.route('/change-password/')
  .patch(VerifyToken, changePassword)
userRouter.route('/login/')
  .post(LoginUser)
userRouter.route('/forgot-password/')
  .post(forgotPassword)
userRouter.route('/reset-password/:token/')
  .patch(resetPassword)
userRouter.route('/clients/')
  .get(getAllClients)
userRouter.route('/admins/')
  .get(getAllAdmin)
userRouter.route('/drivers/')
  .get(getAllDrivers)
userRouter.route('/:id/')
  .get(VerifyToken, getUserProfileById)
  .patch(VerifyToken, editUserById)
  .delete(VerifyToken, deleteUserById)
