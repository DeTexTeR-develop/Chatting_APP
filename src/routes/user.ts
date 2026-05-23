import express from 'express';
const router = express.Router();
import {getAllUsers} from '../controllers/user';

router.get('/', getAllUsers);

export default router;