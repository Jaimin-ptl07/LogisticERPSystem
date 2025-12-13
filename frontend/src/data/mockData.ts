import {
  Order,
  Trip,
  Delivery,
  Activity,
  Customer,
  AuditLog,
  Branch,
  Product,
  Truck,
  Driver,
  KPICard
} from '@/types';

export const mockKPIs: KPICard[] = [
  { title: 'Available Trucks', value: 12, color: 'green' },
  { title: 'Overdue Customers', value: 5, subtitle: '3 days+', color: 'red' },
  { title: 'Today Deliveries', value: 24, subtitle: '18 completed', color: 'blue' },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: 'John\'s Farm',
    status: 'completed',
    total: 2500,
    date: '2024-01-10',
    items: 15,
  },
  {
    id: 'ORD-002',
    customer: 'Green Valley Store',
    status: 'on-route',
    total: 1800,
    date: '2024-01-10',
    items: 8,
  },
  {
    id: 'ORD-003',
    customer: 'City Mart',
    status: 'loading',
    total: 3200,
    date: '2024-01-11',
    items: 22,
  },
];

export const mockTrips: Trip[] = [
  {
    id: 'TRIP-001',
    status: 'on-route',
    branch: 'North Branch',
    truck: {
      plate: 'ABC-1234',
      model: 'Ford Transit',
    },
    driver: {
      name: 'Mike Johnson',
      phone: '+201234567890',
    },
    orders: 5,
    date: '2024-01-10',
  },
  {
    id: 'TRIP-002',
    status: 'planning',
    branch: 'South Branch',
    truck: {
      plate: 'XYZ-5678',
      model: 'Mercedes Sprinter',
    },
    driver: {
      name: 'Sarah Ahmed',
      phone: '+201112223333',
    },
    orders: 8,
    date: '2024-01-11',
  },
  {
    id: 'TRIP-003',
    status: 'completed',
    branch: 'East Branch',
    truck: {
      plate: 'DEF-9012',
      model: 'Iveco Daily',
    },
    driver: {
      name: 'Ali Hassan',
      phone: '+201445556666',
    },
    orders: 12,
    date: '2024-01-09',
  },
];

export const mockDeliveries: Delivery[] = [
  {
    id: 'DEL-001',
    customer: 'John\'s Farm',
    orderIds: ['ORD-001'],
    status: 'completed',
    date: '2024-01-10 14:30',
    address: '123 Farm Road, Rural Area',
  },
  {
    id: 'DEL-002',
    customer: 'Green Valley Store',
    orderIds: ['ORD-002'],
    status: 'on-route',
    date: '2024-01-10 16:00',
    address: '456 Market St, City Center',
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'ACT-001',
    type: 'order',
    action: 'Order Created',
    description: 'Order ORD-003 created for City Mart',
    timestamp: '2024-01-11 09:00',
    user: 'Admin User',
  },
  {
    id: 'ACT-002',
    type: 'trip',
    action: 'Trip Started',
    description: 'Trip TRIP-001 started from North Branch',
    timestamp: '2024-01-10 08:00',
    user: 'Mike Johnson',
  },
  {
    id: 'ACT-003',
    type: 'delivery',
    action: 'Delivery Completed',
    description: 'Delivery DEL-001 completed at John\'s Farm',
    timestamp: '2024-01-10 14:30',
    user: 'Mike Johnson',
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    code: 'CUST001',
    name: 'John\'s Farm',
    phone: '+201000000001',
    location: 'Cairo, Egypt',
    homeBranch: 'North Branch',
    businessType: 'Agriculture',
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'CUST-002',
    code: 'CUST002',
    name: 'Green Valley Store',
    phone: '+201000000002',
    location: 'Giza, Egypt',
    homeBranch: 'South Branch',
    businessType: 'Retail',
    status: 'active',
    createdAt: '2024-01-02',
  },
  {
    id: 'CUST-003',
    code: 'CUST003',
    name: 'City Mart',
    phone: '+201000000003',
    location: 'Alexandria, Egypt',
    homeBranch: 'East Branch',
    businessType: 'Retail',
    status: 'inactive',
    createdAt: '2024-01-03',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2024-01-11 10:30:00',
    user: 'Salah (Admin)',
    action: 'CREATE',
    module: 'Orders',
    recordId: 'ORD-003',
    details: 'Created new order for City Mart',
  },
  {
    id: 'LOG-002',
    timestamp: '2024-01-11 10:25:00',
    user: 'Salah (Admin)',
    action: 'UPDATE',
    module: 'Customers',
    recordId: 'CUST-001',
    details: 'Updated customer phone number',
  },
  {
    id: 'LOG-003',
    timestamp: '2024-01-11 10:20:00',
    user: 'Salah (Admin)',
    action: 'LOGIN',
    module: 'Authentication',
    recordId: 'N/A',
    details: 'User logged in successfully',
  },
];

export const mockBranches: Branch[] = [
  {
    id: 'BR-001',
    code: 'NB001',
    name: 'North Branch',
    location: 'Cairo, Egypt',
    manager: 'Ahmed Ali',
    phone: '+201000000010',
    status: 'active',
  },
  {
    id: 'BR-002',
    code: 'SB001',
    name: 'South Branch',
    location: 'Giza, Egypt',
    manager: 'Mohamed Hassan',
    phone: '+201000000011',
    status: 'active',
  },
];

export const mockProducts: Product[] = [
  {
    id: 'PROD-001',
    code: 'FEED001',
    name: 'Animal Feed Premium',
    category: 'Feed',
    unit: 'kg',
    price: 15.5,
    status: 'active',
  },
  {
    id: 'PROD-002',
    code: 'MED001',
    name: 'Vitamin Supplement',
    category: 'Medicine',
    unit: 'bottle',
    price: 120.0,
    status: 'active',
  },
];

export const mockTrucks: Truck[] = [
  {
    id: 'TRK-001',
    plate: 'ABC-1234',
    model: 'Ford Transit',
    capacity: 2000,
    driver: 'Mike Johnson',
    status: 'on-duty',
  },
  {
    id: 'TRK-002',
    plate: 'XYZ-5678',
    model: 'Mercedes Sprinter',
    capacity: 3000,
    status: 'available',
  },
];

export const mockDrivers: Driver[] = [
  {
    id: 'DRV-001',
    name: 'Mike Johnson',
    phone: '+201234567890',
    license: 'DL-001234',
    experience: '5 years',
    status: 'active',
    currentTruck: 'ABC-1234',
  },
  {
    id: 'DRV-002',
    name: 'Sarah Ahmed',
    phone: '+201112223333',
    license: 'DL-002345',
    experience: '3 years',
    status: 'active',
  },
];