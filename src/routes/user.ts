import express from 'express';
const router = express.Router();
import {createUser, deleteUser, getAllUsers, getUser, updateUser} from '../controllers/user';

router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;