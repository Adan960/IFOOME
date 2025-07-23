import express from 'express';
import middleware from '../middleware/userAuth';
import database from '../config/database';
import redis from '../config/cache';
import jwt from 'jsonwebtoken';
import pay from '../config/mercadopago';

const jwtSecret: string = process.env.JWT_SECRET || "";
const router = express.Router();

router.post("/backend/teste", middleware, (req: any, res: any) => {
    res.sendStatus(200);
    console.log(req);
})

router.post("/backend/orders", middleware, async (req: any, res: any) => {
    let products: any = await redis.get('products');
    let totalPrice: number = 0;
    let validNames: string[] = [];
    let prices: number[] = [];
    const deliveryDate: string = req.body.deliveryDate;
    const orderItems: orderItems[] = req.body.orderItems;
    const paymentMethod: string = req.body.paymentMethod;
    const user_id: number = getIdByToken(req);

    if(typeof(deliveryDate) != "string" || !isValidDate(deliveryDate)) return res.sendStatus(400);

    if(typeof(orderItems) != "object" || orderItems.length == 0) return res.sendStatus(400);

    if(typeof(paymentMethod) != "string") return res.sendStatus(400);

    if(products == null) {
        await updateRedis();
        products = await redis.get('products');
    }

    if(products == null) return res.sendStatus(400);

    products = JSON.parse(products);
    
    for(let i = 0; i < products.length; i++) {
        validNames.push(products[i].name);
    }
    for(let i = 0; i < orderItems.length; i++) {
        const productName: string = orderItems[i].productName;
        const quantity: number = orderItems[i].quantity;
        const index: number = validNames.indexOf(productName);
        
        if(typeof(quantity) != "number" || quantity <= 0 || index == -1) return res.sendStatus(400);

        prices.push(products[index].price);
        totalPrice += products[index].price * quantity;
    }

    database(
        'INSERT INTO orders (state, delivery_date, user_id, total_price, payment_method) VALUES($1, $2, $3, $4, $5) RETURNING id;',
        ["não pago", new Date(deliveryDate).toISOString().split('T')[0], user_id, totalPrice, paymentMethod]
    ).then((data) => {
        for(let i = 0; i < orderItems.length; i++) {
            database('INSERT INTO order_items (order_id, product_name, quantity, unit_price) VALUES($1, $2, $3, $4)',
                [data.rows[0].id, orderItems[i].productName, orderItems[i].quantity, prices[i]]
            ).catch(err => {
                console.log(err);
                return res.sendStatus(500);
            });
        }

        if(paymentMethod != "dinheiro") {
            return database(`SELECT (name, email) FROM users WHERE id = ${user_id};`).then(async (user) => {
                const link = await pay(user_id, totalPrice/100, user.name, user.email, user_id);
                return res.send(link);
            })
        }

        res.sendStatus(201);
    }).catch(err => {
        console.log(err);
        res.sendStatus(500);
    });
});


interface DBres {
    rows: object[]
}

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
    const date: Date = new Date(dateString);
    const thisDate: Date = new Date();

    if(isNaN(date.getTime()) || date.getFullYear() != thisDate.getFullYear() || dateString.length < 10) return false
    if(date < thisDate) return false
    if(date.getDay() < 1) return false
    if(thisDate.getHours() <= 10 && date == thisDate) return false

    return true;
}

function getIdByToken(req: any): number {
    const token: string = req.headers['authorization'].split(" ")[1];
    var user: any = jwt.verify(token, jwtSecret);
    return user.id;
}

export default router;