import { Router } from "express";
import { handleUserSignup } from "../controllers/user.js";

const userRouter = Router();

userRouter.post("/", handleUserSignup);

export { userRouter };
