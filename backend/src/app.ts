import express from 'express';
import bodyParser from 'body-parser';
import auth from './modules/login';
import user from './modules/user';
import pays from './modules/payment';
import admin from './modules/admin';
import cors from 'cors';

const app = express();

app.use(bodyParser.urlencoded({ extended: true, limit: '50kb' }));
app.use(bodyParser.json({ limit: '50kb' }));

app.use(cors());

// Tratamento de erros global
app.use((err: any, _: any, res: any, _next: any) => {
    res.sendStatus(400).json({"status": "Requisição inválida", "erro:": err.message});
});

app.use("/", user);
app.use("/", auth);
app.use("/", pays);
app.use("/", admin);

export default app;