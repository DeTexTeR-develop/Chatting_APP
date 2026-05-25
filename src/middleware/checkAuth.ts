import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const autheticateUser = (req: Request, res: Response, next: NextFunction) : void => {
    try{
        const token = req.cookies.token;
        if(!token){
            res.status(401).json({
                success: false,
                message:"Token not provided"
            });
            return
        };
        
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        );

        (req as any).user = decoded;

        next();

    } catch(err){
        console.error(err)
        res.status(401).json({
            success: false,
            message: "User Login Failed"
        })
    }
    
};