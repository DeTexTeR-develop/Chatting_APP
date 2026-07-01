import { Request, Response } from "express";

import { pool } from "../config/db";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';


const loginUser = async(req : Request, res : Response) : Promise<void> => {
    try{
        const {email , password } = req.body;
        const exsistingUser = await pool.query(
            `
            SELECT * FROM users
            WHERE email = $1
            `, [email]
        );

        if(exsistingUser.rows.length === 0) {
            res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
            return
        };

        const isMatched = await bcrypt.compare(
            password,
            exsistingUser.rows[0].password
        );

        if(!isMatched) {
            res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            });
            return
        };

        const token = jwt.sign({
            id: exsistingUser.rows[0].id,
            username: exsistingUser.rows[0].username,
            email: exsistingUser.rows[0].email,
        }, process.env.JWT_SECRET as string,
        {
            expiresIn: "2d"
        });


        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 2 * 24 * 60 * 60 * 1000 
        })
        .status(200)
        .json({
            success : true,
            message: "User Logged In Successfully!!!"
        });
        
    }catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Something went wrong while logging you in!!"
        })
    }
    
};

const createUser = async (req: Request, res: Response) : Promise<void> => {
    try{
        const {username, email, password} = req.body;
        if(!username || !email || !password){
            res.status(400).json({
                success: false,
                message: "Please provide all the fields"
            });
            return;
        };

        const existingUser = await pool.query(
            `
            SELECT * FROM users
            WHERE email=$1
            `, [email]
        );
        
        if(existingUser.rowCount && existingUser.rowCount> 0){
            res.status(409).json({
                success: false,
                message: "User already exists"
            });
            return;
        };

        const saltRounds : number = 10;

        const hashedPassword = await bcrypt.hash(password , saltRounds);

        const newUser = await pool.query(
            `
            INSERT INTO users(
                username,
                email,
                password
                ) VALUES($1, $2, $3)
            RETURNING id, username, email, created_at
            `, 
            [username, email, hashedPassword]
        );

        res.status(200).json({
            success: true,
            message: `User Created Successfully : ${JSON.stringify(newUser.rows[0])}`
        });
    }catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Internal Server Error occured during creating user"
        });
    };
    
};

export {loginUser , createUser};