import connect from './../src/config/database';

// Mock do módulo 'pg' para simular a conexão
jest.mock('pg', () => {
  const mockClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mockClient) };
});

describe('connect', () => {
  let mockClient: any;

  beforeEach(() => {
    // Configura o mock do Client
    mockClient = new (require('pg').Client)();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve conectar ao PostgreSQL e executar uma query', async () => {
    // Configura o mock para simular uma query bem-sucedida
    mockClient.query.mockResolvedValueOnce({ rows: [{ message: 'Hello world!' }] });

    await connect();

    // Verifica se o client.connect foi chamado
    expect(mockClient.connect).toHaveBeenCalledTimes(1);

    // Verifica se a query foi chamada com os parâmetros corretos
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT $1::text as message',
      ['Hello world!']
    );

    // Verifica se o client.end foi chamado
    expect(mockClient.end).toHaveBeenCalledTimes(1);
  });

  test('deve lidar com erros na query', async () => {
    // Configura o mock para simular um erro
    const mockError = new Error('Erro na query');
    mockClient.query.mockRejectedValueOnce(mockError);

    // Espiona o console.error para verificar a mensagem de erro
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await connect();

    // Verifica se o erro foi logado
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // Restaura o console.error
    consoleSpy.mockRestore();
  });
});