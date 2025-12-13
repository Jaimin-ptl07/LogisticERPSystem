# Logistics ERP Database Schema Design

## Core Tables

### 1. Companies (Tenants)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Branches
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Customers
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    gstin VARCHAR(50),
    pan VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'NET30',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Vehicles (Trucks)
```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL, -- e.g., 'Truck', 'Tempo', 'Container'
    capacity_weight DECIMAL(10,2), -- in KG
    capacity_volume DECIMAL(10,2), -- in cubic meters
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    insurance_validity DATE,
    fitness_certificate_validity DATE,
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),
    driver_license VARCHAR(50),
    gps_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Sales Orders
```sql
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    order_type VARCHAR(20) NOT NULL, -- 'PICKUP', 'DELIVERY', 'BOTH'
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'

    -- Pickup Details
    pickup_address TEXT,
    pickup_contact VARCHAR(255),
    pickup_phone VARCHAR(50),
    pickup_time_start TIMESTAMP WITH TIME ZONE,
    pickup_time_end TIMESTAMP WITH TIME ZONE,

    -- Delivery Details
    delivery_address TEXT,
    delivery_contact VARCHAR(255),
    delivery_phone VARCHAR(50),
    delivery_time_start TIMESTAMP WITH TIME ZONE,
    delivery_time_end TIMESTAMP WITH TIME ZONE,

    -- Order Items
    description TEXT,
    quantity INTEGER DEFAULT 1,
    weight DECIMAL(10,2), -- in KG
    volume DECIMAL(10,2), -- in cubic meters
    value DECIMAL(12,2),

    -- Pricing
    base_amount DECIMAL(12,2),
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2),

    -- Status
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, REJECTED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
    finance_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    logistics_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ASSIGNED, IN_TRANSIT, COMPLETED

    -- Payment
    payment_type VARCHAR(20) DEFAULT 'COD', -- COD, PREPAID, CREDIT
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, OVERDUE

    -- Additional
    special_instructions TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Trip Plans
```sql
CREATE TABLE trip_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    trip_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(50),

    -- Schedule
    planned_start_date DATE NOT NULL,
    planned_end_date DATE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,

    -- Details
    origin_address TEXT NOT NULL,
    destination_address TEXT,
    total_distance DECIMAL(10,2), -- in KM
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes

    -- Status
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED
    priority VARCHAR(20) DEFAULT 'MEDIUM',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Trip Orders (Many-to-Many)
```sql
CREATE TABLE trip_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_plan_id UUID NOT NULL REFERENCES trip_plans(id),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id),
    sequence_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    pod_photo_url VARCHAR(500),
    pod_signature_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(trip_plan_id, sales_order_id)
);
```

### 8. Documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    entity_type VARCHAR(50) NOT NULL, -- 'SALES_ORDER', 'TRIP_PLAN', 'CUSTOMER', 'VEHICLE'
    entity_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'INVOICE', 'PACKING_LIST', 'POD', 'AGREEMENT'
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. Notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR'
    category VARCHAR(50), -- 'ORDER', 'TRIP', 'PAYMENT', 'SYSTEM'
    entity_type VARCHAR(50), -- 'SALES_ORDER', 'TRIP_PLAN'
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 10. Price Rules
```sql
CREATE TABLE price_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'WEIGHT', 'DISTANCE', 'VOLUME', 'FIXED'
    from_value DECIMAL(10,2),
    to_value DECIMAL(10,2),
    price_per_unit DECIMAL(12,2),
    base_price DECIMAL(12,2),
    service_type VARCHAR(50), -- 'PICKUP', 'DELIVERY', 'TRANSPORT'
    vehicle_type VARCHAR(50),
    zone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11. Service Zones
