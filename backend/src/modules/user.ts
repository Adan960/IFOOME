import express from 'express';

import middleware from '../middleware/userAuth';
import database from '../config/database';

const router = express.Router();

type DBres = {
    rows: object[]
}

router.get("/backend/cardapio", middleware,(_,res) => { // COLOCAR UM CASH COM O REDIS AQUI!
    database('SELECT * FROM produtos;').then((data: DBres) => {
        res.json(data.rows);
        res.status(200);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    })
});

export default router;