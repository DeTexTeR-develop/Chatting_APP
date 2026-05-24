import express from 'express';
const router = express.Router();
import {getAllUsers, getUser, updateUser} from '../controllers/user';

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);

export default router;