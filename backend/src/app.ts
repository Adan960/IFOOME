import express from 'express';
import bodyParser from 'body-parser';

import auth from './modules/auth';
import user from './modules/user';

const app = express();

app.use(bodyParser.urlencoded())
app.use(bodyParser.json());

app.use("/",user);
app.use("/",auth);

export default app;