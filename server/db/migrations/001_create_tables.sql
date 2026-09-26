-- Create users, products, orders, carts tables

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text,
  email text UNIQUE,
  password_hash text,
  role text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  data jsonb,
  price numeric,
  stock_quantity integer
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  user_id text,
  items jsonb,
  subtotal numeric,
  shipping numeric,
  tax numeric,
  total numeric,
  payment_status text,
  order_status text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS carts (
  id text PRIMARY KEY,
  user_id text,
  items jsonb
);
