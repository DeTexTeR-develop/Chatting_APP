import express from "express";

import dotenv from "dotenv";
dotenv.config();

import userRouter from './routes/user';


const app = express();

const PORT = Number(process.env.PORT) || 8001;

app.use(express.json());

app.use("/user", userRouter);

app.listen(PORT, () => {
    console.log("Server Is Up And Running!!");
});