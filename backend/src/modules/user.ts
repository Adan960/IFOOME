import express from 'express';
import middleware from '../middleware/userAuth';
import database from '../config/database';
import redis from '../config/cache';
import jwt from 'jsonwebtoken';

const jwtSecret: string = process.env.JWT_SECRET || "";
const router = express.Router();


router.get("/backend/menu", middleware, async (_,res) => {
    let value: string | null = await redis.get('products');

    if(value != null) {
        res.send(JSON.parse(value));
    } else {
        await updateRedis();
        value = await redis.get('products');
    }

    if(value != null) {
        res.send(JSON.parse(value));
    } else {
        res.sendStatus(500);
    }
});

router.get("/backend/orders", middleware, async (req: any, res: any) => {
    try {
        const user_id: number = getIdByToken(req);
        const head: DBres = await database(`SELECT * FROM orders WHERE user_id = ${user_id};`);
        
        if (head.rows.length == 0) return res.sendStatus(204);

        const promises = head.rows.map(async (row: any, i: number) => {
            const body = await database(`SELECT * FROM order_items WHERE order_id = ${row.id};`);
            return {
                pedido: i + 1,
                head: row,
                body: body.rows
            };
        });

        res.send(await Promise.all(promises));
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

router.post("/backend/review", middleware, (req, res) => {
    const user_id: number = getIdByToken(req);
    const score = parseInt(req.body.score);
    const sugestion = req.body.sugestion;

    if(typeof(score) == "number" && typeof(sugestion) == "string" && score <= 5) {
        database(
            'INSERT INTO reviews(user_id, score, sugestion) VALUES($1, $2, $3);',
            [user_id, score, sugestion]
        )
        res.sendStatus(201);
    } else {
        res.sendStatus(400);
    }
});


interface DBres {rows: object[]}

async function updateRedis(): Promise<void> {
    await database('SELECT * FROM products;').then(async (data: DBres) => { 
        redis.set('products', JSON.stringify(data.rows)).catch(err => console.log(err));
    }).catch((err: any) => {
        console.log(err);
    });
}

function getIdByToken(req: any): number {
    const token: string = req.headers['authorization'].split(" ")[1];
    var user: any = jwt.verify(token, jwtSecret);
    return user.id;
}

export default router;