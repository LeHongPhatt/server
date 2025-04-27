const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photoUrl: { type: String },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
  displayName: { type: String },
  bio: { type: String },
  interests: [{ type: String }],
  location: { type: String },
  // Lưu thông tin khôi phục mật khẩu tạm thời
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
  tempNewPassword: { type: String },
  isProfileCompleted: { type: Boolean, default: false },

  // Thêm trường này cho KYC
  kycStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
});

// Middleware tự động cập nhật updateAt mỗi lần save
UserSchema.pre("save", function (next) {
  this.updateAt = Date.now();
  next();
});

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;