const express = require("express");
const router = express.Router();

import { createUser, loginUser } from "../controllers/auth"; 
import { validate } from "../middleware/validation";
import { createUserSchema } from '../validators/user';

router.post("/login", loginUser);
router.post("/signup", validate(createUserSchema) ,createUser);


export default router;