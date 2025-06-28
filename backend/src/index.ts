import express from 'express';
import dbConfig from './config/database';

const app = express();


dbConfig()

app.get("/backend/", (_, res) => {
    res.send("Hello world");
})

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}/backend/`);
})