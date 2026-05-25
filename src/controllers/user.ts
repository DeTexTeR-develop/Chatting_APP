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

        res.status(200).json({
            success: true,
            message: `Login Successfull : ${token}`
        });

    }catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Something went wrong while logging you in!!"
        })
    }
    
};

const getAllUsers = async(req : Request, res : Response) : Promise<void> => {
    try{
        const users = await pool.query(
            `
            SELECT * FROM users
            `
        );
        res.status(200).json({
            success: true,
            users: users.rows
        })
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error in Getting All Users"
        })
    }
};

const getUser = async(req: Request, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const user = await pool.query(
            `
            SELECT * FROM users 
            WHERE id = $1 
            `, [id]
        );
        res.status(200).json({
            success: true,
            message: `User : ${JSON.stringify(user.rows)}`
        });
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error in Getting User"
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

const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { username, email } = req.body;
        
        const fields: string[] = [];
        const values: string[] = [];

        if (username) {
            values.push(username);
            fields.push(`username = $${values.length}`);
        }
        if (email) {
            values.push(email);
            fields.push(`email = $${values.length}`);
        }
        if (fields.length === 0) {
            res.status(400).json({
                success: false,
                message: "No fields provided for update"
            });
            return;
        };

        values.push(id);
        const query: string = 
        `
            UPDATE users
            SET ${fields.join(", ")}
            WHERE id = $${values.length}
            RETURNING *
        `;
        console.log(query); 

        const updatedUser = await pool.query(query, values);

        res.status(200).json({
            success: true,
            user: updatedUser.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error while updating user"
        });
    }
};

const deleteUser = async(req: Request, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
    const deletedUser = await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING *
        `
        ,[id]
    );
    
        if(deletedUser.rowCount === 0){
        res.status(400).json({
            success: false,
            message: "User Id is incorrect"
        });
        console.log("This got hit")
        res.status(200).json({
            success: true,
            message: "User deleted successfully!!"
        });
    };
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error occured while deleting the user"
        })
    }
};

export  {loginUser, getAllUsers, getUser, createUser, updateUser, deleteUser};