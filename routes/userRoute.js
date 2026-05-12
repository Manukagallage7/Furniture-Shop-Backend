import express from "express";
import { createUser, loginUser, getUser, getUsers, googleLogin, logOutUser, updateUser, deleteUser, blockUser, unblockUser, getUserByEmail, updateUserByEmail } from "../controllers/userController.js";

const userRouter = express.Router()

userRouter.post("/register", createUser)
userRouter.post("/login", loginUser)
userRouter.get("/get", getUser)
userRouter.get("/:email", getUserByEmail)
userRouter.put("/:email", updateUserByEmail)
userRouter.get("/users/:page/:limit", getUsers)
userRouter.post("/google-login", googleLogin)
userRouter.put("/update", updateUser)
userRouter.delete("/delete", deleteUser)
userRouter.put("/blockUser/:id", blockUser)
userRouter.put("/unblockUser/:id", unblockUser)
userRouter.post("/logout", logOutUser)

export default userRouter;