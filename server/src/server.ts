import app from "./app";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';

import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT;


const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

io.use(async(socket, next) => {
    try{
        const cookie = socket.handshake.headers.cookie;
        const tokenCookie = cookie?.split("; ").find(c => c.startsWith("token="));
        const token = tokenCookie?.split("=")[1];
        if(!token){
            return next(new Error("Authentication Error"))
        };

        const decoded = jwt.verify(token as string, JWT_SECRET as string);
        socket.data.user = decoded;
        next();
    }catch(err){
        console.error(err);
        next(new Error("Authentication Error"));
    }

});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



httpServer.listen(PORT, () => {
    console.log("server is running on " + PORT);
});