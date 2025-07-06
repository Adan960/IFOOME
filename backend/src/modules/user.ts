import express from 'express';
import middleware from '../middleware/userAuth';
import database from '../config/database';
import redis from '../config/cache';
import jwt from 'jsonwebtoken';

const jwtSecret: string = process.env.JWT_SECRET || "";
const router = express.Router();


router.get("/backend/cardapio", middleware, async (_,res) => {
    const value: string | null = await redis.get('products');

    if(value != null) {
        res.send(JSON.parse(value));
    } else {
        database('SELECT * FROM produtos;').then((data: DBres) => {
            res.send(data.rows); 
            res.status(200);
            redis.set('products', JSON.stringify(data.rows)).catch(err => console.log(err));
        }).catch((err: any) => {
            console.log(err);
            res.sendStatus(500);
        })
    }
});

router.post("/backend/pedidos", middleware, (req, res) => {
    const user: number = getIdByToken(req);

    database('SELECT * FROM pedidos WHERE usuario = $1;', [user]).then((data) => {
        res.send(data.rows);
    }).catch(err => {
        console.log(err);
        res.status(500);
    })
})

router.post("/backend/avaliacao", middleware, (req, res) => {
    const user: number = getIdByToken(req);
    const note = parseInt(req.body.nota);
    const sugestion = req.body.sugestao;

    if(typeof(note) == "number" && typeof(sugestion) == "string" && note <= 5) {
        database(
            'INSERT INTO avaliacoes(usuario, nota, sugestao) VALUES($1, $2, $3);',
            [user, note, sugestion]
        )
        res.sendStatus(201);
    } else {
        res.sendStatus(400);
    }
})


interface DBres {
    rows: object[]
}

function getIdByToken(req: any): number {
    const token: string = req.headers['authorization'].split(" ")[1];
    var user: any = jwt.verify(token, jwtSecret);
    return user.id;
}

export default router;