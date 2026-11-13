import { Router } from "express";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validations/auth.validation";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../../middlewares/authenticate.middleware";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimiter, validate({ body: registerSchema }),
  authController.register
);
authRoutes.post("/login", authRateLimiter, validate({ body: loginSchema }), authController.login);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authenticate, authController.me);