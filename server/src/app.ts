import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import conversationsRouter from "./routes/conversation";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";


const app = express();

const PORT = Number(process.env.PORT) || 8001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/user", userRouter);
app.use("/auth", authRouter);   
app.use("/chat", conversationsRouter);

export default app;