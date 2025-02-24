const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");

const getJsonWebToken = async (email, id) => {
  const payload = {
    email,
    id,
  };

  const token = jwt.sign(payload, `process.env.JWT_SECRET`, {
    expiresIn: "7d",
  });
  return token;
};
const register = asyncHandle(async (req, res) => {
  const { email, fullname, password } = req.body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401);
    throw new Error("user alreally not exist");
  }
  console.log("=existingUser===", existingUser);

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  const newUser = UserModel({
    email,
    fullname: fullname ?? "",
    password: hashPassword,
  });
  console.log("=newUser==", newUser);
  await newUser.save();

  console.log("===existingUser==", existingUser);

  res.status(200).json({
    message: "Register new user successfully !!!",
    data: {
      email: newUser.email,
      fullname: newUser.fullname,
      accesstoken: await getJsonWebToken(email, newUser.id),
    },
  });
});
const login = asyncHandle(async (req, res) => {
  const { email, password } = req.body;
  console.log("===login=  req ==", req.body);
  const existingUser = await UserModel.findOne({ email });
  if (!existingUser) {
    res.status(403).json({
      message: "User not found",
    });
    throw new Error("User not found !!!");
  }

  const isMatchPassWord = await bcrypt.compare(password, existingUser.password);
  if (!isMatchPassWord) {
    res.status(401).json({
      message: "Invalid password",
    });
    throw new Error("Invalid password!!!");
  }
  res.status(200).json({
    message: "Login successfully",
    data: {
      id: existingUser.id,
      email: existingUser.email,
      fullname: existingUser.fullname,
      accesstoken: await getJsonWebToken(email, existingUser.id),
    },
  });
});
module.exports = {
  register,
  login,
};
