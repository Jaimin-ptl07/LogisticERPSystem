// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Company related types
export interface Company extends BaseEntity {
  name: string;
  code: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  settings: Record<string, any>;
}

// Branch related types
export interface Branch extends BaseEntity {
  companyId: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  isActive: boolean;
}

// Customer related types
export interface Customer extends BaseEntity {
  companyId: string;
  customerCode: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  creditLimit: number;
  paymentTerms: string;
  isActive: boolean;
}

// Vehicle related types
export interface Vehicle extends BaseEntity {
  companyId: string;
  vehicleNumber: string;
  vehicleType: string;
  capacityWeight?: number; // in KG
  capacityVolume?: number; // in cubic meters
  make?: string;
  model?: string;
  year?: number;
  insuranceValidity?: string;
  fitnessCertificateValidity?: string;
  driverName?: string;
  driverPhone?: string;
  driverLicense?: string;
  gpsEnabled: boolean;
  isActive: boolean;
}

// Sales Order related types
export interface SalesOrder extends BaseEntity {
  companyId: string;
  branchId: string;
  customerId: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate?: string;
  orderType: 'PICKUP' | 'DELIVERY' | 'BOTH';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  // Pickup Details
  pickupAddress?: string;
  pickupContact?: string;
  pickupPhone?: string;
  pickupTimeStart?: string;
  pickupTimeEnd?: string;

  // Delivery Details
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  deliveryTimeStart?: string;
  deliveryTimeEnd?: string;

  // Order Items
  description?: string;
  quantity: number;
  weight?: number; // in KG
  volume?: number; // in cubic meters
  value?: number;

  // Pricing
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;

  // Status
  status: OrderStatus;
  financeStatus: FinanceStatus;
  logisticsStatus: LogisticsStatus;

  // Payment
  paymentType: 'COD' | 'PREPAID' | 'CREDIT';
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE';

  // Additional
  specialInstructions?: string;
  internalNotes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum FinanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LogisticsStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED'
}

// Trip related types
export interface TripPlan extends BaseEntity {
  companyId: string;
  tripNumber: string;
  vehicleId: string;
  driverName?: string;
  driverPhone?: string;

  // Schedule
  plannedStartDate: string;
  plannedEndDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;

  // Details
  originAddress: string;
  destinationAddress?: string;
  totalDistance?: number; // in KM
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes

  // Status
  status: TripStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  createdBy: string;
}

export enum TripStatus {
  PLANNED = 'PLANNED',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Trip Order mapping
export interface TripOrder extends BaseEntity {
  tripPlanId: string;
  salesOrderId: string;
  sequenceNumber: number;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  pickupTime?: string;
  deliveryTime?: string;
  failureReason?: string;
  podPhotoUrl?: string;
  podSignatureUrl?: string;
}

// Document types
export interface Document extends BaseEntity {
  companyId: string;
  entityType: 'SALES_ORDER' | 'TRIP_PLAN' | 'CUSTOMER' | 'VEHICLE';
  entityId: string;
  documentType: 'INVOICE' | 'PACKING_LIST' | 'POD' | 'AGREEMENT';
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
}

// Notification types
export interface Notification extends BaseEntity {
  userId?: string;
  companyId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category?: 'ORDER' | 'TRIP' | 'PAYMENT' | 'SYSTEM';
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  actionUrl?: string;
  expiresAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// List parameters
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// KPI Dashboard types
export interface KPICard {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
  color?: string;
}

export interface DashboardData {
  kpis: KPICard[];
  recentOrders: SalesOrder[];
  activeTrips: TripPlan[];
  notifications: Notification[];
}