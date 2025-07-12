import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

let token: string;
let userId: number;

function fail(reason?: string) {
    throw new Error(reason);
}

beforeAll(async () => {
    const passwordHash: string = await bcrypt.hash("12345", 12);
    const email: string = "teste12345@gmail.com";

    await database(`DELETE FROM users WHERE email = $1;`, [email]);
    await database('INSERT INTO users(email, password, role) VALUES($1, $2, $3);',[email, passwordHash, 0])
    await database('SELECT * FROM users WHERE email = $1;',[email]).then((data: any) => {
        userId = data.rows[0].id;
        token = jwt.sign({id: userId, role: 0}, jwtSecret);
    });
})

afterAll(async () => {
    await database(`DELETE FROM orders WHERE kind = $1;`, ["teste"]);
    await database(`DELETE FROM reviews WHERE sugestion = $1;`, ["teste"]);
    await database(`DELETE FROM users WHERE email = $1;`, ["teste12345@gmail.com"]);
    await dbPool.end()
    await redis.quit();
});

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

describe("receber lista de orders usuário",() => {
    test("Deve receber com sucesso os pedidos do usuário",() => {
        return request.get("/backend/orders").set('Authorization', `Bearer ${token}`).then((res: any) => {
            database('SELECT * FROM orders WHERE userId = $1;', [userId]).then((data) => {
                expect(res.statusCode).toEqual(200);
                expect(res.body).toEqual(data.rows);
            }).catch(err => {
                console.log(err);
                fail(err);
            })
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })
})

describe("Fazer um pedido",() => {
    test("Deve fazer um pedido com sucesso",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
            "price": 2.5,
            "amount": 3,
            "name": "teste",
            "kind": "teste",
            "state": "pendente",
            "deliveryDate": "2025-07-07"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })

    test("Deve retornar erro 400 pela requisição está errada",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
            "price": 2.5,
            "amount": "3",
            "name": "teste",
            "kind": "teste",
            "state": "pendente",
            "deliveryDate": "2025-07-07"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })

    test("Deve retornar erro 400 pela requisição ter um valor faltando",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
            "price": 2.5,
            "amount": 3,
            "name": "teste",
            "state": "pendente",
            "deliveryDate": "2025-07-07"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })

    test("Deve retornar erro 400 pela data ser inválida",() => {
        return request.post("/backend/orders").set('Authorization', `Bearer ${token}`).send({
            "price": 2.5,
            "amount": 3,
            "name": "teste",
            "kind": "teste",
            "state": "pendente",
            "deliveryDate": "2025-13-07"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })
})

describe("avaliação de usuário",() => {
    test("Deve enviar uma avaliação com sucesso",() => {
        return request.post("/backend/assessment").set('Authorization', `Bearer ${token}`).send({
            "score": 5,
            "sugestion": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })

    test("Deve enviar uma avaliação e receber erro 400 por não ter nota",() => {
        return request.post("/backend/assessment").set('Authorization', `Bearer ${token}`).send({
            "sugestion": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })
})