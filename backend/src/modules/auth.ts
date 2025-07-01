import express from 'express';
import bcrypt from 'bcrypt';

import database from '../config/database';

const router = express.Router();

const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hash(senha: string): Promise<string> {
    const saltRounds: number = 12;
    const hash = await bcrypt.hash(senha, saltRounds);
    return hash;
}

async function checkPassword(senha: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(senha, hash);
}

async function findUserByEmail(email: string): Promise<undefined | User> {
    const tst = await database('SELECT * FROM usuarios WHERE email = $1;',[email]);
    return await tst.rows[0];
};

type User = {
    email: string,
    senha: string
};


router.post("/backend/createLogin",async (req: any,res: any):Promise<void> => {
    const email: string = req.body.email;
    const senha: string = req.body.senha;

    if(regex.test(email)) {
        if(typeof(await findUserByEmail(email)) == "undefined") {
            const passwordHash: string = await hash(senha);
            database(
                'INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);',
                [email, passwordHash, 0]
            );
            res.sendStatus(201);
        } else {
            res.sendStatus(409);
        }
    } else {
        res.sendStatus(400);
    }
});

router.post("/backend/login",async (req: any,res: any):Promise<void> => {
    const email: string = await req.body.email;
    const senha: string = await req.body.senha;

    if(regex.test(email)) {
        const user: User | undefined = await findUserByEmail(email);
        if(typeof(user) != "undefined") {
            if(await checkPassword(senha, user.senha)) {
                res.sendStatus(200);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(404);
        }
    } else {
        res.sendStatus(400);
    }
});
 
export default router;