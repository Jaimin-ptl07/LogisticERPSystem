"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { tmsAPI, tmsResourcesAPI } from "@/lib/api";
import { Driver, Trip, OrderAssignData } from "@/types/common";
import { XCircle, X, CheckCircle, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import TripsDashboard from "@/components/driver/TripsDashboard";
import TripsTabs from "@/components/driver/TripsTabs";
import CreateTripModal from "@/components/driver/CreateTripModal";
import OrderAssignModal from "@/components/driver/OrderAssignModal";
import { ModalLayout } from "@/components/Modal/ModalLayout";

export default function DriverTrips() {
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTripForOrders, setSelectedTripForOrders] =
    useState<Trip | null>(null);

  // Confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationType, setConfirmationType] = useState<"success" | "error">(
    "success"
  );

  // Resource data from API
  const [availableTrucks, setAvailableTrucks] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllTrips();
    fetchResources();
  }, []);

  // Fetch all trips (for statistics)
  const fetchAllTrips = async () => {
    try {
      setLoading(true);
      const data = await tmsAPI.getAllTrips();
      setAllTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trips");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trips with filters (for display) - now just refreshes all trips
  const fetchTrips = async (filters?: { status?: string; branch?: string }) => {
    // We'll just refresh all trips since filtering is now done on frontend
    await fetchAllTrips();
  };

  // Fetch all resources
  const fetchResources = async () => {
    try {
      const [trucksData, driversData, ordersData, branchesData] =
        await Promise.all([
          tmsResourcesAPI.getTrucks(),
          tmsResourcesAPI.getDrivers(),
          tmsResourcesAPI.getOrders(),
          tmsResourcesAPI.getBranches(),
        ]);

      setAvailableTrucks(trucksData);
      setAvailableDrivers(driversData);
      setAvailableOrders(ordersData);
      setBranches(branchesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch resources"
      );
    }
  };

  // Update filtered trips when status filter changes
  useEffect(() => {
    fetchTrips(statusFilter ? { status: statusFilter } : undefined);
  }, [statusFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "on-route":
        return "info";
      case "loading":
        return "warning";
      case "planning":
        return "default";
      case "cancelled":
        return "danger";
      case "truck-malfunction":
        return "danger";
      default:
        return "default";
    }
  };

  const isTripLocked = (status: string) => {
    return ["on-route", "loading", "completed", "truck-malfunction"].includes(
      status
    );
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case "planning":
        return [{ value: "loading", label: "Start Loading", color: "yellow" }];
      case "loading":
        return [
          { value: "on-route", label: "Start Delivery", color: "blue" },
          { value: "planning", label: "Back to Planning", color: "gray" },
        ];
      case "on-route":
        return [
          { value: "completed", label: "Complete Trip", color: "green" },
          {
            value: "truck-malfunction",
            label: "Report Truck Malfunction",
            color: "red",
          },
        ];
      case "truck-malfunction":
        return [
          { value: "loading", label: "Resume Loading", color: "yellow" },
          { value: "on-route", label: "Resume Delivery", color: "blue" },
        ];
      case "completed":
      case "cancelled":
        return [];
      default:
        return [];
    }
  };

  const handleStatusChange = async (tripId: string, newStatus: string) => {
    try {
      await tmsAPI.updateTrip(tripId, { status: newStatus });

      // Refresh trips to show updated status
      fetchTrips();

      // Show success message in custom modal
      const statusMessages = {
        loading: "Trip is Now in loading status",
        "on-route": "Trip is Now on route",
        completed: "Trip has been completed",
        cancelled: "Trip has been cancelled",
        "truck-malfunction": "Truck malfunction has been reported",
        planning: "Trip is back to planning status",
      };

      setConfirmationMessage(
        statusMessages[newStatus as keyof typeof statusMessages] ||
          "Trip status updated"
      );
      setConfirmationType("success");
      setShowConfirmationModal(true);
    } catch (err) {
      setConfirmationMessage(
        err instanceof Error ? err.message : "Failed to update trip status"
      );
      setConfirmationType("error");
      setShowConfirmationModal(true);
    }
  };

  const handleTripCreated = () => {
    // Refresh trips after creating a new trip
    fetchTrips();
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getApprovedOrders = () =>
    availableOrders.filter((order) => order.status === "approved");
  const getTrucksAvailable = () =>
    availableTrucks.filter((truck) => truck.status === "available");
  const getDriversAvailable = () =>
    availableDrivers.filter(
      (driver) => driver.status === "active" && !driver.currentTruck
    );

  const handleAddOrderClick = (trip: Trip) => {
    setSelectedTripForOrders(trip);
    setShowOrderModal(true);
  };

  const getCapacityPercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleOrdersAssigned = () => {
    // Refresh trips after orders are assigned
    fetchTrips();
    setShowOrderModal(false);
    setSelectedTripForOrders(null);
  };

  // Calculate statistics
  const tripStats = {
    planning: allTrips.filter((t) => t.status === "planning").length,
    loading: allTrips.filter((t) => t.status === "loading").length,
    onRoute: allTrips.filter((t) => t.status === "on-route").length,
    completed: allTrips.filter((t) => t.status === "completed").length,
    cancelled: allTrips.filter((t) => t.status === "cancelled").length,
  };

  const activeTrips = statusFilter
    ? allTrips.filter((t) => t.status === statusFilter)
    : allTrips;

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton variant="line" height="2.25rem" width="16rem" />
          <Skeleton
            variant="line"
            height="1rem"
            width="24rem"
            className="mt-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton
                    variant="rectangle"
                    width="2.5rem"
                    height="2.5rem"
                  />
                  <div className="space-y-2">
                    <Skeleton variant="line" width="3rem" height="1.5rem" />
                    <Skeleton variant="line" width="4rem" height="0.875rem" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangle"
                  height="8rem"
                  width="100%"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setError(null);
                    fetchTrips();
                    fetchResources();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* Dashboard Section - Header + Status Cards */}
          <TripsDashboard
            tripStats={tripStats}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onCreateTripClick={() => setShowCreateTrip(true)}
          />

          {/* Tabs Section */}
          <TripsTabs
            activeTrips={activeTrips}
            statusFilter={statusFilter}
            onStatusFilterClear={() => setStatusFilter(null)}
            getStatusVariant={getStatusVariant}
            isTripLocked={isTripLocked}
            getNextStatusOptions={getNextStatusOptions}
            handleStatusChange={handleStatusChange}
            getCapacityPercentage={getCapacityPercentage}
            getCapacityColor={getCapacityColor}
            getPriorityVariant={getPriorityVariant}
            handleAddOrderClick={handleAddOrderClick}
            approvedOrders={getApprovedOrders()}
            getPriorityVariantForOrder={getPriorityVariant}
            availableTrucks={availableTrucks}
            availableDrivers={availableDrivers}
          />

          {/* Create Trip Modal */}
          <CreateTripModal
            isOpen={showCreateTrip}
            onClose={() => setShowCreateTrip(false)}
            branches={branches}
            availableTrucks={availableTrucks}
            availableDrivers={availableDrivers}
            onTripCreated={handleTripCreated}
          />

          {/* Order Assignment Modal */}
          <OrderAssignModal
            isOpen={showOrderModal}
            onClose={() => {
              setShowOrderModal(false);
              setSelectedTripForOrders(null);
            }}
            trip={selectedTripForOrders}
            availableOrders={availableOrders}
            allTrips={allTrips}
            getPriorityVariant={getPriorityVariant}
            getCapacityPercentage={getCapacityPercentage}
            getCapacityColor={getCapacityColor}
            onOrdersAssigned={handleOrdersAssigned}
          />

          {/* Status Change Confirmation Modal */}
          <ModalLayout
            isOpen={showConfirmationModal}
            onClose={() => setShowConfirmationModal(false)}
            title={confirmationType === "success" ? "Success" : "Error"}
            size="sm"
          >
            <div className="py-4">
              <div className="flex items-start gap-4">
                {confirmationType === "success" ? (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    confirmationType === "success"
                      ? "text-gray-700"
                      : "text-red-700"
                  }`}
                >
                  {confirmationMessage}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowConfirmationModal(false)}
                  className={
                    confirmationType === "success"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  OK
                </Button>
              </div>
            </div>
          </ModalLayout>
        </>
      )}
    </div>
  );
}
