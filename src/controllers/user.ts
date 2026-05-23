import { Request, Response } from "express";

import { pool } from "../config/db";

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
            message: "Internal Server Error"
        })
    }
};

export  {getAllUsers};