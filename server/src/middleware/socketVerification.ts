import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
const JWT_SECRET = process.env.JWT_SECRET;

interface JWTPayload{
    id: string;
    username: string;
}

const verifySocketConnection = async(
    socket : Socket,
    next  : (err?: Error) => void )=> {
    try{
        const cookie = socket.handshake.headers.cookie;
        const tokenCookie = cookie?.split("; ").find(c => c.startsWith("token="));
        const token = tokenCookie?.split("=")[1];
        if(!token){
            return next(new Error("Authentication Error"))
        };

        if (!JWT_SECRET) {
            throw new Error("JWT SECRET is missing");
        };

        const decoded = jwt.verify(token as string, JWT_SECRET as string) as JWTPayload;
        socket.data.user = decoded ;
        next();
    }catch(err){
        console.error(err);
        next(new Error("Authentication Error"));
    }
}

export default verifySocketConnection;