import express from 'express';
const router = express.Router();
import {createUser, deleteUser, getAllUsers, getUser, loginUser, updateUser} from '../controllers/user';
import { validate } from '../middleware/validation';
import { createUserSchema } from '../validators/user';
import { autheticateUser } from '../middleware/checkAuth';

router.get("/", autheticateUser, getAllUsers);
router.post("/", validate (createUserSchema), createUser);
router.post("/login", loginUser);
router.get("/:id", autheticateUser, getUser);
router.patch("/:id", autheticateUser, updateUser);
router.delete("/:id", autheticateUser, deleteUser);

export default router;