import { Router } from "express";
import {
  signUpUser, LoginUser, getUserProfile, editUser, changePassword, forgotPassword, resetPassword, getAllClients, getAllAdmin, getAllDrivers, getUserProfileById, editUserById, deleteUserById, LoginAdmin, createPermission,

  getAllPermissions,
  getPermissionById,
  updatePermissionById,
  deletePermissionById
} from "../Controllers/UserController.js";
import VerifyToken from '../Middlewares/VerifyToken.js'

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
  .post(LoginAdmin)
userRouter.route('/drivers/')
  .get(getAllDrivers)
userRouter.route('/permission/')
  .post(VerifyToken, createPermission)
  .get(VerifyToken, getAllPermissions)

userRouter.route('/permission/:id/')
  .get(VerifyToken, getPermissionById)
  .patch(VerifyToken, updatePermissionById)
  .delete(VerifyToken, deletePermissionById)
userRouter.route('/:id/')
  .get(VerifyToken, getUserProfileById)
  .patch(VerifyToken, editUserById)
  .delete(VerifyToken, deleteUserById)