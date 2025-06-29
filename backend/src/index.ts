import express from 'express';
import bodyParser from 'body-parser';

import auth from './modules/auth';
import user from './modules/user';

const app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

app.use("/",user);
app.use("/",auth);

app.listen(process.env.PORT, ():void => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}/backend/`);
})