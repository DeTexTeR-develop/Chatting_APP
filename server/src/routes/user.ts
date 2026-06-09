import express from 'express';
const router = express.Router();
import {deleteUser, getAllUsers, getUser, updateUser} from '../controllers/user';
import { autheticateUser } from '../middleware/checkAuth';
import { checkAuthorization } from '../middleware/authorization';

router.get("/", autheticateUser, getAllUsers);
router.get("/:id", autheticateUser, getUser);
router.patch("/:id", autheticateUser, updateUser);
router.delete("/:id", autheticateUser , checkAuthorization("Admin"), deleteUser);

export default router;