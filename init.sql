CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(60) NOT NULL,
    role INT NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    preco INT NOT NULL,
    quantidade INT NOT NULL,
    nome VARCHAR(60) NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    dataEntrega DATE NOT NULL,
    usuario INT NOT NULL,
    FOREIGN KEY (usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS produtos (
    nome VARCHAR(60) PRIMARY KEY,
    preco INT NOT NULL,
    tipo VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    usuario INT NOT NULL,
    nota INT NOT NULL,
    sugestao TEXT NULL,
    FOREIGN KEY (usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
