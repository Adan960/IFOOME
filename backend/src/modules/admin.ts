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

router.delete("/backend/admin/review", middleware, (req, res) => {
    const id: number | undefined = req.body.id;
    
    if(typeof(id) == "number") {
        database(`DELETE FROM reviews WHERE id = $1;`, [id]).then(() => {
            res.sendStatus(200);
        }).catch(err => {
            res.sendStatus(500);
            console.log(err);
        });
    } else {
        res.sendStatus(400);
    }
});

router.get("/backend/admin/orders", middleware, (_, res) => {
    const today =  new Date();
    today.setHours(0, 0, 0, 0);

    database('SELECT * FROM orders WHERE deliverydate = $1;',[today]).then((data) => {
        res.send(data.rows);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
})

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

router.put("/backend/admin/menu", middleware, (req, res) => {
    const { name, kind, newName } = req.body;
    const price: number | undefined = req.body.price * 100;

    if(typeof(name) == "string") {
        if(typeof(kind) == "string" && typeof(price) == "number" && typeof(newName) == "string") {
            database(
                'UPDATE products SET kind = $2, name = $3, price = $4 WHERE name = $1',
                [name, kind, newName, price]
            ).then(() => {
                updateRedis(res);
            }).catch(err => {
                console.log(err);
                return res.sendStatus(500);
            })
        } else {
            res.sendStatus(400);
        }
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