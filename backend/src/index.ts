import express from 'express';
import bodyParser from 'body-parser';

import dbConfig from './config/database';
import auth from './modules/auth/auth';
import user from './modules/users/user';

const app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

app.use("/",user);
app.use("/",auth);

dbConfig();

app.listen(process.env.PORT, ():void => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}/backend/`);
})