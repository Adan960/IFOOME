const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_User,
    password: process.env.DB_Password,
    host: process.env.DB_Host,
    port: process.env.DB_Port,
    database: process.env.DB_Name,
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
        return await err;
    } finally {
        client.release();
    }
}

export const dbPool = pool; // Exportando o pool