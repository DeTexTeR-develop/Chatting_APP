import { Pool } from "pg";

export const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "realtime_chat",
    password: "yourpassword",
    port: 5432,
})