import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const autheticateUser = (req: Request, res: Response, next: NextFunction) : void => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            res.status(401).json({
                success: false,
                message:"Token not provided"
            });
            return
        }
        const token = authHeader.split(" ")[1];
        
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        (req as any).user = decoded;

        next();

    } catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "something went wrong while verifying the jwt token"
        })
    }
    
};