import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

function fail(reason?: string) {
    throw new Error(reason);
}

afterAll(async () => {
    await redis.quit();
    await null; // cuido disso depois
    if (dbPool) {
        await dbPool.end();
    }
});

describe("autenticação de usuário",() => {
    test("Deve logar com sucesso.",() => {
        const token = jwt.sign({id: 10, role: 0}, jwtSecret);
        return request.get("/backend/cardapio").set('Authorization', `Bearer ${token}`).then((res: any) => {
            database('SELECT * FROM produtos;').then(data => {
                expect(res.body).toEqual(data.rows);
                expect(res.statusCode).toEqual(200);
            }).catch((err) => {
                fail(err);
            })
        })
    });

    test("Deve retornar erro 401 pelo token está errado",() => {
        const token = jwt.sign({role: Date.now()}, jwtSecret);
        return request.get("/backend/cardapio").set('Authorization', `Bearer ${token}`).then((res: any) => {
            expect(res.statusCode).toEqual(401);
        })
    });

    test("Deve retornar erro 400 por não ter token",() => {
        return request.get("/backend/cardapio").then((res: any) => {
            expect(res.statusCode).toEqual(400);
        });
    });
})