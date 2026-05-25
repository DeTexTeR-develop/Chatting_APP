import express from "express";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";
dotenv.config();


import userRouter from "./routes/user";
import authRouter from "./routes/auth";


const app = express();

const PORT = Number(process.env.PORT) || 8001;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/user", userRouter);
app.use("/auth", authRouter);   

app.listen(PORT, () => {
    console.log(`Server Is Up And Running on ${PORT}!!`);
});