import express from 'express';

import database from '../config/database';

const router = express.Router();

async function buscarUsiarioEmail(email: string): Promise<object> {
    const tst = await database('SELECT * FROM usuarios WHERE email = $1',[email]);
    return await tst.rows[0];
}

router.post("/backend/criarLogin",(req,res):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    buscarUsiarioEmail(email).then((user: object | undefined) => {
        if(typeof(user) == "undefined") {
            res.sendStatus(201);
        }else {
            res.sendStatus(409);
        }
    }).catch((err: object) => {
        console.log(err);
    })

    /*
    database(
        'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);',
        [email, senha, 0]
    );
    */
});
 
export default router;