import express from 'express';

import database from '../config/database';

const router = express.Router();

router.post("/backend/criarLogin",(req,res):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    database(
        'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3) RETURNING *',
        [email, senha, 0]
    )
    res.sendStatus(200);
});
 
export default router;