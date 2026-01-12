import { API_BASE_URL } from "./config";

// Types for Analytics API responses

export type DateRangePreset = "today" | "last_7_days" | "last_30_days" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  start_date?: string;
  end_date?: string;
}

// Dashboard KPI types
export interface KPIMetric {
  value: number;
  unit: string;
  trend: "up" | "down" | "neutral";
}

export interface DashboardSummary {
  total_orders: KPIMetric;
  orders_delivered_today: KPIMetric;
  avg_fulfillment_time: KPIMetric;
  active_trips: KPIMetric;
  available_drivers: KPIMetric;
  available_trucks: KPIMetric;
  driver_utilization_percent: number;
  truck_utilization_percent: number;
  orders_in_bottleneck: number;
  trips_delayed: number;
}

// Status count types
export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderStatusCountsResponse {
  date_range: DateRange;
  total_orders: number;
  status_counts: StatusCount[];
}

export interface TripStatusCountsResponse {
  date_range: DateRange;
  total_trips: number;
  status_counts: StatusCount[];
}

export interface DriverStatusCountsResponse {
  date_range: DateRange;
  total_drivers: number;
  status_counts: StatusCount[];
}

export interface TruckStatusCountsResponse {
  date_range: DateRange;
  total_trucks: number;
  status_counts: StatusCount[];
}

// Duration analysis types
export interface StatusDuration {
  from_status: string;
  to_status: string;
  avg_hours: number;
  min_hours: number;
  max_hours: number;
  median_hours: number;
  p95_hours: number;
}

export interface OrderStatusDurationsResponse {
  date_range: DateRange;
  durations: StatusDuration[];
}

export interface TripStatusDurationsResponse {
  date_range: DateRange;
  durations: StatusDuration[];
  pause_analysis: {
    total_pause_hours: number;
    avg_pause_hours: number;
    max_pause_hours: number;
    pause_count: number;
  };
}

// Lifecycle times
export interface LifecycleTime {
  entity_id: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  lifecycle_hours: number;
}

export interface OrderLifecycleTimesResponse {
  date_range: DateRange;
  lifecycle_times: LifecycleTime[];
  avg_lifecycle_hours: number;
  median_lifecycle_hours: number;
}

export interface TripLifecycleTimesResponse {
  date_range: DateRange;
  lifecycle_times: LifecycleTime[];
  avg_lifecycle_hours: number;
  median_lifecycle_hours: number;
}

// Bottlenecks
export interface BottleneckItem {
  current_status: string;
  stuck_count: number;
  avg_hours_stuck: number;
  max_hours_stuck: number;
}

export interface OrderBottlenecksResponse {
  date_range: DateRange;
  threshold_hours: number;
  bottlenecks: BottleneckItem[];
}

export interface TripInefficienciesResponse {
  date_range: DateRange;
  planning_delays: number;
  loading_delays: number;
  inefficiencies: {
    trip_id: string;
    delay_type: "planning" | "loading";
    delay_hours: number;
  }[];
}

// Utilization
export interface UtilizationMetrics {
  entity_id: string;
  entity_name?: string;
  utilization_percent: number;
  total_hours: number;
  active_hours: number;
  idle_hours: number;
}

export interface DriverUtilizationResponse {
  date_range: DateRange;
  drivers: UtilizationMetrics[];
  avg_utilization_percent: number;
}

export interface TruckUtilizationResponse {
  date_range: DateRange;
  trucks: UtilizationMetrics[];
  avg_utilization_percent: number;
}

// Entity timeline
export interface TimelineEvent {
  timestamp: string;
  from_status?: string;
  to_status: string;
  action: string;
  description?: string;
  user_name?: string;
  duration_hours?: number;
}

export interface EntityTimelineResponse {
  entity_type: "order" | "trip" | "driver" | "truck";
  entity_id: string;
  current_status: string;
  created_at: string;
  timeline: TimelineEvent[];
  total_duration_hours: number;
}

// API Client class
class AnalyticsAPIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private get authHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.authHeaders,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: "Unknown error occurred",
        }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Dashboard Summary
  async getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/api/v1/dashboard/summary", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  // Order Analytics
  async getOrderStatusCounts(dateRange: DateRange): Promise<OrderStatusCountsResponse> {
    return this.request<OrderStatusCountsResponse>("/api/v1/orders/status-counts", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getOrderStatusDurations(dateRange: DateRange): Promise<OrderStatusDurationsResponse> {
    return this.request<OrderStatusDurationsResponse>("/api/v1/orders/status-durations", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getOrderLifecycleTimes(dateRange: DateRange): Promise<OrderLifecycleTimesResponse> {
    return this.request<OrderLifecycleTimesResponse>("/api/v1/orders/lifecycle-times", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getOrderBottlenecks(
    dateRange: DateRange,
    thresholdHours: number = 4
  ): Promise<OrderBottlenecksResponse> {
    return this.request<OrderBottlenecksResponse>(
      `/api/v1/orders/bottlenecks?threshold_hours=${thresholdHours}`,
      {
        method: "POST",
        body: JSON.stringify(dateRange),
      }
    );
  }

  // Trip Analytics
  async getTripStatusCounts(dateRange: DateRange): Promise<TripStatusCountsResponse> {
    return this.request<TripStatusCountsResponse>("/api/v1/trips/status-counts", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getTripStatusDurations(dateRange: DateRange): Promise<TripStatusDurationsResponse> {
    return this.request<TripStatusDurationsResponse>("/api/v1/trips/status-durations", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getTripLifecycleTimes(dateRange: DateRange): Promise<TripLifecycleTimesResponse> {
    return this.request<TripLifecycleTimesResponse>("/api/v1/trips/lifecycle-times", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getTripInefficiencies(dateRange: DateRange): Promise<TripInefficienciesResponse> {
    return this.request<TripInefficienciesResponse>("/api/v1/trips/inefficiencies", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  // Driver Analytics
  async getDriverStatusCounts(dateRange: DateRange): Promise<DriverStatusCountsResponse> {
    return this.request<DriverStatusCountsResponse>("/api/v1/drivers/status-counts", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getDriverUtilization(dateRange: DateRange): Promise<DriverUtilizationResponse> {
    return this.request<DriverUtilizationResponse>("/api/v1/drivers/utilization", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  // Truck Analytics
  async getTruckStatusCounts(dateRange: DateRange): Promise<TruckStatusCountsResponse> {
    return this.request<TruckStatusCountsResponse>("/api/v1/trucks/status-counts", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  async getTruckUtilization(dateRange: DateRange): Promise<TruckUtilizationResponse> {
    return this.request<TruckUtilizationResponse>("/api/v1/trucks/utilization", {
      method: "POST",
      body: JSON.stringify(dateRange),
    });
  }

  // Entity Timeline
  async getEntityTimeline(
    entityType: "order" | "trip" | "driver" | "truck",
    entityId: string
  ): Promise<EntityTimelineResponse> {
    return this.request<EntityTimelineResponse>(
      `/api/v1/timeline/${entityType}/${entityId}`
    );
  }
}

// Export singleton instance
export const analyticsAPI = new AnalyticsAPIClient();

// Export types
export type {
  StatusCount,
  StatusDuration,
  LifecycleTime,
  BottleneckItem,
  UtilizationMetrics,
  TimelineEvent,
};
