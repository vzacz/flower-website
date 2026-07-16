# Alchemy Fruit Distribution - Database Schema

This document outlines the database schema that needs to be created in Supabase.

## Setup Instructions

1. Create a new Supabase project
2. Go to the SQL Editor
3. Execute the SQL scripts below to create all tables

---

## SQL Schema

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "customers_read" ON customers
  FOR SELECT USING (true);

-- Allow all authenticated users to create
CREATE POLICY "customers_create" ON customers
  FOR INSERT WITH CHECK (true);

-- Allow all authenticated users to update
CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (true);

-- Allow all authenticated users to delete
CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (true);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_create" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update" ON products
  FOR UPDATE USING (true);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read" ON orders
  FOR SELECT USING (true);

CREATE POLICY "orders_create" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (true);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_read" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "order_items_create" ON order_items
  FOR INSERT WITH CHECK (true);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_read" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "invoices_create" ON invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (true);
```

### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(50) NOT NULL,
  reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_read" ON payments
  FOR SELECT USING (true);

CREATE POLICY "payments_create" ON payments
  FOR INSERT WITH CHECK (true);
```

### Delivery Routes Table
```sql
CREATE TABLE delivery_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  distance DECIMAL(10, 2),
  estimated_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_routes_read" ON delivery_routes
  FOR SELECT USING (true);

CREATE POLICY "delivery_routes_create" ON delivery_routes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "delivery_routes_update" ON delivery_routes
  FOR UPDATE USING (true);
```

### Seed Initial Products
```sql
INSERT INTO products (name, sku, price, unit) VALUES
  ('Lulu Fruit', 'LULU-001', 8.50, 'kg'),
  ('Tomate del Árbol', 'TOMATE-001', 6.75, 'kg');
```

---

## Next Steps

1. Copy the SQL scripts above
2. Go to your Supabase project SQL Editor
3. Execute each script in order
4. Copy your Supabase URL and API keys to `.env.local`
5. Start building features!
