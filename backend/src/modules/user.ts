import express from 'express';
import { createClient } from 'redis';

import middleware from '../middleware/userAuth';
import database from '../config/database';

const router = express.Router();
const client = createClient({url: 'redis://localhost:6380'});

client.on('error', error => {
    console.error(`Redis client error:`, error);
});

client.connect().then().catch(err => {
    console.log(err);
})

type DBres = {
    rows: object[]
}

router.get("/backend/cardapio", middleware, async (_,res) => { // COLOCAR UM CASH COM O REDIS AQUI!
    const value: string | null = await client.get('products');

    if(value != null) {
        res.send(JSON.parse(value));
    } else {
        database('SELECT * FROM produtos;').then((data: DBres) => {
            res.send(data.rows); 
            res.status(200);
            client.set('products', JSON.stringify(data.rows));
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        })
    }
});

export default router;