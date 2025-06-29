import express from 'express';

import database from '../../database/auth';

const router = express.Router();

router.post("/backend/criarLogin",(req,res):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    database.criarLogin(email, senha);

    res.send(email + senha);
});
 
export default router;