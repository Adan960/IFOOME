import database, { dbPool } from '../../src/config/database';
import app from '../../src/app';

const supertest = require('supertest');
const request = supertest(app);

function fail(reason?: string) {
  throw new Error(reason);
}

// Esta função será executada uma única vez após todos os testes neste arquivo.
afterAll(async () => {
    await database(`DELETE FROM usuarios WHERE email = $1;`, ["teste1234"])
    await null; // cuido disso depois
    if (dbPool) {
        await dbPool.end(); // Fechamento do pool de conexão
    }
});

describe("Cadastro de usuário", () => {
    test("Deve cadastrar um usuario com sucesso",() => {
        return request.post("/backend/criarLogin").send({
            "email": "teste1234",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
        }).catch((err: string) => {
            fail(err);
        })
    });

    test("Deve retornar o erro 409 pelo email já existir",() => {
        try{
            database(`INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);`, ["teste1234","1234",0]);
        } catch (err: any){
            console.log(err);
            fail();
        }
        return request.post("/backend/criarLogin").send({
            "email": "teste1234",
            "senha": "1234"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(409);
        }).catch((err: string) => {
            fail(err);
        })
    });
});