import { Router } from "express";
import { handleUserSignup, handleUserLogin, handleGoogleLogin } from "../controllers/user.js";

const userRouter = Router();

userRouter.post("/", handleUserSignup);
userRouter.post("/login", handleUserLogin);
userRouter.post("/google-login", handleGoogleLogin);

export { userRouter };
