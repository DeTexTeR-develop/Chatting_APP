import app from "./app";
import { createServer } from "node:http";


import dotenv from "dotenv";
import initializeSocket from "./sockets/handlers";
dotenv.config();

const PORT = process.env.PORT;
const httpServer = createServer(app);
initializeSocket(httpServer)
httpServer.listen(PORT, () => {
    console.log("server is running on " + PORT);
});