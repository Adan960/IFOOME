import express from 'express';
import dbConfig from './config/database';

dbConfig()

const app = express();

app.get("/", (_, res) => {
    res.send("Hello world");
})

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}/`);
})