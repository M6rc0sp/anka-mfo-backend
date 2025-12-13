import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';

const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const db = drizzle(pool);

export async function connectDatabase() {
    try {
        await pool.query('SELECT NOW()');
        console.log('✓ Database connected successfully');
        return true;
    } catch (error) {
        console.error('✗ Failed to connect to database:', error);
        return false;
    }
}

export async function disconnectDatabase() {
    try {
        await pool.end();
        console.log('✓ Database connection closed');
    } catch (error) {
        console.error('✗ Error closing database:', error);
    }
}
