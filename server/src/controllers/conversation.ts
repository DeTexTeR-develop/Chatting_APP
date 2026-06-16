import { Request, Response } from "express";
import { pool } from "../config/db";

const createConversation = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user.id;
        const userIdForSecond = req.body.userIdForSecond;

        if (!userIdForSecond) {
            return res.status(400).json({
                message: "Second user id is required",
                success: false
            });
        };

        if (currentUserId === userIdForSecond) {
            return res.status(400).json({
                message: "Cannot create conversation with yourself",
                success: false
            })
        };

        const existingConveration = await pool.query(
            `
                SELECT * FROM conversations
                WHERE 
                (user1_id = $1 AND user2_id = $2)
                OR
                (user1_id = $2 AND user2_id = $1)
            `, [currentUserId, userIdForSecond]
        );

        if(existingConveration && existingConveration.rows.length > 0){
            return res.status(200).json({
                success: true,
                message: "Conversation already exists",
                conversation: existingConveration.rows[0]

            });
        };

        const newConversation = await pool.query(
            `
            INSERT INTO conversations(
                user1_id, user2_id
            ) VALUES ($1, $2) RETURNING *
            `, [currentUserId, userIdForSecond]
        );

        res.status(200).json({
            success: true,
            message: "Conversation created successfully ",
            conversation: newConversation.rows[0]
        });
    }
    catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: "something went wrong while creating conversation"
        })
    }

}

export default { createConversation };