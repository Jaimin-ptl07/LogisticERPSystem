export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface KPICard {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

export interface Order {
  id: string;
  customer: string;
  status: 'pending' | 'loading' | 'on-route' | 'completed';
  total: number;
  date: string;
  items: number;
}

export interface Trip {
  id: string;
  status: 'planning' | 'loading' | 'on-route' | 'completed' | 'cancelled';
  branch: string;
  truck: {
    plate: string;
    model: string;
  };
  driver: {
    name: string;
    phone: string;
  };
  orders: number;
  date: string;
}

export interface Delivery {
  id: string;
  customer: string;
  orderIds: string[];
  status: 'completed' | 'on-route';
  date: string;
  address: string;
}

export interface Activity {
  id: string;
  type: 'order' | 'trip' | 'delivery';
  action: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  location: string;
  homeBranch: string;
  businessType: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  recordId: string;
  details?: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  status: 'active' | 'inactive';
}

export interface Truck {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  driver?: string;
  status: 'available' | 'on-duty' | 'maintenance';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  experience: string;
  status: 'active' | 'inactive';
  currentTruck?: string;
}