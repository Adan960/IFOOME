const pg = require('pg');

import conectar from '../../src/config/database';

// Mock do pg
jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn(() => mClient),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('conectar com o Postgress', () => {
  test('deve se conectar e executar query', async () => {
    const sql = 'SELECT 1';
    const params: any[] = [];
    const mockResult = { rows: [{ '?column?': 1 }] };

    const { Pool } = pg as any;
    const mPool = new Pool();
    const mClient = await mPool.connect();
    mClient.query.mockResolvedValueOnce(mockResult);

    const result = await conectar(sql, params);

    expect(mPool.connect).toHaveBeenCalled();
    expect(mClient.query).toHaveBeenCalledWith(sql, params);
    expect(mClient.release).toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  test('deve liberar client mesmo com erro', async () => {
    const sql = 'SQL inválido';
    const params: any[] = [];
    const fakeError = new Error('Erro de conexão');

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); // desliga console.log

    const { Pool } = pg as any;
    const mPool = new Pool();
    const mClient = await mPool.connect();
    mClient.query.mockRejectedValueOnce(fakeError);

    const result = await conectar(sql, params);

    expect(mPool.connect).toHaveBeenCalled();
    expect(mClient.query).toHaveBeenCalledWith(sql, params);
    expect(mClient.release).toHaveBeenCalled();
    expect(result).toEqual(fakeError);

    consoleSpy.mockRestore(); // restaura console.log depois
  });
});