const { Router } = require("express");
const {
  register,
  login,
  verification,
  forgotPassWord,
  LoginGoogle,
} = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/verification", verification);
authRouter.post("/forgotPassWord", forgotPassWord);
authRouter.post("/google-signin", LoginGoogle);

module.exports = authRouter;
