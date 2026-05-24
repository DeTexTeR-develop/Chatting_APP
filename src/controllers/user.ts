import { Request, Response } from "express";

import { pool } from "../config/db";
import { UUID } from "node:crypto";

const getAllUsers = async(req : Request, res : Response) : Promise<void> => {
    try{
        const users = await pool.query(
            `SELECT * FROM users`
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
            `SELECT * FROM users WHERE id = $1 `, [id]
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

const updateUser = async(req : Request, res: Response) : Promise<void> => {
    try{
        const id = req.params.id;
        const {username , email} = req.body;
        const user = await pool.query(
            `UPDATE users 
             SET username=$1 ,
                email=$2
                WHERE id = $3
                RETURNING *`, [username, email, id]);
            res.status(200).json({
                success: true,
                message: `User Updated Successfully : ${JSON.stringify(user)}`}
        );
    }catch(err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error Occured while updating the User."
        });
    }
};
export  {getAllUsers, getUser, updateUser};