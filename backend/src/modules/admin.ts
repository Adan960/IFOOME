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

router.get("/backend/admin/orders/today", middleware, async (_: any, res: any) => { 
    try {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const orders = await database(
            `SELECT id, state, total_price, user_id, payment_method FROM orders WHERE delivery_date::date = $1::date;`,
            [todayString]
        );
        
        if (orders.rows.length === 0) {
            return res.sendStatus(204);
        }

        const ordersWithItems = await Promise.all(
            orders.rows.map(async (order: any, index: any) => {
                const userName = await database(`SELECT name FROM users WHERE id = ${order.user_id}`);
                const items = await database(`SELECT * FROM order_items WHERE order_id = ${order.id};`);
                
                return {
                    head: {
                        "pedido": index+1,
                        "user": userName.rows[0].name,
                        "state": order.state,
                        "total_price": order.total_price,
                        "payment_method": order.payment_method
                    },
                    body: items.rows
                };
            })
        );

        res.send(ordersWithItems);
        
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.put("/backend/admin/orders", middleware, (req, res) => {
    
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
            updateRedis(201, res);
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
                updateRedis(200, res);
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
            updateRedis(200, res);
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

function updateRedis(httpStatus: number, res: any): void {
    database('SELECT * FROM products;').then((data: DBres) => {
        redis.set('products', JSON.stringify(data.rows)).then(()=> {
            res.sendStatus(httpStatus);
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