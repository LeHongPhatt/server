const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullname: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  photoUrl: { type: String },
  createAt: { type: Date, default: Date.now() },
  updateAt: { type: Date, default: Date.now() },
});
const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
