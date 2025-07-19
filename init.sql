CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    role INT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    name VARCHAR(30) PRIMARY KEY,
    price INT NOT NULL,
    kind VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    sugestion TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    state VARCHAR(20) NOT NULL,
    delivery_date DATE NOT NULL,
    user_id INT NOT NULL,
    total_price INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_name VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    unit_price INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO products (name, price, kind) VALUES
('coxinha', 250, 'salgado'),
('refrigerante', 500, 'bebida'),
('brigadeiro', 300, 'doce');