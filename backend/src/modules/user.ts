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
        const head = await database(`SELECT * FROM orders WHERE user_id = ${user_id};`);
        
        if (head.rows.length == 0) {
            return res.sendStatus(204);
        }

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

router.post("/backend/orders", middleware, async (req: any, res: any) => {
    let products: any = await redis.get('products');
    let totalPrice: number = 0;
    let validNames: string[] = [];
    let prices: number[] = [];
    const deliveryDate: string = req.body.deliveryDate;
    const orderItems: orderItems[] = req.body.orderItems;
    const paymentMethod: string = req.body.paymentMethod;
    const user_id: number = getIdByToken(req);

    if(typeof(deliveryDate) != "string" || !isValidDate(deliveryDate)) {
        return res.sendStatus(400);
    }

    if(typeof(orderItems) != "object" || orderItems.length == 0) {
        return res.sendStatus(400);
    }

    if(typeof(paymentMethod) != "string") {
        return res.sendStatus(400);
    }

    if(products == null) {
        await updateRedis();
        products = await redis.get('products');
    }

    if(products == null) {
        return res.sendStatus(204);
    }

    products = JSON.parse(products);
    
    for(let i = 0; i < products.length; i++) {
        validNames.push(products[i].name);
    }
    for(let i = 0; i < orderItems.length; i++) {
        const productName: string = orderItems[i].productName;
        const quantity: number = orderItems[i].quantity;
        const index: number = validNames.indexOf(productName);
        
        if(typeof(quantity) != "number" || quantity <= 0 || index == -1) {
            return res.sendStatus(400);
        }
        prices.push(products[index].price);
        totalPrice += products[index].price * quantity;
    }

    database('INSERT INTO orders (state, delivery_date, user_id, total_price, payment_method) VALUES($1, $2, $3, $4, $5) RETURNING id;',
        ["pendente", new Date(deliveryDate), user_id, totalPrice, paymentMethod]
    ).then((data) => {
        for(let i = 0; i < orderItems.length; i++) {
            database('INSERT INTO order_items (order_id, product_name, quantity, unit_price) VALUES($1, $2, $3, $4)',
                [data.rows[0].id, orderItems[i].productName, orderItems[i].quantity, prices[i]]
            ).catch(err => {
                console.log(err);
                return res.sendStatus(500);
            });
        }
        res.sendStatus(201);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
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
interface orderItems {
    productName: string,
    quantity: number
}

async function updateRedis(): Promise<void> {
    await database('SELECT * FROM products;').then(async (data: DBres) => { 
        redis.set('products', JSON.stringify(data.rows)).catch(err => console.log(err));
    }).catch((err: any) => {
        console.log(err);
    });
}

function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    const thisDate = new Date();
    const thisYear = thisDate.getFullYear();

    if(isNaN(date.getTime()) || parseInt(dateString.split("-")[0]) != thisYear || dateString.length < 10) {
        return false
    } else {
        return true
    }
}

function getIdByToken(req: any): number {
    const token: string = req.headers['authorization'].split(" ")[1];
    var user: any = jwt.verify(token, jwtSecret);
    return user.id;
}

export default router;