import express from 'express';
import middleware from '../middleware/adminAuth';
import database from '../config/database';
import redis from '../config/cache';

const router = express.Router();


router.post("/backend/admin/cardapio", middleware, (req, res) => {
    const name: string = req.body.nome;
    const price: number = req.body.preco * 100;
    const type: string = req.body.tipo;

    database(
        'INSERT INTO produtos(nome, preco, tipo) VALUES($1, $2, $3);',
        [name, price, type]
    ).then(() => {
        updateRedis(res);
    }).catch((err: object) => {
        console.log(err);
        res.sendStatus(500);
    })
})

router.delete("/backend/admin/cardapio", middleware, (req, res) => {
    const name: string = req.body.nome;

    database(`DELETE FROM produtos WHERE nome = $1;`, [name]).then(() => {
        updateRedis(res);
    }).catch((err: object) => {
        console.log(err);
        res.sendStatus(500);
    })
})

interface DBres {
    rows: object[]
}

function updateRedis(res: any) {
    database('SELECT * FROM produtos;').then((data: DBres) => {
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