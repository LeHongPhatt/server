const express = require("express");
const cors = require("cors");
const authRouter = require("./src/routers/authRouter");
const connectDB = require("./src/configs/connectDb");
const errorMiddleHandler = require("./src/middlewares/errorMiddleware");
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());
const PORT = 3001;

app.use("/auth", authRouter);

app.use(errorMiddleHandler);
connectDB();

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`server start http://localhost:${PORT}`);
});
