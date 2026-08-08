import { Request, Response } from "express";
import { pool } from "../config/db";
import { pubRedisClient } from "../services/redisService/pubsub";


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
            });
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

        if (existingConveration && existingConveration.rows.length > 0) {
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
        });
    };
};

const getConversations = async (req: Request, res: Response) => {
    try {
        const id = (req as any).user.id;
        const allConversationsOfUser = await pool.query(
            `
            SELECT
              c.*,
              CASE
                WHEN c.user1_id = $1 THEN u2.username
                ELSE u1.username
              END AS other_username
            FROM conversations c
            JOIN users u1 ON u1.id = c.user1_id
            JOIN users u2 ON u2.id = c.user2_id
            WHERE c.user1_id = $1 OR c.user2_id = $1
            ORDER BY c.created_at DESC
            `, [id]
        );

        return res.status(200).json({
            success: true,
            conversations: allConversationsOfUser.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting the conversations"
        });
    }
};

    const getMessage = async (req: Request, res: Response) => {
        try {
            const limit = Math.min(Number(req.query.limit) || 30, 100);
            const cursor = req.query.created_at;
            const conversationId = req.params.id;
            let message;
            let hasMore;
            if (!cursor) {
                message = await pool.query(
                    `
                    SELECT * FROM messages
                    WHERE conversation_id=$1
                    ORDER BY created_at DESC
                    LIMIT $2
                    `, [conversationId, limit+1]
                )
            }else{
                message = await pool.query(
                `
                SELECT * FROM messages
                WHERE conversation_id=$1
                AND created_at < $3
                ORDER BY created_at DESC
                LIMIT $2
                `, [conversationId, limit+1, cursor]
            );
            };

            if(message.rows.length > limit){
                hasMore = true;
            }else{
                hasMore = false;
            };
            const messages = message.rows.slice(0, limit);
            res.status(200).json({
                success: true,
                messages: messages,
                hasMore
            });

        } catch (err) {
            console.error(err)
            res.status(500).json({
                success: false,
                message: "Something went wrong while getting the messages"
            })
        }
    }
const sendMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req as any).user.id;
        const conversationId = req.params.id;
        const messageContent = req.body.content;

        if (!messageContent) {
            console.error("Somerthing went wron while sending message")
            return res.status(400).json({
                success: false,
                message: "message content is requried"
            });
        };
        if (!conversationId) {
            console.error("Somerthing went wrong while sending message")
            return res.status(400).json({
                success: false,
                message: "conversation id is required"
            });
        };


        const message = await pool.query(
            `
            INSERT INTO messages
            (
            content, conversation_id, sender_id
            ) VALUES( $1, $2, $3) RETURNING *
            `, [messageContent, conversationId, senderId]
        );

        if (!message || message.rows.length <= 0) {
            return res.status(400).json({
                success: false,
                message: "Couldn't send message please try agian later"
            });
        };

        const senderInfo = await pool.query(
            `SELECT username FROM users WHERE id = $1`, [senderId]
        );
        const sender_username = senderInfo.rows[0]?.username ?? null;

        const messageWithSender = { ...message.rows[0], sender_username };

        pubRedisClient.publish("chat:message", JSON.stringify({
            conversationId,
            message: messageWithSender
        }))
        
        res.status(200).json({
            success: true,
            message: messageWithSender
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Something went wrong while sending message"
        })
    }
};
export { createConversation, getConversations, getMessage, sendMessage };