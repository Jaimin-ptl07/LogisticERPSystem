export interface OrderAssignData {
  //   user_id: string;
  //   company_id: string;
  order_id: string;
  customer: string;
  customerAddress?: string;
  total: number;
  weight: number;
  volume: number;
  items: number;
  priority: string;
  address?: string;
  original_order_id?: string;
  original_items?: number;
  original_weight?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  experience: string;
  license: string;
  status: string;
  currentTruck?: string | null;
}

export interface Trip {
  id: string;
  status: string;
  date: string;
  origin: string;
  destination: string;
  truck?: {
    plate: string;
    model: string;
  };
  driver?: {
    name: string;
    phone: string;
  };
  capacityTotal: number;
  capacityUsed: number;
  orders: TripOrder[];
}

export interface TripOrder {
  id: string;
  customer: string;
  priority: string;
  items: number;
  weight: number;
}

export interface TripCreateData {
  // user_id: string;
  // company_id: string;
  branch: string;
  truck_plate: string;
  truck_model: string;
  truck_capacity: number;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  capacity_total: number;
  trip_date: string;
  origin?: string;
  destination?: string | null;
}
