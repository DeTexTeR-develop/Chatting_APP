import { Request, Response } from "express";
import { pool } from "../config/db";
import { getIO } from "../sockets/socket";


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

};

const getConversations = async (req: Request, res: Response) => {
    try{
        const id = (req as any).user.id;
        const allConversationsOfUser = await pool.query(
            `
            SELECT * FROM conversations
            WHERE user1_id=$1 OR user2_id=$1
            `, [id]
        );

        if(!allConversationsOfUser || allConversationsOfUser.rows.length <= 0){
            return res.status(400).json({
                success: false,
                message: "Something went wrong while getting the Conversations"
            });
        };

        return res.status(200).json({
            success: true,
            message: allConversationsOfUser.rows
        });
    }catch(err) {
        console.error(err);
        res.status(500).json(
            {
                success: false,
                message: "Something went wrong while getting the conversations"
            }
        )
    }
    return
};

const getMessage = async(req: Request, res: Response) => {
    try{
        const conversationId = req.params.id;

        const message = await pool.query(
            `
            SELECT * FROM messages
            WHERE conversation_id=$1
            `, [conversationId]
        );

        if(!message || message.rows.length <=0) {
            return res.status(400).json({
                success: false,
                message: "Couldn't get messages at the moment please try again later"
            });
        }
        res.status(200).json({
            success: true,
            message: message.rows[0]
        });

    }catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Something went wrong while getting the messages"
        })
    }
}
const sendMessage = async(req: Request, res: Response) => {
    try{
    const senderId = (req as any).user.id;
        const conversationId = req.params.id;
        const messageContent = req.body.content;

        if(!messageContent) {
            console.error("Somerthing went wron while sending message")
            return res.status(400).json({
                success: false,
                message: "message content is requried"
            });
        };
        if(!conversationId){
            console.error("Somerthing went wron while sending message")
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



        if(!message || message.rows.length <=0){
            return res.status(400).json({
                success : false,
                message: "Couldn't send message please try agian later"
            });
        };

        const io = getIO();
        io.to("conversation:" + conversationId).emit("receive_message",{
            message: message.rows[0]
        });

        res.status(200).json({
            success: true,
            message: message.rows[0]
        });
    }catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Something went wrong while sending message"
        })
    }
}
export  { createConversation , getConversations, getMessage , sendMessage};