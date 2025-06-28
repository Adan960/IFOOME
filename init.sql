-- Cria a tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(60) NOT NULL,
    role INT NOT NULL
);

-- Cria a tabela pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    preco INT NOT NULL,
    quantidade INT NOT NULL,
    nome VARCHAR(60) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    usuario INT NOT NULL,
    FOREIGN KEY (usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
