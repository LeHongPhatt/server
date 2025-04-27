require("dotenv").config();
const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const SECRET_KEY = "phathocgioi";
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

  const token = jwt.sign(payload, SECRET_KEY, {
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

  // Kiểm tra nếu người dùng đã tồn tại
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401).json({ message: "User already exists" });
    return; // Dừng lại nếu user đã tồn tại
  }

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // Tạo người dùng mới với trạng thái KYC là "pending"
  const newUser = new UserModel({
    email,
    fullname: fullname ?? "",
    password: hashPassword,
    kycStatus: "pending", // Thêm trường này vào model User
  });

  // Lưu người dùng vào database
  await newUser.save();

  // Gửi phản hồi trả về cho client
  res.status(200).json({
    message: "Register new user successfully !!!",
    data: {
      email: newUser.email,
      fullname: newUser.fullname,
      accesstoken: await getJsonWebToken(email, newUser.id),
      isProfileCompleted: false,
      kycStatus: newUser.kycStatus, // Trả về trạng thái KYC
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
    console("User not found !!!");
  }

  const isMatchPassWord = await bcrypt.compare(password, existingUser.password);
  if (!isMatchPassWord) {
    res.status(401).json({
      message: "Invalid password",
    });
    console("Invalid password!!!");
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
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Thiếu thông tin." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ message: "Không tìm thấy người dùng với email này." });
  }

  // Tạo mã OTP
  const otpCode = Math.round(1000 + Math.random() * 9000);
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Lưu OTP và mật khẩu mới tạm thời trong user hoặc bảng riêng (tuỳ design)
  user.resetPasswordOTP = otpCode;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  user.tempPassword = hashedNewPassword;
  await user.save();

  // Gửi email chứa OTP
  const emailSent = await handleSendMail(otpCode, email);
  if (!emailSent) {
    return res
      .status(500)
      .json({ message: "Không thể gửi mã OTP. Vui lòng thử lại." });
  }

  return res.status(200).json({
    otp: otpCode,
    message:
      "Đã gửi mã OTP tới email. Vui lòng xác minh để hoàn tất thay đổi mật khẩu.",
  });
});

const resendOTP = asyncHandle(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email không được để trống." });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng." });
  }

  // Kiểm tra xem người dùng đã yêu cầu quên mật khẩu chưa
  if (!user.tempNewPassword) {
    return res.status(400).json({
      message: "Không có yêu cầu khôi phục nào đang chờ xác minh.",
    });
  }

  // Tạo OTP mới
  const newOTP = Math.round(1000 + Math.random() * 9000);

  // Cập nhật OTP mới và thời gian hết hạn
  user.resetPasswordOTP = newOTP;
  user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  await user.save();

  const sent = await handleSendMail(
    res.status(200).json({
      message: "Verification email has been sent successfully",
      otp: newOTP,
    })
  );

  if (!sent) {
    return res.status(500).json({ message: "Không thể gửi lại mã OTP." });
  }

  res.status(200).json({ message: "Mã OTP mới đã được gửi đến email." });
});

const verifyResetPassword = asyncHandle(async (req, res) => {
  const { email, otp } = req.body; // Lấy email và OTP từ yêu cầu
  const newPassword = req.body.newPassword; // Lấy mật khẩu mới từ trước đó (đã nhập)

  // Kiểm tra email, OTP và mật khẩu mới
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Tìm người dùng theo email
    const user = await UserModel.findOne({ email });

    // Kiểm tra nếu người dùng không tồn tại
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Kiểm tra xem OTP có hợp lệ không và đã hết hạn chưa
    if (
      user.resetPasswordOTP !== otp ||
      Date.now() > user.resetPasswordOTPExpires
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Cập nhật mật khẩu mới
    user.password = await bcrypt.hash(newPassword, 10); // Mã hóa mật khẩu
    user.resetPasswordOTP = undefined; // Xóa OTP sau khi xác minh
    user.resetPasswordOTPExpires = undefined; // Xóa thời gian hết hạn
    await user.save();

    return res.status(200).json({
      status: "success", // ✅ thêm dòng này để frontend check dễ
      message:
        "Password updated successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Error during OTP verification and password update: ", error);
    return res.status(500).json({
      message: "An error occurred while processing your request.",
    });
  }
});

const LoginGoogle = asyncHandle(async (req, res) => {
  const userInfo = req.body;
  const existingUser = await UserModel.findOne({ email: userInfo.email });
  let user = { ...userInfo };
  if (existingUser) {
    if (existingUser) {
      await UserModel.findByIdAndUpdate(existingUser.id, {
        ...userInfo,
        updateAt: Date.now(),
      });
      console.log("Updated");

      user.accesstoken = await getJsonWebToken(userInfo.email, userInfo.id);
    }
  } else {
    const newUser = new UserModel({
      email: userInfo.email,
      fullname: userInfo.name,
      ...userInfo,
    });
    await newUser.save();
    console.log("Saved");
    user.accesstoken = await getJsonWebToken(userInfo.email, newUser.id);
  }
  res.status(200).json({
    message: "Login google successfully",
    data: user,
  });
});

const updateKycProfile = async (req, res) => {
  try {
    const { username, displayName, bio, interests, location } = req.body;
    const userId = req.user?.id || req.body.id;

    if (!username || !displayName) {
      return res
        .status(400)
        .json({ message: "Username và displayName là bắt buộc." });
    }

    const existingUserWithUsername = await UserModel.findOne({ username });

    if (
      existingUserWithUsername &&
      existingUserWithUsername._id.toString() !== userId
    ) {
      return res.status(409).json({
        message: "Username đã tồn tại.",
        existingUserId: existingUserWithUsername._id,
      });
    }

    // Tạo object update chỉ chứa các trường có giá trị
    const updateFields = {
      username,
      displayName,
      isProfileCompleted: true,
      kycStatus: "approved", // Nếu muốn xác nhận KYC thành công
    };
    if (bio !== undefined) updateFields.bio = bio;
    if (interests !== undefined) updateFields.interests = interests;
    if (location !== undefined) updateFields.location = location;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Tạo token mới với thông tin cập nhật
    const accesstoken = await getJsonWebToken(updatedUser.email, updatedUser._id);

    // Tạo object response không chứa các trường nhạy cảm
    const userResponse = {
      _id: updatedUser._id,
      email: updatedUser.email,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      location: updatedUser.location,
      isProfileCompleted: updatedUser.isProfileCompleted,
      kycStatus: updatedUser.kycStatus,
      createAt: updatedUser.createAt,
      updateAt: updatedUser.updateAt,
    };

    return res.status(200).json({
      message: "Thông tin cá nhân đã được cập nhật thành công.",
      data: {
        ...userResponse,
        accesstoken,
      },
    });
  } catch (error) {
    console.error("Error updating KYC profile:", error);
    return res
      .status(500)
      .json({ message: "Đã có lỗi xảy ra. Vui lòng thử lại." });
  }
};

module.exports = {
  register,
  login,
  verification,
  forgotPassWord,
  LoginGoogle,
  verifyResetPassword,
  resendOTP,
  updateKycProfile,
};
