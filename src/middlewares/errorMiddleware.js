const jwt = require("jsonwebtoken");
const SECRET_KEY = "phathocgioi";
const errorMiddleHandler = (err, _req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    statusCode,
    stack: err.stack,
  });
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }
  } else {
    return res.status(401).json({ message: "Không có token xác thực." });
  }
};

module.exports = {
  errorMiddleHandler,
  authMiddleware,
};
