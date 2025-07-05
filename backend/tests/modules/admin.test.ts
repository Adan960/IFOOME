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

beforeAll(async () => {
    await database(`DELETE FROM produtos WHERE tipo = $1;`, ["testes"]);
    await null; // cuido disso depois
});

afterAll(async () => {
    await redis.quit();
    await null; // cuido disso depois
    if (dbPool) {
        await dbPool.end();
    }
});

describe("Produto no cardápio", () => {
    test("Deve adicionar um produto com sucesso",() => {
        return request.post("/backend/admin/cardapio").send({
            "nome": "produtoTeste",
            "preco": 2.5,
            "tipo": "testes"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve remover um produto com sucesso",() => {
        return request.delete("/backend/admin/cardapio").send({
            "nome": "produtoTeste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            fail(err);
        })
    });
});