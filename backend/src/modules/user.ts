import express from 'express';
import middleware from '../middleware/userAuth';
import database from '../config/database';
import redis from '../config/cache';
import jwt from 'jsonwebtoken';

const jwtSecret: string = process.env.JWT_SECRET || "";
const router = express.Router();


router.get("/backend/menu", middleware, async (_,res) => {
    const value: string | null = await redis.get('products');

    if(value != null) {
        res.send(JSON.parse(value));
    } else {
        database('SELECT * FROM products;').then((data: DBres) => {
            res.send(data.rows); 
            redis.set('products', JSON.stringify(data.rows)).catch(err => console.log(err));
        }).catch((err: any) => {
            console.log(err);
            res.sendStatus(500);
        })
    }
});

router.get("/backend/orders", middleware, (req, res) => {
    const userId: number = getIdByToken(req);

    database('SELECT * FROM orders WHERE userId = $1;', [userId]).then((data) => {
        res.send(data.rows);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    })
});

router.post("/backend/orders", middleware, async (req: any, res: any) => {
    const { amount, name, deliveryDate } = req.body; // kind, state, price
    let price, kind;
    const userId: number = getIdByToken(req);

    if (!isValidDate(deliveryDate) || deliveryDate.split("-").map(Number)[0] !== new Date().getFullYear()) {
        return res.sendStatus(400);
    }

    await database('SELECT * FROM products WHERE name = $1', [name]).then(data => {
        if(data.rows.length != 0) {
            price = data.rows[0].price;
            kind = data.rows[0].kind;
        } else {
            kind = false;
        }
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });

    if(kind == false) {
        return res.sendStatus(400);
    }

    if (!Number.isInteger(price) || !Number.isInteger(amount)) {
        return res.sendStatus(400);
    }

    if (typeof name !== "string" || typeof kind !== "string") {
        return res.sendStatus(400);
    }

    database(
        `INSERT INTO orders (price, amount, name, kind, state, deliveryDate, userId) 
        VALUES($1, $2, $3, $4, $5, $6, $7);`,
        [price, amount, name, kind, "pendente", deliveryDate, userId]
    ).then(() => res.sendStatus(201))
    .catch((err) => {
        console.log(err);
        res.sendStatus(500);
    });
});

router.post("/backend/review", middleware, (req, res) => {
    const userId: number = getIdByToken(req);
    const score = parseInt(req.body.score);
    const sugestion = req.body.sugestion;

    if(typeof(score) == "number" && typeof(sugestion) == "string" && score <= 5) {
        database(
            'INSERT INTO reviews(userId, score, sugestion) VALUES($1, $2, $3);',
            [userId, score, sugestion]
        )
        res.sendStatus(201);
    } else {
        res.sendStatus(400);
    }
});


interface DBres {rows: object[]}

function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

function getIdByToken(req: any): number {
    const token: string = req.headers['authorization'].split(" ")[1];
    var user: any = jwt.verify(token, jwtSecret);
    return user.id;
}

export default router;