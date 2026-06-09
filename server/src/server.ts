import app from "./app";
import { createServer } from "node:http";
import { Server } from "socket.io";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;


const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
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