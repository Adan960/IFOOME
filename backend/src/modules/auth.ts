import express from 'express';
import bcrypt from 'bcrypt';

import database from '../config/database';

const router = express.Router();

const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hash(senha: string): Promise<string> {
    const saltRounds = 12;
    const hash = await bcrypt.hash(senha, saltRounds);
    return hash;
}

async function verificarSenha(senha: string, hash: string): Promise<boolean> {
    if(await bcrypt.compare(senha, hash)) {
        return true
    } else {
        return false;
    }
}

async function buscarUsuarioEmail(email: string): Promise<object> {
    const tst = await database('SELECT * FROM usuarios WHERE email = $1;',[email]);
    return await tst.rows[0];
};

router.post("/backend/criarLogin",(req: any,res: any):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    if(regex.test(email)) {
        buscarUsuarioEmail(email).then((user: object | undefined) => {
            if(typeof(user) == "undefined") {
                hash(senha).then((hash) => {
                    database(
                        'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);',
                        [email, hash, 0]
                    );
                    res.sendStatus(201);
                })
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

router.post("/backend/login",(req: any,res: any):void => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    if(regex.test(email)) {
        buscarUsuarioEmail(email).then((user: any | undefined) => {
            if(typeof(user) != "undefined") {
                verificarSenha(senha, user.senha).then((valido) => {
                    if(valido) {
                        res.sendStatus(200);
                    } else {
                        res.sendStatus(403);
                    }
                });
            } else {
                res.sendStatus(404);
            }
        }).catch((err: object) => {
            console.log(err);
        });
    } else {
        res.sendStatus(400);
    }
});
 
export default router;