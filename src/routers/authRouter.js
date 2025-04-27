const { Router } = require("express");
const {
  register,
  login,
  verification,
  forgotPassWord,
  LoginGoogle,
  verifyResetPassword,
  resendOTP,
  updateKycProfile,
} = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/errorMiddleware");
const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verification", verification);
authRouter.post("/forgot_password", forgotPassWord);
authRouter.post("/google-signin", LoginGoogle);
authRouter.post("/verify_otp_and_update_password", verifyResetPassword);
authRouter.post("/resend_otp", resendOTP);
authRouter.put("/kyc/profile", authMiddleware, updateKycProfile);

module.exports = authRouter;
