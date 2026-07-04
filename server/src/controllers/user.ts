import { Request, Response } from "express";
import { pool } from "../config/db";
import redisClient from "../services/redis";
import { UUID } from "node:crypto";

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

const getUser = async(req: Request, res: Response)  => {
    try{
        const id = req.params.id;
        const key = `user:${id}`;
        const cachedUser = await redisClient.get(key);
        if(cachedUser){
            return res.status(200).json({
                    success: true,
                    user: JSON.parse(cachedUser)
            });
        }
        const user = await pool.query(
            `
            SELECT * FROM users 
            WHERE id = $1 
            `, [id]
        );
        const redisResult = await redisClient.set(
            key,
            JSON.stringify(user.rows[0]),
            "EX", 3600
        );

        console.log("SET RESULT:", redisResult);

        const value = await redisClient.get(key);
        console.log(value);

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

        const updatedUser = await pool.query(query, values);
        const key= `user:${updatedUser.rows[0].id}`;
        await redisClient.del(key);
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

            const key = `user:${id}`;
            await redisClient.del(key);
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

export  {getAllUsers, getUser, updateUser, deleteUser};