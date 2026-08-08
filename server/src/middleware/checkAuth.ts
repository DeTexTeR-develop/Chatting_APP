import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool } from "../config/db";


export const autheticateUser = async(req: Request, res: Response, next: NextFunction) : Promise<void> => {
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
        ) as JwtPayload;

        const user = await pool.query(
            `
            SELECT 
            id,
            username,
            email,
            role
            FROM users
            WHERE id = $1
            `,
            [decoded.id ]
        );
        
        if(user.rowCount === 0 || !user.rowCount){
            res.status(401).json({
                success : false,
                message : "Unauthorized"
            })
            return;
        };

        (req as any).user = user.rows[0];

        next();

    } catch(err){
        console.error(err)
        res.status(401).json({
            success: false,
            message: "Unauthorized"
        })
    }
    
};