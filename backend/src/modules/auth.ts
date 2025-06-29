import express from 'express';

import database from '../config/database';

const router = express.Router();

async function buscarUsuarioEmail(email: string): Promise<object> {
    const tst = await database('SELECT * FROM usuarios WHERE email = $1',[email]);
    return await tst.rows[0];
};

router.post("/backend/criarLogin",(req,res):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(regex.test(email)) {
        buscarUsuarioEmail(email).then((user: object | undefined) => {
            if(typeof(user) == "undefined") {
                database(
                    'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);',
                    [email, senha, 0]
                );
                res.sendStatus(201);
            }else {
                res.sendStatus(409);
            }
        }).catch((err: object) => {
            console.log(err);
        });
    } else {
        res.sendStatus(400);
    }
});
 
export default router;