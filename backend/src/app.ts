import express from 'express';
import bodyParser from 'body-parser';
import auth from './modules/login';
import user from './modules/user';
import admin from './modules/admin';

const app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

// Tratamento de erros global
app.use((err: any, _: any, res: any, next: any) => {
    res.sendStatus(400)
    .json({"status": "Requisição inválida", "erro:": err.message});
});

app.use("/",user);
app.use("/",auth);
app.use("/", admin);

export default app;