import database, { dbPool } from '../../src/config/database'; // Ajuste conforme seu export

// Esta função será executada uma única vez após todos os testes neste arquivo.
afterAll(async () => {
    if (dbPool) {
        await dbPool.end(); // Fechamento do pool de conexão
    }
});

test('deve retornar 1 pois não houve erro ao inserir', async () => {
    const result = await database(`INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);`, ["teste","1234",0]);
    expect(result.rowCount).toEqual(1);
})

test('deve retornar um erro de linhas duplicadas', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // desliga console.log

    const result = await database(`INSERT INTO usuarios(email, senha, role) VALUES($1, $2, $3);`, ["teste","1234",0]);
    
    consoleSpy.mockRestore(); // restaura console.log depois

    expect(result.code).toEqual("23505");
})

test('deve retornar 1 pois não houve erro ao deletar', async () => {
    const result = await database(`DELETE FROM usuarios WHERE email = 'teste';`);
    expect(result.rowCount).toEqual(1);
})