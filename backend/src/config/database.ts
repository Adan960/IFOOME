const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_User,
    password: process.env.DB_Password,
    host: process.env.DB_Host,
    port: process.env.PG_Port,
    database: process.env.DB_Name
});

export default async function connect():Promise<void> {
    await client.connect();
    
    try {
        const result = await client.query('SELECT $1::text as message', ['Hello world!']);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}