import { dbPool } from '../../src/config/database';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

afterAll(async () => {
    await null; // cuido disso depois
    if (dbPool) {
        await dbPool.end(); // Fechamento do pool de conexão
    }
});

describe("autenticação de usuário",() => {
    test("Deve logar com sucesso.",() => {
        const token = jwt.sign({id: 10, role: 0}, jwtSecret);
        return request.get("/backend/").set('Authorization', `Bearer ${token}`).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        })
    });

    test("Deve logar com sucesso.",() => {
        const token = jwt.sign({role: Date.now()}, jwtSecret);
        return request.get("/backend/").set('Authorization', `Bearer ${token}`).then((res: any) => {
            expect(res.statusCode).toEqual(401);
        })
    });

    test("Deve retornar erro 400 por não ter token",() => {
        return request.get("/backend/").then((res: any) => {
            expect(res.statusCode).toEqual(400);
        });
    });
})