CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    tracking_code VARCHAR(20) UNIQUE NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20),
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20),
    receiver_address TEXT NOT NULL,
    description TEXT,
    weight_kg DECIMAL(10,2),
    status VARCHAR(30) DEFAULT 'recibido',
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipment_history (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    updated_by VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    customer_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'abierta',
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data for testing
INSERT INTO shipments (tracking_code, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, description, weight_kg, status, created_by)
VALUES
    ('RDD-2026-00001', 'Carlos Mendez', '555-0101', 'Ana Lopez', '555-0201', 'Av. Principal 123, Ciudad', 'Paquete fragil - electronica', 2.50, 'en_camino', 'mgarcia'),
    ('RDD-2026-00002', 'Roberto Diaz', '555-0102', 'Sofia Torres', '555-0202', 'Calle Secundaria 456, Ciudad', 'Documentos importantes', 0.30, 'recibido', 'mgarcia'),
    ('RDD-2026-00003', 'Elena Vargas', '555-0103', 'Pedro Ruiz', '555-0203', 'Blvd. Norte 789, Ciudad', 'Ropa y accesorios', 5.00, 'entregado', 'mgarcia');

INSERT INTO shipment_history (shipment_id, status, notes, updated_by) VALUES
    (1, 'recibido', 'Paquete recibido en mostrador', 'mgarcia'),
    (1, 'en_despacho', 'Enviado a despacho para preparacion', 'jperez'),
    (1, 'en_camino', 'Paquete en ruta de entrega', 'jperez'),
    (2, 'recibido', 'Documentos recibidos en mostrador', 'mgarcia'),
    (3, 'recibido', 'Paquete recibido', 'mgarcia'),
    (3, 'en_despacho', 'En preparacion', 'jperez'),
    (3, 'en_camino', 'En ruta', 'jperez'),
    (3, 'entregado', 'Entregado exitosamente', 'jperez');
