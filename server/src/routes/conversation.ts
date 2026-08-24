import express from "express";
import { autheticateUser } from "../middleware/checkAuth";

const router = express.Router();

import { 
    createConversation , getConversations , getMessage , sendMessage
} from "../controllers/conversation";
import upload from "../config/multer";

router.get('/', autheticateUser, getConversations);
router.post('/', autheticateUser, createConversation);
router.get('/:id/messages', autheticateUser, getMessage);
router.post('/:id/messages', autheticateUser, (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, sendMessage);



export default router;