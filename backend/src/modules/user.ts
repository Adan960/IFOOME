import express from 'express';
import middleware from '../middleware/userAuth';
import database from '../config/database';
import redis from '../config/cache';

const router = express.Router();

type DBres = {
    rows: object[]
}

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

export default router;