
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = createPool({
    host: process.env.db_host, 
    user: process.env.db_user, 
    password: process.env.db_password, 
    database: process.env.db_name, 
    multipleStatements: true,
    timezone: 'UTC'
});