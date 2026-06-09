import { io } from "socket.io-client";

const socket = io("http://localhost:8001");

socket.on("connect", () => {
    console.log("Connected to server");
    console.log("Socket ID:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Disconnected");
});