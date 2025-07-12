CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    role INT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    price INT NOT NULL,
    amount INT NOT NULL,
    name VARCHAR(60) NOT NULL,
    kind VARCHAR(60) NOT NULL,
    state VARCHAR(20) NOT NULL,
    deliveryDate DATE NOT NULL,
    userId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    name VARCHAR(60) PRIMARY KEY,
    price INT NOT NULL,
    kind VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    userId INT NOT NULL,
    score INT NOT NULL,
    sugestion TEXT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO products (name, price, kind) VALUES('coxinha', 250, 'salgado');