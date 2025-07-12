import express from 'express';
import middleware from '../middleware/adminAuth';
import database from '../config/database';
import redis from '../config/cache';

const router = express.Router();

router.get("/backend/admin/review", middleware, (_, res) => {
    database('SELECT * FROM reviews;').then((data: DBres) => {
        res.send(data.rows); 
    }).catch((err: any) => {
        console.log(err);
        res.sendStatus(500);
    })
});

router.post("/backend/admin/menu", middleware, (req, res) => {
    const name: string | undefined = req.body.name;
    const kind: string | undefined = req.body.kind;
    const price = req.body.price * 100;

    if(typeof(name) == "string" && typeof(kind) == "string" && typeof(price) == "number") {
        database(
            'INSERT INTO products(name, price, kind) VALUES($1, $2, $3);',
            [name, price, kind]
        ).then(() => {
            updateRedis(res);
        }).catch((err: object) => {
            console.log(err);
            res.sendStatus(500);
        });
    } else {
        res.sendStatus(400);
    }
});

router.delete("/backend/admin/menu", middleware, (req, res) => {
    const name: string | undefined = req.body.name;

    if(typeof(name) == "string") {
        database(`DELETE FROM products WHERE name = $1;`, [name]).then(() => {
            updateRedis(res);
        }).catch((err: object) => {
            console.log(err);
            res.sendStatus(500);
        });
    } else {
        res.sendStatus(400);
    }
});

interface DBres {
    rows: object[]
}

function updateRedis(res: any) {
    database('SELECT * FROM products;').then((data: DBres) => {
        redis.set('products', JSON.stringify(data.rows)).then(()=> {
            res.sendStatus(200);
        }).catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
    }).catch((err: any) => {
        console.log(err);
        res.sendStatus(500);
    })
}

export default router;