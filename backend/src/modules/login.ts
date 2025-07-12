import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../config/database';
import middleware from '../middleware/loginAuth';

const router = express.Router();

const regex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jwtSecret: string = process.env.JWT_SECRET || "";


router.post("/backend/createLogin", middleware ,async (req: any,res: any):Promise<void> => {
        const email: string = req.body.email;
        const password: string = req.body.password;

        if(typeof(await findUserByEmail(email)) == "undefined") {
            const passwordHash: string = await hash(password);
            database(
                'INSERT INTO users(email, password, role) VALUES($1, $2, $3);',
                [email, passwordHash, 0]
            );
            res.sendStatus(201);
        } else {
            res.sendStatus(409);
        }
});

router.post("/backend/login", middleware ,async (req: any,res: any):Promise<void> => {
        const email: string = await req.body.email;
        const password: string = await req.body.password;

        const user: User | undefined = await findUserByEmail(email);
        if(typeof(user) != "undefined") {
            if(await authPassword(password, user.password)) {
                res.Status = 200;
                res.send(createToken(user.id,user.role));
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(404);
        }
});


interface User {
    id: number,
    email: string,
    password: string,
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
    const tst = await database('SELECT * FROM users WHERE email = $1;',[email]);
    return await tst.rows[0];
}

function createToken(id: number, role: number):string {
    return jwt.sign({id: id, role: role}, jwtSecret);
}
 
export default router;