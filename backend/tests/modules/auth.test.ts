import database, { dbPool } from '../../src/config/database';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

function fail(reason?: string) {
  throw new Error(reason);
}

// Esta função será executada uma única vez antes de todos os testes neste arquivo.
beforeAll(async () => {
    await database(`DELETE FROM usuarios WHERE email = $1;`, ["teste1234@gmail.com"])
    await database(`DELETE FROM usuarios WHERE email = $1;`, ["teste1234"])
    await null; // cuido disso depois
});

afterAll(async () => {
    await database(`DELETE FROM usuarios WHERE email = $1;`, ["teste1234@gmail.com"])
    await database(`DELETE FROM usuarios WHERE email = $1;`, ["teste1234"])
    await null; // cuido disso depois
    if (dbPool) {
        await dbPool.end(); // Fechamento do pool de conexão
    }
});

describe("Cadastro de usuário", () => {
    test("Deve cadastrar um usuario com sucesso",() => {
        return request.post("/backend/createLogin").send({
            "email": "teste1234@gmail.com",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 400 pelo formato ser invalido",() => {
        return request.post("/backend/createLogin").send({
            "email": "teste1234",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 409 pelo email já existir",() => {
        return request.post("/backend/createLogin").send({
            "email": "teste1234@gmail.com",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(409);
        }).catch((err: string) => {
            fail(err);
        })
    });
});

describe("Login de usuário",() => {
    test("Deve logar com sucesso",() => {
        return request.post("/backend/login").send({
            "email": "teste1234@gmail.com",
            "senha": "1234"
        }).then((res: any) => {
            database(`SELECT * FROM usuarios WHERE email = $1;`, ["teste1234@gmail.com"]).then((data) => {
                jwt.verify(res.body.token, jwtSecret, function(err: any, decoded: any) {
                    expect(res.statusCode).toEqual(200);
                    expect(decoded.id).toEqual(data.rows[0].id);
                    expect(decoded.role).toEqual(data.rows[0].role);      
                });
            }).catch((err) => {
                fail(err)
            })
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 400 pelo formato ser invalido",() => {
        return request.post("/backend/login").send({
            "email": "teste1234",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 404 pelo login não ter sido encontrado",() => {
        return request.post("/backend/login").send({
            "email": "teste12s@gmail.com",
            "senha": "12345"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(404);
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 403 pela senha está errada",() => {
        return request.post("/backend/login").send({
            "email": "teste1234@gmail.com",
            "senha": "12345"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(403);
        }).catch((err: string) => {
            fail(err);
        })
    });
});