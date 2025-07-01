import express from 'express';
import bodyParser from 'body-parser';

import auth from './modules/auth';
import user from './modules/user';

const app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

// Tratamento de erros global
app.use((err: any, _: any, res: any, next: any) => {
    res.status(400)
    .json({"status": "Requisição inválida", "erro:": err.message});
});

app.use("/",user);
app.use("/",auth);

export default app;