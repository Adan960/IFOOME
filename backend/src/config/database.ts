const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    max: 3, // Número máximo de conexões
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000 // 30 segundos de inatividade antes de fechar
});

export default async function conectar(sql: string, params?: any[]):Promise<any> {
    const client = await pool.connect();
    try {
        return await client.query(sql, params);
    } catch(err) {
        console.log(err);
        return err;
    } finally {
        client.release();
    }
}

export const dbPool = pool;