import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../config/database';

const router = express.Router();

const regex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jwtSecret: string = process.env.JWT_SECRET || "";


router.post("/backend/criarLogin",async (req: any,res: any):Promise<void> => {
    if(req.body && typeof(req.body.email) == "string" && typeof(req.body.senha) == "string") {
        const email: string = req.body.email;
        const password: string = req.body.senha;

        if(regex.test(email)) {
            if(typeof(await findUserByEmail(email)) == "undefined") {
                const passwordHash: string = await hash(password);
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
    } else {
        res.sendStatus(412);
    }
});

router.post("/backend/login",async (req: any,res: any):Promise<void> => {
    if(req.body && typeof(req.body.email) == "string" && typeof(req.body.senha) == "string") {
        const email: string = await req.body.email;
        const password: string = await req.body.senha;

        if(regex.test(email)) {
            const user: User | undefined = await findUserByEmail(email);
            if(typeof(user) != "undefined") {
                if(await authPassword(password, user.senha)) {
                    res.Status = 200;
                    res.send(createToken(user.id,user.role));
                } else {
                    res.sendStatus(403);
                }
            } else {
                res.sendStatus(404);
            }
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(412);
    }
});


interface User {
    id: number,
    email: string,
    senha: string,
    role: number
}

async function hash(password: string): Promise<string> {
    const saltRounds: number = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

async function authPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

async function findUserByEmail(email: string): Promise<undefined | User> {
    const tst = await database('SELECT * FROM usuarios WHERE email = $1;',[email]);
    return await tst.rows[0];
}

function createToken(id: number, role: number):string {
    return jwt.sign({id: id, role: role}, jwtSecret);
}
 
export default router;