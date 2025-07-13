import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

let token: string;
let userId: number;
let role: number;

function fail(reason?: string) {
    throw new Error(reason);
}

beforeAll(async () => {
    await database('SELECT * FROM users WHERE email = $1;',[process.env.ADMIN_LOGIN]).then((data: any) => {
        userId = data.rows[0].id;
        role = data.rows[0].role;
        token = jwt.sign({id: userId, role: role}, jwtSecret);
    });
});

afterAll(async () => {
    await dbPool.end()
    await redis.quit();
});

describe("Visualizar avaliações", () => {
    test("Deve exibir todas as avaliações com sucesso",() => {
        return request.get("/backend/admin/review").set('Authorization', `Bearer ${token}`).then((res: any) => {
            database('SELECT * FROM reviews;').then((data) => {
                expect(res.statusCode).toEqual(200);
                expect(res.body).toEqual(data.rows);
            }).catch(err => {
                console.log(err);
                fail(err);
            })
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar um erro por não ter token",() => {
        return request.get("/backend/admin/review").then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar um erro pelo usuário não ter permissão de admin",() => {
        const wrongToken = jwt.sign({id: userId, role: 0}, jwtSecret);
        return request.get("/backend/admin/review").set('Authorization', `Bearer ${wrongToken}`).then((res: any) => {
            expect(res.statusCode).toEqual(401);
        }).catch((err: any) => {
            fail(err);
        })
    });
});

describe("Visualizar pedidos do dia", () => {
    test("Deve retornar todos os pedidos do dia com sucesso", () => {
        return request.get("/backend/admin/orders").set('Authorization', `Bearer ${token}`).then((res: any) => {
            const today =  new Date();
            today.setHours(0, 0, 0, 0);
            
            database('SELECT * FROM orders WHERE deliverydate = $1;',[today]).then((data) => {
                expect(res.statusCode).toEqual(200);
                expect(res.body.length).toEqual(data.rows.length);
            }).catch(err => {
                console.log(err);
                fail(err);
            });
        });
    });
});

describe("Adicionar produto no cardápio", () => {
    test("Deve adicionar um produto com sucesso",() => {
        return request.post("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "name": "produtoTeste",
            "price": 2.5,
            "kind": "testes"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar um erro pela requisição ser inválida",() => {
        return request.post("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "price": 2.5,
            "kind": "testes"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        })
    });
});

describe("Remover produto do cardápio", () => {
    test("Deve remover um produto com sucesso",() => {
        return request.delete("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "name": "produtoTeste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar um erro pela requisição ser inválida",() => {
        return request.delete("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({}).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        })
    });
});