```sql
CREATE TABLE service_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'PICKUP', 'DELIVERY', 'BOTH'
    polygon JSONB, -- GeoJSON polygon
    base_price DECIMAL(12,2),
    additional_distance_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 12. Dashboard KPIs (Materialized View)
```sql
CREATE MATERIALIZED VIEW dashboard_kpis AS
SELECT
    c.id as company_id,
    COUNT(DISTINCT CASE WHEN so.created_at >= CURRENT_DATE THEN so.id END) as orders_today,
    COUNT(DISTINCT CASE WHEN so.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN so.id END) as orders_week,
    COUNT(DISTINCT CASE WHEN so.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN so.id END) as orders_month,
    COUNT(DISTINCT CASE WHEN so.status = 'APPROVED' AND so.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN so.id END) as approved_week,
    COUNT(DISTINCT CASE WHEN so.status = 'REJECTED' AND so.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN so.id END) as rejected_week,
    COUNT(DISTINCT CASE WHEN tp.status = 'COMPLETED' AND tp.actual_end_time >= CURRENT_DATE - INTERVAL '7 days' THEN tp.id END) as trips_completed_week,
    COUNT(DISTINCT CASE WHEN tp.status = 'PLANNED' THEN tp.id END) as trips_pending,
    COUNT(DISTINCT v.id) FILTER (WHERE v.is_active = true) as active_vehicles,
    COUNT(DISTINCT v.id) FILTER (WHERE v.is_active = true AND EXISTS(SELECT 1 FROM trip_plans tp2 WHERE tp2.vehicle_id = v.id AND tp2.status = 'IN_PROGRESS')) as vehicles_on_road
FROM companies c
LEFT JOIN sales_orders so ON c.id = so.company_id
LEFT JOIN trip_plans tp ON c.id = tp.company_id
LEFT JOIN vehicles v ON c.id = v.company_id
GROUP BY c.id;
```

## Role-Based Access Control (Extending Auth Service)

### Role Permissions Mapping
```sql
-- Super Admin Permissions
INSERT INTO permissions (name, resource, action) VALUES
('create_company', 'company', 'create'),
('manage_companies', 'company', 'manage'),
('view_all_companies', 'company', 'read'),

-- Company Admin Permissions
INSERT INTO permissions (name, resource, action) VALUES
('manage_branches', 'branch', 'manage'),
('manage_users', 'user', 'manage'),
('manage_customers', 'customer', 'manage'),
('configure_pricing', 'pricing', 'manage'),
('view_reports', 'reports', 'read'),

-- Branch Manager Permissions
INSERT INTO permissions (name, resource, action) VALUES
('create_sales_order', 'sales_order', 'create'),
('edit_sales_order', 'sales_order', 'update'),
('view_branch_orders', 'sales_order', 'read'),
('assign_orders', 'sales_order', 'assign'),

-- Finance Manager Permissions
INSERT INTO permissions (name, resource, action) VALUES
('approve_orders', 'sales_order', 'approve'),
('reject_orders', 'sales_order', 'reject'),
('view_pricing', 'pricing', 'read'),
('manage_payments', 'payment', 'manage'),

-- Logistics Manager Permissions
INSERT INTO permissions (name, resource, action) VALUES
('create_trip_plan', 'trip_plan', 'create'),
('assign_vehicles', 'trip_plan', 'assign'),
('manage_drivers', 'driver', 'manage'),
('view_tracking', 'trip_plan', 'track'),

-- Driver Permissions
INSERT INTO permissions (name, resource, action) VALUES
('view_assigned_trips', 'trip_plan', 'read'),
('update_trip_status', 'trip_plan', 'update'),
('upload_pod', 'document', 'create'),
('view_route', 'trip_plan', 'read');
```

## Indexes for Performance

```sql
-- Sales Order Indexes
CREATE INDEX idx_sales_orders_company_date ON sales_orders(company_id, order_date DESC);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_branch ON sales_orders(branch_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_finance_status ON sales_orders(finance_status) WHERE finance_status = 'PENDING';

-- Trip Plan Indexes
CREATE INDEX idx_trip_plans_company_date ON trip_plans(company_id, planned_start_date DESC);
CREATE INDEX idx_trip_plans_vehicle ON trip_plans(vehicle_id);
CREATE INDEX idx_trip_plans_status ON trip_plans(status);
CREATE INDEX idx_trip_plans_active ON trip_plans(status) WHERE status IN ('PLANNED', 'PUBLISHED', 'IN_PROGRESS');

-- Customer Indexes
CREATE INDEX idx_customers_company_active ON customers(company_id, is_active);
CREATE INDEX idx_customers_code ON customers(customer_code);

-- Notification Indexes
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_company ON notifications(company_id, created_at DESC);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Company-level policies
CREATE POLICY company_isolation ON companies
    FOR ALL TO authenticated_users
    USING (id = current_setting('app.current_company_id')::UUID);

-- Super Admin can see all
CREATE POLICY super_admin_full_access ON companies
    FOR ALL TO authenticated_users
    USING (EXISTS(
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = current_user_id()
        AND p.name = 'manage_companies'
    ));
```