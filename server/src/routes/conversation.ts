import express from "express";
import { autheticateUser } from "../middleware/checkAuth";
import { checkAuthorization } from "../middleware/authorization";


const router = express.Router();


import { 
    createConversation , getConversations , getMessage , sendMessage
} from "../controllers/conversation";

router.get('/', autheticateUser, getConversations);
router.post('/', autheticateUser, createConversation);
router.get('/:id/messages', autheticateUser, getMessage);
router.post('/:id/messages', autheticateUser, sendMessage);


export default router;