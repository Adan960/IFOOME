import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

let token: string;

function fail(reason?: string) {
    throw new Error(reason);
}

beforeAll(async () => {
    await request.post("/backend/criarLogin").send({
        "email": "teste1234@gmail.com",
        "senha": "1234"
    }).then(async () => {
        await request.post("/backend/login").send({
            "email": "teste1234@gmail.com",
            "senha": "1234"
        }).then((res: any) => {
            token = res.text;
        }).catch((err: string) => {
            console.log(err);
        })
    }).catch((err: string) => {
        console.log(err);
    })
})

afterAll(async () => {
    await database(`DELETE FROM avaliacoes WHERE sugestao = $1;`, ["teste"]);
    await redis.quit();
    if (dbPool) {
        await dbPool.end();
    }
});

describe("cardápio de usuáio",() => {
    test("Deve logar com sucesso.",() => {
        return request.get("/backend/cardapio").set('Authorization', `Bearer ${token}`).then((res: any) => {
            database('SELECT * FROM produtos;').then(data => {
                expect(res.body).toEqual(data.rows);
                expect(res.statusCode).toEqual(200);
            }).catch((err: any) => {
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


describe("avaliação do usuário",() => {
    test("Deve enviar uma avaliação com sucesso",() => {
        return request.post("/backend/avaliacao").set('Authorization', `Bearer ${token}`).send({
            "nota": 5,
            "sugestao": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })

    test("Deve enviar uma avaliação e receber erro 400 por não ter nota",() => {
        return request.post("/backend/avaliacao").set('Authorization', `Bearer ${token}`).send({
            "sugestao": "teste"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        })
    })
})