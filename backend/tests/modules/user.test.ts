import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

let token: string;
let user_id: number;

function fail(reason?: string) {
    throw new Error(reason);
}

beforeAll(async () => {
    const passwordHash: string = await bcrypt.hash("12345", 12);
    const email: string = "teste12345@gmail.com";

    await database(`DELETE FROM orders WHERE user_id = $1;`, [user_id]);
    await database(`DELETE FROM users WHERE email = $1;`, [email]);
    await database('INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING id;',
        ["teste", email, passwordHash, 0])
    .then(data => {
        user_id = data.rows[0].id;
        token = jwt.sign({id: user_id, role: 0}, jwtSecret);
    })
})

describe("cardápio de usuáio",() => {
    test("Deve logar com sucesso.",() => {
        return request.get("/backend/menu").set('Authorization', `Bearer ${token}`).then((res: any) => {
            database('SELECT * FROM products;').then(data => {
                expect(res.body).toEqual(data.rows);
                expect(res.statusCode).toEqual(200);
            }).catch((err: any) => {
                fail(err);
            })
        })
    });

    test("Deve retornar erro 401 pelo token está errado",() => {
        const wrongToken = jwt.sign({role: Date.now()}, jwtSecret);
        return request.get("/backend/menu").set('Authorization', `Bearer ${wrongToken}`).then((res: any) => {
            expect(res.statusCode).toEqual(401);
        })
    });

    test("Deve retornar erro 400 por não ter token",() => {
        return request.get("/backend/menu").then((res: any) => {
            expect(res.statusCode).toEqual(400);
        });
    });
})

describe("Fazer um pedido",() => {
    const today =  new Date();
    today.setHours(0, 0, 0, 0);
    
    test("Deve fazer um pedido com sucesso",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
        "deliveryDate": today,
        "paymentMethod": "dinheiro",
        "orderItems": [
            {
                "productName": "brigadeiro",
                "quantity": 1
            },
            {
                "productName": "refrigerante",
                "quantity": 2
            },
            {
                "productName": "coxinha",
                "quantity": 2
            }
        ]
    }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar um erro pelo nome do produto estar errado",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
            "deliveryDate": today,
            "paymentMethod": "dinheiro",
            "orderItems": [
                {
                    "productName": "teste023",
                    "quantity": 1
                },
                {
                    "productName": "refrigerante",
                    "quantity": 2
                },
                {
                    "productName": "coxinha",
                    "quantity": 2
                }
            ]
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        });
    });

    test("Deve retornar um erro pela data ser inválida",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
        "deliveryDate": "2025",
        "paymentMethod": "dinheiro",
        "orderItems": [
            {
                "productName": "brigadeiro",
                "quantity": 1
            },
            {
                "productName": "refrigerante",
                "quantity": 2
            },
            {
                "productName": "coxinha",
                "quantity": 2
            }
        ]
    }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        });
    });
})


describe("receber lista de pedidos usuário",() => {
    test("Deve receber com sucesso os pedidos do usuário",() => {
        return request.get("/backend/orders").set('Authorization', `Bearer ${token}`).then(async (res: any) => {
            try {
                const head = await database(`SELECT * FROM orders WHERE user_id = ${user_id};`);
        
                const promises = head.rows.map(async (row: any, i: number) => {
                    const body = await database(`SELECT * FROM order_items WHERE order_id = ${row.id};`);
                    return {
                        pedido: i + 1,
                        head: row,
                        body: body.rows
                    };
                });

                const dbRes: any[] = await Promise.all(promises);

                for(let i = 0; i < dbRes.length; i++){
                    dbRes[i].head.delivery_date = null;
                    res.body[i].head.delivery_date = null; 
                }
        
                expect(res.statusCode).toEqual(200);
                expect(res.body).toEqual(dbRes);
            } catch (err: any) {
                fail(err);
            }
        }).catch((err: any) => {
            fail(err);
        })
    })
})

describe("avaliação de usuário",() => {
    test("Deve enviar uma avaliação com sucesso",() => {
        return request.post("/backend/review").set('Authorization', `Bearer ${token}`).send({
            "score": 5,
            "sugestion": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: any) => {
            fail(err);
        })
    })

    test("Deve enviar uma avaliação e receber erro 400 por não ter nota",() => {
        return request.post("/backend/review").set('Authorization', `Bearer ${token}`).send({
            "sugestion": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        })
    })
})


afterAll(async () => {
    await database(`DELETE FROM reviews WHERE sugestion = $1;`, ["teste"]);
    await database(`DELETE FROM orders WHERE user_id = $1;`, [user_id]);
    await database(`DELETE FROM users WHERE email = $1;`, ["teste12345@gmail.com"]);
    dbPool.end()
    redis.quit();
});