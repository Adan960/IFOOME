import database, { dbPool } from '../../src/config/database';
import redis from '../../src/config/cache';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

const supertest = require('supertest');
const request = supertest(app);

const jwtSecret: string = process.env.JWT_SECRET || "";

let token: string;
let user_id: number;
let role: number;
let order_id: number;

function fail(reason?: string) {
    throw new Error(reason);
}

beforeAll(async () => {
    await database('SELECT * FROM users WHERE email = $1;',[process.env.ADMIN_LOGIN]).then((data: any) => {
        user_id = data.rows[0].id;
        role = data.rows[0].role;
        token = jwt.sign({id: user_id, role: role}, jwtSecret);
    });

    await database(
        `INSERT INTO orders (state, delivery_date, user_id, total_price, payment_method) VALUES($1, $2, $3, $4, $5) RETURNING id;`,
        ["pendente", new Date().toISOString().split('T')[0], user_id, 200, "dinheiro"]
    ).then((data: any) => {
        order_id = data.rows[0].id;
    });

    database(
        'INSERT INTO reviews(user_id, score, sugestion) VALUES($1, $2, $3);',
        [user_id ,4, "TESTE"]
    );
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
        const wrongToken = jwt.sign({id: user_id, role: 0}, jwtSecret);
        return request.get("/backend/admin/review").set('Authorization', `Bearer ${wrongToken}`).then((res: any) => {
            expect(res.statusCode).toEqual(401);
        }).catch((err: any) => {
            fail(err);
        })
    });
});

describe("Deletar avaliações", () => {
    test("Deve deletar a avaliação com sucesso", () => {
        database('SELECT * FROM reviews;').then((data) => {
            for(let i = 0; i < data.rows.length; i++) {
                if(data.rows[i].sugestion == "TESTE") {
                    request.delete("/backend/admin/review").set('Authorization', `Bearer ${token}`).send({
                        id: data.rows[i].id
                    }).then((res: any) => {
                        expect(res.statusCode).toEqual(200);
                    }).catch((err: any) => console.log(err))
                }
            }
        }).catch((err: any) => {
            console.log(err);
            fail(err);
        });
    })
});

describe("Visualizar pedidos do dia",() => {
    test("Deve retornar todos os pedidos do dia com sucesso",() => {
        return request.get("/backend/admin/orders").set('Authorization', `Bearer ${token}`).send({
            day: new Date()
        }).then(async (res: any) => {
            try{
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                const orders = await database(
                    `SELECT id, state, total_price, user_id, payment_method FROM orders WHERE delivery_date::date = $1::date;`,
                    [todayString]
                );

                const ordersWithItems = await Promise.all(
                    orders.rows.map(async (order: any, index: any) => {
                        const userName = await database(`SELECT name FROM users WHERE id = ${order.user_id}`);
                        const items = await database(`SELECT * FROM order_items WHERE order_id = ${order.id};`);
                        
                        return {
                            head: {
                                "pedido": index+1,
                                "user": userName.rows[0].name,
                                "state": order.state,
                                "total_price": order.total_price,
                                "payment_method": order.payment_method
                            },
                            body: items.rows
                        };
                    })
                );

                expect(res.statusCode).toEqual(200);
                expect(res.body[1]).toEqual(ordersWithItems[1]);
            } catch(err: any) {
                fail(err);
            }
        }).catch((err: any) => {
            fail(err);
        })
    })
});

describe("Atualizar status de pedidos",() => {
    test("Deve alterar o status do pedido com sucesso", () => {
        return request.put("/backend/admin/orders/state").set('Authorization', `Bearer ${token}`).send({
            "id": Number(order_id),
            "state": "concluido"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(200);
        }).catch((err: any) => {
            fail(err);
        });
    });

    test("Deve retornar erro pelo id não ser um número", () => {
        return request.put("/backend/admin/orders/state").set('Authorization', `Bearer ${token}`).send({
            "id": "10",
            "state": "concluido"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        });
    });

    test("Deve retornar erro por não ter state", () => {
        return request.put("/backend/admin/orders/state").set('Authorization', `Bearer ${token}`).send({
            "id": Number(order_id)
        }).then((res: any) => {
            expect(res.statusCode).toEqual(400);
        }).catch((err: any) => {
            fail(err);
        });
    })
});

describe("Adicionar produto no cardápio", () => {
    test("Deve adicionar um produto com sucesso",() => {
        return request.post("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "name": "produtoTeste",
            "price": 2.5,
            "kind": "testes"
        }).then((res: any) => {
            expect(res.statusCode).toEqual(201);
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

describe("Editar produto no cardápio", () => {
    test("Deve editar um produto no cardápio com sucesso",() => {
        return request.put("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "name": "produtoTeste",
            "price": 3,
            "kind": "testes",
            "newName": "produtoTeste"
        }).then(async (res: any) => {
            expect(res.statusCode).toEqual(200);
            request.get("/backend/menu").set('Authorization', `Bearer ${token}`).then((res: any) => {
                database('SELECT * FROM products;').then(data => {
                    expect(res.body).toEqual(data.rows);
                }).catch((err: any) => {
                    fail(err);
                })
            })
        }).catch((err: any) => {
            fail(err);
        })
    });

    test("Deve retornar erro 400 pela requisição ter elementos faltando",() => {
        return request.put("/backend/admin/menu").set('Authorization', `Bearer ${token}`).send({
            "name": "produtoTeste",
            "price": 3,
            "newName": "produtoTeste"
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

afterAll(async () => {
    await database(`DELETE FROM orders WHERE id = ${order_id};`);
    dbPool.end()
    redis.quit();
});