const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "soc.sucao1@gmail.com",
    pass: "hipv odec hddq qime",
  },
});
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

const handleSendMail = async (val, email) => {
  try {
    await transporter.sendMail({
      from: '"Maddison Foo Koch 👻" <soc.sucao1@gmail.com>', // sender address
      to: email, // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: `<h1>${val}<h1>`, // html body
    });
    return "OK";
  } catch (error) {
    return "Error";
  }
};
// handleSendMail("sssss");

const verification = asyncHandle(async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.round(1000 + Math.random() * 9000);
  try {
    await handleSendMail(verificationCode, email);
    res.status(200).json({
      message: "Verification email has been sent successfully",
      code: verificationCode,
    });
  } catch (error) {
    res.status(401);

    console.log("can not send email", error);
  }
});

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
const forgotPassWord = asyncHandle(async (req, res) => {
  const { email } = req.body;

  const rsPasswordCode = Math.round(10000 + Math.random() * 90000);
  const user = await UserModel.findOne({ email });
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(`${rsPasswordCode}`, salt);

    await UserModel.findByIdAndUpdate(user._id, {
      password: hashPassword,
      isChangedPassWord: true,
    })
      .then(() => {
        console.log("Reset password successfully");
      })
      .catch((error) => {
        console.log("Error reset password", error);
      });
    await handleSendMail(rsPasswordCode, email)
      .then(() => {
        res.status(200).json({
          message: "Reset password email has been sent successfully",
          data: [],
        });
      })
      .catch((error) => {
        res.status(401);
        console.log("===error==forgotPassWord==", error);
      });
  } else {
    res.status(401);
    console.log(error);
  }
});
module.exports = {
  register,
  login,
  verification,
  forgotPassWord,
};
