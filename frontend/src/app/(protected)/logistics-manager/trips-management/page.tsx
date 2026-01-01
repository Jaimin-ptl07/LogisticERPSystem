"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import {
  tmsAPI,
  tmsResourcesAPI,
  OrderAssignData,
  TripCreateData,
} from "@/lib/api";
import { Driver, Trip } from "@/types";
import {
  Truck,
  MapPin,
  User,
  Package,
  Plus,
  Weight,
  CheckCircle,
  XCircle,
  X,
  Phone,
  Play,
  RotateCcw,
  ChevronDown,
  GripVertical,
  Search,
  Award,
  CreditCard,
  Scissors,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Trips() {
  // Utility function to format date in UK timezone
  const formatUKDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/London",
      }).format(date);
    } catch (error) {
      return "Invalid date";
    }
  };

  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTripForOrders, setSelectedTripForOrders] =
    useState<Trip | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderPriorityFilter, setOrderPriorityFilter] = useState("all");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [tmsOrderStatusFilter, setTmsOrderStatusFilter] = useState<"all" | "available" | "partial" | "fully_assigned">("all");

  // Search states for trip creation
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [truckSearchTerm, setTruckSearchTerm] = useState("");
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [splitOrder, setSplitOrder] = useState<any | null>(null);
  const [selectedSplitItems, setSelectedSplitItems] = useState<string[]>([]);
  const [splitItemQuantities, setSplitItemQuantities] = useState<Record<string, number>>({});

  // Resource data from API
  const [availableTrucks, setAvailableTrucks] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop states
  const [draggedOrder, setDraggedOrder] = useState<any>(null);
  const [dragOverTrip, setDragOverTrip] = useState<string | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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
      // Use default tenant for now - in production, this would come from auth context
      const tenantId = "default-tenant";

      const [trucksData, driversData, ordersData, branchesData] =
        await Promise.all([
          tmsResourcesAPI.getTrucks(tenantId),
          tmsResourcesAPI.getDrivers(),
          tmsResourcesAPI.getOrders(),
          tmsResourcesAPI.getBranches(tenantId),
        ]);

      console.log("fetchResources - driversData:", driversData);
      console.log("fetchResources - branchesData:", branchesData);
      setAvailableTrucks(trucksData);
      setAvailableDrivers(driversData);
      setAvailableOrders(ordersData);
      setBranches(branchesData);
    } catch (err) {
      console.error("fetchResources error:", err);
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
      // Check if trying to change to loading status and validate order statuses
      if (newStatus === "loading") {
        const trip = allTrips.find((t) => t.id === tripId);
        if (trip && trip.orders) {
          const hasPendingOrders = trip.orders.some(
            (order) => order.status === "submitted"
          );
          if (hasPendingOrders) {
            alert(
              "Cannot change trip status to loading while there are orders submitted for approval."
            );
            return;
          }
        }
      }

      await tmsAPI.updateTrip(tripId, { status: newStatus });

      // Refresh trips to show updated status
      fetchTrips();

      // Show success message
      const statusMessages = {
        loading: "Trip is now in loading status",
        "on-route": "Trip is now on route",
        completed: "Trip has been completed",
        cancelled: "Trip has been cancelled",
        "truck-malfunction": "Truck malfunction has been reported",
        planning: "Trip is back to planning status",
      };

      alert(
        statusMessages[newStatus as keyof typeof statusMessages] ||
          "Trip status updated"
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update trip status"
      );
    }
  };

  const handleCreateTrip = async () => {
    try {
      // Find selected truck and driver details
      const selectedTruckDetails = availableTrucks.find(
        (t) => t.id === selectedTruck
      );

      // Find selected branch details to get the branch name and ID
      const selectedBranchDetails = branches.find(
        (b) => b.id === selectedBranch
      );

      if (!selectedTruckDetails || !selectedDriver || !selectedBranch || !selectedBranchDetails) {
        alert("Please select branch, truck, and driver");
        return;
      }

      // Create trip via API
      const tripData: TripCreateData = {
        branch: selectedBranch, // Send branch UUID directly (branch field contains UUID)
        truck_plate: selectedTruckDetails.plate,
        truck_model: selectedTruckDetails.model,
        truck_capacity: selectedTruckDetails.capacity,
        driver_id: selectedDriver.user_id, // Store the driver's user_id from auth service
        driver_name: selectedDriver.name,
        driver_phone: selectedDriver.phone,
        capacity_total: selectedTruckDetails.capacity,
        trip_date: new Date().toISOString().split("T")[0],
        origin: selectedBranchDetails.name, // Send branch name for origin (display)
        destination: null, // Will be determined later
      };

      await tmsAPI.createTrip(tripData);

      // Refresh trips
      fetchTrips();

      // Reset form
      setSelectedBranch("");
      setSelectedTruck("");
      setSelectedDriver(null);
      setCurrentStep(1);
      setShowCreateTrip(false);
      setBranchSearchTerm("");
      setTruckSearchTerm("");
      setDriverSearchTerm("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create trip");
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBranchSelect = async (branchId: string) => {
    setSelectedBranch(branchId);
    setSelectedTruck("");
    setSelectedDriver(null);
    setBranchSearchTerm("");
    setTruckSearchTerm("");
    setDriverSearchTerm("");

    // Find the branch object to get its ID
    const selectedBranchObj = branches.find((b) => b.id === branchId);

    if (selectedBranchObj) {
      try {
        // Check if this is a fallback branch (from company service being down)
        if (selectedBranchObj.id === "default-branch") {
          // If it's a fallback branch, just use the general trucks list
          const tenantId = "default-tenant";
          const allTrucks = await tmsResourcesAPI.getTrucks(tenantId);
          setAvailableTrucks(allTrucks);
        } else {
          // Fetch trucks for the selected branch
          const tenantId = "default-tenant";
          const branchTrucks = await tmsResourcesAPI.getTrucksByBranch(
            selectedBranchObj.id,
            tenantId
          );
          setAvailableTrucks(branchTrucks);
        }
      } catch (err) {
        console.error("Failed to fetch trucks for branch:", err);
        // Fallback to general trucks list if branch-specific fetch fails
        try {
          const tenantId = "default-tenant";
          const allTrucks = await tmsResourcesAPI.getTrucks(tenantId);
          setAvailableTrucks(allTrucks);
        } catch (fallbackErr) {
          console.error("Failed to fetch fallback trucks:", fallbackErr);
          // Keep existing trucks if all fetches fail
        }
      }
    }
  };

  const handleCloseModal = async () => {
    setSelectedBranch("");
    setSelectedTruck("");
    setSelectedDriver(null);
    setCurrentStep(1);
    setShowCreateTrip(false);
    setBranchSearchTerm("");
    setTruckSearchTerm("");
    setDriverSearchTerm("");

    // Reset to fetch all trucks again
    await fetchResources();
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

  const getDeliveryStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "out-for-delivery":
        return "default";
      case "delivered":
        return "success";
      case "failed":
        return "danger";
      case "returned":
        return "danger";
      default:
        return "default";
    }
  };

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case "submitted":
        return "default";
      case "finance_approved":
        return "success";
      default:
        return "default";
    }
  };

  const getOrderStatusDisplay = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "finance_approved":
        return "Finance Approved";
      default:
        return (
          status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
        );
    }
  };

  const getApprovedOrders = () => {
    const filtered = availableOrders.filter(
      (order) =>
        (order.status === "submitted" || order.status === "finance_approved") &&
        order.tms_order_status !== "fully_assigned" // Exclude fully_assigned orders (undefined/null means available)
    );
    console.log("getApprovedOrders - total orders:", availableOrders.length);
    console.log("getApprovedOrders - filtered orders:", filtered.length);
    console.log("getApprovedOrders - sample tms statuses:", availableOrders.slice(0, 10).map(o => ({ id: o.id, status: o.status, tms_status: o.tms_order_status })));
    return filtered;
  };
  const getTrucksAvailable = () =>
    availableTrucks.filter((truck) => truck.status === "available");
  const getDriversAvailable = () => {
    console.log("getDriversAvailable - availableDrivers:", availableDrivers);
    console.log("getDriversAvailable - selectedBranch:", selectedBranch);
    const filtered = availableDrivers.filter(
      (driver) => {
        const statusMatch = driver.status === "available";
        const noTruck = !driver.currentTruck;
        const branchMatch = !selectedBranch || driver.branch_id === selectedBranch;
        console.log(`Driver ${driver.name}: status=${driver.status}, branch_id=${driver.branch_id}, statusMatch=${statusMatch}, noTruck=${noTruck}, branchMatch=${branchMatch}`);
        return statusMatch && noTruck && branchMatch;
      }
    );
    console.log("getDriversAvailable - filtered:", filtered);
    return filtered;
  };

  // Check if order is already assigned to any trip
  const isOrderAssigned = (orderId: string) => {
    return allTrips.some((trip) =>
      trip.orders.some((order) => order.id === orderId)
    );
  };

  // Filter functions for trip creation
  const getFilteredBranches = () => {
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(branchSearchTerm.toLowerCase()) ||
        branch.location.toLowerCase().includes(branchSearchTerm.toLowerCase())
    );
  };

  const getFilteredTrucks = () => {
    const available = getTrucksAvailable();
    return available.filter(
      (truck) =>
        truck.plate.toLowerCase().includes(truckSearchTerm.toLowerCase()) ||
        truck.model.toLowerCase().includes(truckSearchTerm.toLowerCase()) ||
        truck.capacity.toString().includes(truckSearchTerm)
    );
  };

  const getFilteredDrivers = () => {
    const available = getDriversAvailable();
    return available.filter(
      (driver) =>
        driver.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
        driver.phone.includes(driverSearchTerm) ||
        driver.license.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );
  };

  // Order assignment helper functions
  const getAvailableOrders = () => {
    return availableOrders.filter((order) => {
      const isApprovedStatus =
        order.status === "submitted" || order.status === "finance_approved";
      const isNotAssigned = !isOrderAssigned(order.id);
      const matchesSearch =
        order.customer.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(orderSearchTerm.toLowerCase());
      const matchesPriority =
        orderPriorityFilter === "all" || order.priority === orderPriorityFilter;

      return (
        isApprovedStatus && isNotAssigned && matchesSearch && matchesPriority
      );
    });
  };

  // Toggle trip expansion
  const toggleTripExpansion = (tripId: string) => {
    const newExpanded = new Set(expandedTrips);
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId);
    } else {
      newExpanded.add(tripId);
    }
    setExpandedTrips(newExpanded);
  };

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    order: any,
    sourceTripId?: string,
    sourceIndex?: number
  ) => {
    setDraggedOrder({ ...order, sourceTripId, sourceIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent,
    tripId: string,
    targetIndex?: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTrip(tripId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the trip container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverTrip(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetTripId: string,
    targetIndex?: number
  ) => {
    e.preventDefault();
    setDragOverTrip(null);

    if (!draggedOrder || !targetTripId) return;

    try {
      // If dropping on the same trip, we need to reorder
      if (
        draggedOrder.sourceTripId === targetTripId &&
        targetIndex !== undefined
      ) {
        const sourceTrip = allTrips.find((t) => t.id === targetTripId);
        if (!sourceTrip || sourceTrip.status !== "planning") return;

        // Get the current orders
        const currentOrders = [...sourceTrip.orders];

        // Remove the dragged order from its original position
        const reorderedOrders = currentOrders.filter(
          (order) => order.id !== draggedOrder.id
        );

        // Insert it at the new position
        reorderedOrders.splice(targetIndex, 0, draggedOrder);

        // Update the order in the UI immediately for better UX
        const updatedTrips = allTrips.map((trip) => {
          if (trip.id === targetTripId) {
            return { ...trip, orders: reorderedOrders };
          }
          return trip;
        });
        setAllTrips(updatedTrips);

        // Call the reorder API to persist the change
        await handleReorderOrders(targetTripId, reorderedOrders);
      }
      // If dropping on a different trip, move the order
      else if (draggedOrder.sourceTripId !== targetTripId) {
        // Get target trip
        const targetTrip = allTrips.find((t) => t.id === targetTripId);
        if (!targetTrip || targetTrip.status !== "planning") {
          alert("Can only add orders to trips in planning status");
          setDraggedOrder(null);
          return;
        }

        // Check capacity
        const newCapacityUsed =
          (targetTrip.capacityUsed || 0) + draggedOrder.weight;
        if (newCapacityUsed > (targetTrip.capacityTotal || 0)) {
          alert("Order exceeds trip capacity");
          setDraggedOrder(null);
          return;
        }

        // If order is from another trip, we need to handle reassignment
        if (draggedOrder.sourceTripId) {
          await tmsAPI.removeOrderFromTrip(
            draggedOrder.sourceTripId,
            draggedOrder.order_id || draggedOrder.id
          );
        }

        // Assign order to new trip
        const orderData = {
          order_id: draggedOrder.order_id || draggedOrder.id,
          customer: draggedOrder.customer,
          customerAddress: draggedOrder.customerAddress,
          total: draggedOrder.total,
          weight: draggedOrder.weight,
          volume: draggedOrder.volume,
          items: draggedOrder.items,
          items_json: draggedOrder.items_data || draggedOrder.items || [], // Include full items array
          priority: draggedOrder.priority,
          address: draggedOrder.address,
        };

        await tmsAPI.assignOrdersToTrip(targetTripId, [orderData]);

        // Refresh trips
        fetchTrips();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to move order");
      // Refresh to restore original state
      fetchTrips();
    }

    setDraggedOrder(null);
  };

  // Reorder orders within a trip
  const handleReorderOrders = async (tripId: string, orders: any[]) => {
    try {
      // Prepare the sequence data
      const orderSequences = orders.map((order, index) => ({
        order_id: order.id,
        sequence_number: index,
      }));

      // Call the reorder API
      await tmsAPI.reorderTripOrders(tripId, {
        order_sequences: orderSequences,
      });

      // Refresh trips
      fetchTrips();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reorder orders");
      fetchTrips(); // Refresh to restore original order
    }
  };

  // Split order logic - open item selection modal
  const handleSplitOrder = (order: any) => {
    if (!selectedTripForOrders) return;

    const availableCapacity =
      (selectedTripForOrders.capacityTotal || 0) -
      (selectedTripForOrders.capacityUsed || 0);

    if (availableCapacity <= 0) {
      alert("No available capacity to split this order!");
      return;
    }

    // Set the order and initialize split state
    setSplitOrder(order);
    setSelectedSplitItems([]);
    setSplitItemQuantities({});
    setShowSplitOptions(true);
  };

  const handleConfirmSplit = async () => {
    if (!splitOrder || !selectedTripForOrders || selectedSplitItems.length === 0) return;

    try {
      // Get the order items
      const orderItems = (splitOrder.items_data || splitOrder.items);
      const itemsArray = Array.isArray(orderItems) ? orderItems : [];

      // Filter selected items
      const selectedItemsData = itemsArray.filter((item: any) =>
        selectedSplitItems.includes(item.id || String(item.product_id))
      );

      // Calculate totals for selected items
      const selectedWeight = selectedItemsData.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
      const selectedVolume = selectedItemsData.reduce((sum: number, item: any) => sum + (item.volume || 0), 0);
      const selectedTotal = selectedItemsData.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

      // Create split order data with selected items
      const splitOrderData: OrderAssignData = {
        order_id: `${splitOrder.id}-SPLIT-${Date.now()}`,
        customer: splitOrder.customer,
        customerAddress: splitOrder.customerAddress,
        total: selectedTotal,
        weight: Math.round(selectedWeight),
        volume: Math.round(selectedVolume),
        items: selectedSplitItems.length,
        priority: splitOrder.priority,
        address: splitOrder.address,
        original_order_id: splitOrder.id,
        original_items: itemsArray.length,
        original_weight: splitOrder.weight,
        items_json: selectedItemsData, // Store selected items
        remaining_items_json: itemsArray.filter((item: any) =>
          !selectedSplitItems.includes(item.id || String(item.product_id))
        ), // Store remaining items
      };

      // Assign split order to trip
      await tmsAPI.assignOrdersToTrip(selectedTripForOrders.id, [splitOrderData]);

      // Show success message
      const remainingItemsCount = itemsArray.length - selectedSplitItems.length;
      const remainingWeight = splitOrder.weight - selectedWeight;
      alert(
        `Successfully assigned ${selectedSplitItems.length} items (${selectedWeight}kg) to trip. ` +
        `${remainingItemsCount} items (${remainingWeight}kg) remaining from order ${splitOrder.id}.`
      );

      // Reset split state and close modals
      setSplitOrder(null);
      setSelectedSplitItems([]);
      setShowSplitOptions(false);
      setShowOrderModal(false);
      setExpandedOrderIds(new Set());
      setSelectedTripForOrders(null);
      setSelectedOrders([]);

      // Refresh trips and orders
      fetchTrips();
      fetchResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to split order");
    }
  };

  const handleAddOrderClick = (trip: Trip) => {
    setSelectedTripForOrders(trip);
    setSelectedOrders([]);
    setShowOrderModal(true);
  };

  const handleOrderToggle = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const calculateTotalWeight = (orderIds: string[]) => {
    return orderIds.reduce((total, orderId) => {
      const order = availableOrders.find((o) => o.id === orderId);
      return total + (order?.weight || 0);
    }, 0);
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

  const handleAssignOrders = async () => {
    if (!selectedTripForOrders || selectedOrders.length === 0) return;

    try {
      // Prepare orders data
      const ordersData: OrderAssignData[] = [];
      selectedOrders.forEach((orderId) => {
        const order = availableOrders.find((o) => o.id === orderId);
        if (order) {
          ordersData.push({
            order_id: order.id,
            customer: order.customer,
            customerAddress: order.customerAddress,
            total: order.total,
            weight: order.weight,
            volume: order.volume,
            items: Array.isArray(order.items) ? order.items.length : (order.items_count || order.items || 0),
            items_json: order.items || [], // Include full items array
            priority: order.priority,
            address: order.address,
          });
        }
      });

      // Check capacity
      const newCapacityUsed =
        (selectedTripForOrders.capacityUsed || 0) +
        calculateTotalWeight(selectedOrders);
      if (newCapacityUsed > (selectedTripForOrders.capacityTotal || 0)) {
        if (
          !confirm(
            "Warning: Adding these orders will exceed the truck capacity. Do you want to continue?"
          )
        ) {
          return;
        }
      }

      // Assign orders via API
      await tmsAPI.assignOrdersToTrip(selectedTripForOrders.id, ordersData);

      // Refresh trips
      fetchTrips();

      // Close modal and reset
      setShowOrderModal(false);
      setSelectedTripForOrders(null);
      setSelectedOrders([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign orders");
    }
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

  return (
    <div className="space-y-6">
      {/* Loading and Error States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading trips data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
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

      {!loading && !error && (
        <>
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Logistics Manager
              </h1>
              <p className="text-gray-500 mt-2">
                Create trip plans and manage truck/driver assignments
              </p>
            </div>
            <Button
              onClick={() => setShowCreateTrip(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Create New Trip
            </Button>
          </div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === "planning"
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === "planning" ? null : "planning")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      statusFilter === "planning"
                        ? "bg-blue-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 ${
                        statusFilter === "planning"
                          ? "text-blue-600"
                          : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">
                      {tripStats.planning}
                    </p>
                    <p
                      className={`text-sm ${
                        statusFilter === "planning"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      Planning
                      {statusFilter === "planning" && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === "loading"
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === "loading" ? null : "loading")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      statusFilter === "loading"
                        ? "bg-yellow-100"
                        : "bg-yellow-50"
                    }`}
                  >
                    <Truck className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">
                      {tripStats.loading}
                    </p>
                    <p
                      className={`text-sm ${
                        statusFilter === "loading"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      Loading
                      {statusFilter === "loading" && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === "on-route"
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === "on-route" ? null : "on-route")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      statusFilter === "on-route" ? "bg-blue-100" : "bg-blue-50"
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">
                      {tripStats.onRoute}
                    </p>
                    <p
                      className={`text-sm ${
                        statusFilter === "on-route"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      On Route
                      {statusFilter === "on-route" && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === "completed"
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "completed" ? null : "completed"
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      statusFilter === "completed"
                        ? "bg-green-100"
                        : "bg-green-50"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">
                      {tripStats.completed}
                    </p>
                    <p
                      className={`text-sm ${
                        statusFilter === "completed"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      Completed
                      {statusFilter === "completed" && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === "cancelled"
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : ""
              }`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "cancelled" ? null : "cancelled"
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      statusFilter === "cancelled" ? "bg-red-100" : "bg-red-50"
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-black">
                      {tripStats.cancelled}
                    </p>
                    <p
                      className={`text-sm ${
                        statusFilter === "cancelled"
                          ? "text-blue-600 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      Cancelled
                      {statusFilter === "cancelled" && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="trips" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trips" className="text-black">
                Trips ({activeTrips.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-black">
                Orders ({getApprovedOrders().length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-black">
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Trips Tab */}
            <TabsContent value="trips">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-black">All Trips</CardTitle>
                    {statusFilter && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Filter:{" "}
                          <span className="font-medium text-blue-600">
                            {statusFilter.replace("-", " ").toUpperCase()}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatusFilter(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activeTrips.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {statusFilter
                            ? `No ${statusFilter.replace("-", " ")} trips`
                            : "No trips available"}
                        </h3>
                        <p className="text-gray-500">
                          {statusFilter
                            ? `There are no trips with ${statusFilter.replace(
                                "-",
                                " "
                              )} status.`
                            : "Create your first trip to get started."}
                        </p>
                        {statusFilter && (
                          <Button
                            onClick={() => setStatusFilter(null)}
                            variant="outline"
                            className="mt-4"
                          >
                            Clear Filter
                          </Button>
                        )}
                      </div>
                    ) : (
                      activeTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className={`border border-gray-200 rounded-lg overflow-hidden transition-all ${
                            isTripLocked(trip.status)
                              ? "bg-gray-50"
                              : "bg-white"
                          } ${
                            dragOverTrip === trip.id
                              ? "ring-2 ring-blue-400 bg-blue-50"
                              : ""
                          }`}
                          onDragOver={(e) => handleDragOver(e, trip.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, trip.id)}
                        >
                          {/* Trip Header with ID and Status */}
                          <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {trip.id}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    Created: {formatUKDateTime(trip.createdAt)}
                                  </p>
                                </div>
                                <Badge
                                  variant={getStatusVariant(trip.status)}
                                  className="mt-1"
                                >
                                  {trip.status.toUpperCase().replace("-", " ")}
                                </Badge>
                                {isTripLocked(trip.status) && (
                                  <Badge variant="warning" className="text-xs">
                                    LOCKED
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getNextStatusOptions(trip.status).length >
                                  0 && (
                                  <div className="flex gap-1">
                                    {getNextStatusOptions(trip.status).map(
                                      (option) => (
                                        <Button
                                          key={option.value}
                                          size="sm"
                                          onClick={() =>
                                            handleStatusChange(
                                              trip.id,
                                              option.value
                                            )
                                          }
                                          className={`text-xs text-white border-transparent hover:opacity-90 ${
                                            option.color === "red"
                                              ? "bg-red-600 hover:bg-red-700"
                                              : option.color === "green"
                                              ? "bg-green-600 hover:bg-green-700"
                                              : option.color === "blue"
                                              ? "bg-blue-600 hover:bg-blue-700"
                                              : option.color === "yellow"
                                              ? "bg-yellow-600 hover:bg-yellow-700"
                                              : "bg-gray-600 hover:bg-gray-700"
                                          }`}
                                        >
                                          {option.color === "red" && (
                                            <XCircle className="w-3 h-3 mr-1 text-white" />
                                          )}
                                          {option.color === "green" && (
                                            <CheckCircle className="w-3 h-3 mr-1 text-white" />
                                          )}
                                          {option.color === "blue" && (
                                            <Play className="w-3 h-3 mr-1 text-white" />
                                          )}
                                          {option.color === "yellow" && (
                                            <Package className="w-3 h-3 mr-1 text-white" />
                                          )}
                                          {option.color === "gray" && (
                                            <RotateCcw className="w-3 h-3 mr-1 text-white" />
                                          )}
                                          {option.label}
                                        </Button>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Two Column Layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                            {/* Left Column - Trip Details */}
                            <div className="lg:col-span-1 border-r border-gray-200 bg-white">
                              {/* Route Section */}
                              <div className="p-4 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500" />
                                  ROUTE
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                                    <div>
                                      <p className="text-xs text-gray-500">Origin</p>
                                      <p className="text-sm font-medium text-gray-900">{trip.origin || "Not set"}</p>
                                    </div>
                                  </div>
                                  <div className="ml-1 border-l-2 border-dashed border-gray-300 h-4"></div>
                                  <div className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                                    <div>
                                      <p className="text-xs text-gray-500">Destination</p>
                                      <p className="text-sm font-medium text-gray-900">{trip.destination || "To be determined"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Truck Section */}
                              <div className="p-4 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-gray-500" />
                                  TRUCK
                                </h4>
                                {trip.truck ? (
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-xs text-gray-500">Plate Number</p>
                                      <p className="font-medium text-gray-900">{trip.truck.plate}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Model</p>
                                      <p className="font-medium text-gray-900">{trip.truck.model}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">Not assigned</p>
                                )}
                              </div>

                              {/* Driver Section */}
                              <div className="p-4 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  DRIVER
                                </h4>
                                {trip.driver ? (
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <p className="text-xs text-gray-500">Name</p>
                                      <p className="font-medium text-gray-900">{trip.driver.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Phone</p>
                                      <p className="font-medium text-gray-900 flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {trip.driver.phone}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">Not assigned</p>
                                )}
                              </div>

                              {/* Capacity Section */}
                              <div className="p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <Weight className="w-4 h-4 text-gray-500" />
                                  CAPACITY
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Weight</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {trip.capacityUsed || 0} / {trip.capacityTotal || 0} kg
                                    </span>
                                  </div>
                                  {trip.capacityTotal && trip.capacityTotal > 0 && (
                                    <div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${getCapacityColor(
                                            getCapacityPercentage(
                                              trip.capacityUsed || 0,
                                              trip.capacityTotal
                                            )
                                          )}`}
                                          style={{
                                            width: `${Math.min(
                                              getCapacityPercentage(
                                                trip.capacityUsed || 0,
                                                trip.capacityTotal
                                              ),
                                              100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                      <div className="flex justify-between mt-1">
                                        <span className="text-xs font-medium text-gray-600">
                                          {getCapacityPercentage(
                                            trip.capacityUsed || 0,
                                            trip.capacityTotal
                                          )}
                                          %
                                        </span>
                                        {getCapacityPercentage(
                                          trip.capacityUsed || 0,
                                          trip.capacityTotal
                                        ) > 100 && (
                                          <span className="text-xs text-red-600 font-medium">
                                            Overloaded
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="pt-2 border-t border-gray-100">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-500">Total Orders:</span>
                                      <span className="font-medium text-gray-900">{trip.orders.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                      <span className="text-gray-500">Total Weight:</span>
                                      <span className="font-medium text-gray-900">
                                        {trip.orders.reduce((sum, order) => sum + (order.weight || 0), 0)} kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Orders with Items */}
                            <div className="lg:col-span-2 bg-white">
                              {/* Orders Header */}
                              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  ORDERS ({trip.orders.length})
                                </h4>
                                {trip.status === "planning" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddOrderClick(trip)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Order
                                  </Button>
                                )}
                              </div>

                              {/* Orders List */}
                              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                                {trip.orders.length > 0 ? (
                                  trip.orders.map((order, orderIndex) => (
                                    <div
                                      key={order.id}
                                      className={`group ${
                                        !isTripLocked(trip.status)
                                          ? "hover:bg-gray-50"
                                          : ""
                                      }`}
                                    >
                                      {/* Order Header - Always Visible */}
                                      <div className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            {trip.status === "planning" && (
                                              <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                            )}
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                                #{order.sequence_number !== undefined ? order.sequence_number + 1 : orderIndex + 1}
                                              </span>
                                              <span className="font-semibold text-gray-900">{order.id}</span>
                                            </div>
                                            <span className="text-gray-700">{order.customer || "Unknown Customer"}</span>
                                            {order.priority && (
                                              <Badge
                                                variant={getPriorityVariant(order.priority)}
                                                                className="text-xs"
                                              >
                                                                {order.priority.toUpperCase()}
                                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <div className="text-right">
                                              <p className="text-sm text-gray-600">{Array.isArray(order.items) ? order.items.length : (order.items_count || order.items || 0)} items</p>
                                              <p className="text-sm font-medium text-gray-900">{order.weight || 0}kg</p>
                                            </div>
                                          </div>
                                        </div>
                                        {order.address && (
                                          <div className="mt-2 ml-7">
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                              <MapPin className="w-3 h-3" />
                                              {order.address}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Order Items - Always Visible */}
                                      <div className="border-t border-gray-200 bg-gray-50 px-4 pb-4">
                                        <h5 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                          Order Items
                                        </h5>
                                        {(order.items_data && order.items_data.length > 0) || (order.items && Array.isArray(order.items) && order.items.length > 0) ? (
                                          <div className="space-y-2">
                                            {(order.items_data || order.items).map((item: any, itemIndex: number) => (
                                              <div
                                                key={item.id || itemIndex}
                                                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                                              >
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-medium text-gray-500">#{itemIndex + 1}</span>
                                                      <span className="font-medium text-gray-900">{item.product_name || "Unknown Product"}</span>
                                                      {item.product_code && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                          {item.product_code}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {item.description && (
                                                      <p className="text-xs text-gray-500 ml-5">{item.description}</p>
                                                    )}
                                                    <div className="mt-2 ml-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                      <div>
                                                        <span className="text-gray-500">Quantity:</span>
                                                        <span className="ml-1 font-medium text-gray-900">{item.quantity} {item.unit || "pcs"}</span>
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">Weight:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                          {item.weight ?? 0} {item.weight_unit || "kg"}
                                                          {item.weight_type && (
                                                            <span className="text-gray-400">({item.weight_type})</span>
                                                          )}
                                                        </span>
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">Volume:</span>
                                                        <span className="ml-1 font-medium text-gray-900">{item.volume ?? 0} m³</span>
                                                      </div>
                                                      <div>
                                                        <span className="text-gray-500">Price:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                          {item.unit_price ? `${item.unit_price}/${item.unit || "unit"}` : "N/A"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    {item.total_weight && (
                                                      <div className="ml-5 mt-1 text-xs">
                                                        <span className="text-gray-500">Total Weight:</span>
                                                        <span className="ml-1 font-semibold text-gray-900">{item.total_weight} kg</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {!isTripLocked(trip.status) && (
                                                    <div className="ml-4 flex gap-1">
                                                      <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                                                        Edit
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-center py-4 text-gray-500 text-sm">
                                            No items found for this order
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-8 text-center text-gray-500">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">No orders assigned to this trip yet</p>
                                    {trip.status === "planning" && (
                                      <p className="text-xs mt-1 text-gray-400">
                                        Click &quot;Add Order&quot; to assign orders to this trip
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Drag Instructions */}
                          {trip.status === "planning" &&
                            trip.orders.length > 0 && (
                              <div className="p-4 bg-blue-50 border-t border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <strong>Drag & Drop:</strong> You can drag
                                  orders to reorder them within this trip or
                                  move them to another trip in planning
                                  status.
                                </p>
                              </div>
                            )}

                          {/* Lock Status Message */}
                          {isTripLocked(trip.status) && (
                            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                              <p className="text-sm text-yellow-800">
                                <strong>Trip is locked:</strong> Order details
                                cannot be modified when trip is{" "}
                                {trip.status.replace("-", " ")}.
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Approved Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">
                    Orders ({getApprovedOrders().length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getApprovedOrders().map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                      >
                        {/* Order Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4">
                              <h3 className="font-semibold text-gray-900">
                                {order.id}
                              </h3>
                              <Badge
                                variant={getPriorityVariant(order.priority)}
                                className="mt-1"
                              >
                                {order.priority}
                              </Badge>
                              <Badge
                                variant={getOrderStatusVariant(order.status)}
                              >
                                {getOrderStatusDisplay(order.status)}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">
                                {order.date}
                              </span>
                              <p className="text-lg font-semibold text-gray-900">
                                ₹{order.total.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Customer</p>
                              <p className="font-medium text-gray-900">
                                {order.customer}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Items</p>
                              <p className="font-medium text-gray-900">
                                {Array.isArray(order.items) ? order.items.length : (order.items_count || order.items || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Weight</p>
                              <p className="font-medium text-gray-900 flex items-center gap-1">
                                <Weight className="w-4 h-4" />
                                {order.weight} kg
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Volume</p>
                              <p className="font-medium text-gray-900">
                                {order.volume} L
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-900">
                              <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
                              {order.address}
                            </p>
                          </div>
                        </div>

                        {/* Order Items - Always Visible */}
                        {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                          <div className="border-t border-gray-200 bg-gray-50 px-4 pb-4">
                            <h5 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                              Order Items
                            </h5>
                            <div className="space-y-2">
                              {order.items.map((item: any, itemIndex: number) => (
                                <div
                                  key={item.id || itemIndex}
                                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-500">#{itemIndex + 1}</span>
                                        <span className="font-medium text-gray-900">{item.product_name || "Unknown Product"}</span>
                                        {item.product_code && (
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {item.product_code}
                                          </span>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-xs text-gray-500 ml-5">{item.description}</p>
                                      )}
                                      <div className="mt-2 ml-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Quantity:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.quantity} {item.unit || "pcs"}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Weight:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {item.weight ?? 0} {item.weight_unit || "kg"}
                                            {item.weight_type && (
                                              <span className="text-gray-400">({item.weight_type})</span>
                                            )}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Volume:</span>
                                          <span className="ml-1 font-medium text-gray-900">{item.volume ?? 0} m³</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Price:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {item.unit_price ? `${item.unit_price}/${item.unit || "unit"}` : "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      {item.total_weight && (
                                        <div className="ml-5 mt-1 text-xs">
                                          <span className="text-gray-500">Total Weight:</span>
                                          <span className="ml-1 font-semibold text-gray-900">{item.total_weight} kg</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="px-4 pb-4">
                          <div className="flex gap-2">
                            <Button size="sm">Assign to Trip</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Trucks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-black">
                      Available Trucks ({getTrucksAvailable().length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getTrucksAvailable().map((truck) => (
                        <div
                          key={truck.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {truck.plate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {truck.model} • {truck.capacity}kg
                            </p>
                          </div>
                          <Badge variant="success">Available</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Available Drivers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-black">
                      Available Drivers ({availableDrivers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {availableDrivers.map((driver) => (
                        <div
                          key={driver.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {driver.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {driver.phone} • {driver.experience}
                            </p>
                          </div>
                          <Badge variant="success">Available</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Create Trip Modal - Same as original */}
          {showCreateTrip && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-black">
                      Create New Trip
                    </h2>
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 1
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        1
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          currentStep >= 1 ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        Select Branch
                      </span>
                    </div>
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        currentStep >= 2 ? "bg-green-600" : "bg-gray-200"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 2
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        2
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          currentStep >= 2 ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        Select Truck
                      </span>
                    </div>
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        currentStep >= 3 ? "bg-green-600" : "bg-gray-200"
                      }`}
                    ></div>
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= 3
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        3
                      </div>
                      <span
                        className={`ml-2 text-sm font-medium ${
                          currentStep >= 3 ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        Select Driver
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step Content - Same as original */}
                <div className="px-6 py-6">
                  {/* Step 1: Select Branch */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-4">
                        Select Branch
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Choose the branch for this trip
                      </p>

                      {/* Search Input */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search branches by name or location..."
                          value={branchSearchTerm}
                          onChange={(e) => setBranchSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                        />
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {getFilteredBranches().map((branch) => (
                          <div
                            key={branch.id}
                            onClick={() => handleBranchSelect(branch.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedBranch === branch.id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-black">
                                  {branch.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {branch.location}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Manager: {branch.manager}
                                </p>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  selectedBranch === branch.id
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedBranch === branch.id && (
                                  <div className="w-full h-full rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Truck */}
                  {currentStep === 2 && (
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-4">
                        Select Truck
                      </h3>
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Selected Branch:
                            </p>
                            <p className="font-medium text-black">
                              {branches.find(b => b.id === selectedBranch)?.name || "Not selected"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Available Trucks:
                            </p>
                            <p className="text-sm text-gray-500">
                              {getFilteredTrucks().length} trucks found
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search trucks by plate, model, or capacity..."
                          value={truckSearchTerm}
                          onChange={(e) => setTruckSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                        />
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {getFilteredTrucks().map((truck) => (
                          <div
                            key={truck.id}
                            onClick={() => setSelectedTruck(truck.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTruck === truck.id
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <Truck className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-black">
                                    {truck.plate}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {truck.model}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Capacity: {truck.capacity}kg
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  selectedTruck === truck.id
                                    ? "border-green-500 bg-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {selectedTruck === truck.id && (
                                  <div className="w-full h-full rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Select Driver */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-2">
                          Select Driver
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Choose a driver for the trip
                        </p>
                      </div>

                      {/* Previous Selections Summary */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-black mb-2">
                          Trip Configuration:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              Selected Branch:
                            </span>
                            <span className="font-medium text-black">
                              {branches.find(b => b.id === selectedBranch)?.name || selectedBranch}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              Selected Truck:
                            </span>
                            <span className="font-medium text-black">
                              {selectedTruck
                                ? availableTrucks.find(
                                    (t) => t.id === selectedTruck
                                  )?.plate
                                : "Not selected"}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 border-t pt-2">
                          Available Drivers:{" "}
                          <span className="font-medium text-black">
                            {getFilteredDrivers().length} drivers found
                          </span>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search drivers by name, phone, or license..."
                          value={driverSearchTerm}
                          onChange={(e) => setDriverSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {getFilteredDrivers().map((driver) => (
                          <div
                            key={driver.id}
                            onClick={() => setSelectedDriver(driver)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedDriver?.id === driver.id
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-black">
                                {driver.name}
                              </span>
                              {selectedDriver?.id === driver.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {driver.experience}
                              </div>
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {driver.license}
                              </div>
                            </div>
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  driver.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {driver.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-between">
                    <Button
                      onClick={handlePrevStep}
                      variant="outline"
                      disabled={currentStep === 1}
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Previous
                    </Button>
                    {currentStep < 3 ? (
                      <Button
                        onClick={handleNextStep}
                        disabled={
                          (currentStep === 1 && !selectedBranch) ||
                          (currentStep === 2 && !selectedTruck)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreateTrip}
                        disabled={!selectedDriver}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Create Trip
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Assignment Modal - Same as original */}
          {showOrderModal && selectedTripForOrders && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-black">
                        Add Orders to Trip
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Trip:{" "}
                        <span className="font-medium">
                          {selectedTripForOrders.id}
                        </span>{" "}
                        • Truck:{" "}
                        <span className="font-medium">
                          {selectedTripForOrders.truck?.plate}
                        </span>{" "}
                        • Capacity:{" "}
                        <span className="font-medium">
                          {selectedTripForOrders.capacityTotal}kg
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowOrderModal(false)}
                      variant="outline"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-6 py-6">
                  {/* Capacity Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Current Capacity Used
                        </p>
                        <p className="text-lg font-semibold text-black">
                          {selectedTripForOrders.capacityUsed || 0}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Selected Orders Weight
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {calculateTotalWeight(selectedOrders)}kg
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Total After Assignment
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            (selectedTripForOrders.capacityUsed || 0) +
                              calculateTotalWeight(selectedOrders) >
                            (selectedTripForOrders.capacityTotal || 0)
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {(selectedTripForOrders.capacityUsed || 0) +
                            calculateTotalWeight(selectedOrders)}
                          kg
                        </p>
                      </div>
                    </div>
                    {(selectedTripForOrders.capacityTotal || 0) > 0 && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${getCapacityColor(
                              getCapacityPercentage(
                                (selectedTripForOrders.capacityUsed || 0) +
                                  calculateTotalWeight(selectedOrders),
                                selectedTripForOrders.capacityTotal || 0
                              )
                            )}`}
                            style={{
                              width: `${Math.min(
                                getCapacityPercentage(
                                  (selectedTripForOrders.capacityUsed || 0) +
                                    calculateTotalWeight(selectedOrders),
                                  selectedTripForOrders.capacityTotal || 0
                                ),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getCapacityPercentage(
                            (selectedTripForOrders.capacityUsed || 0) +
                              calculateTotalWeight(selectedOrders),
                            selectedTripForOrders.capacityTotal || 0
                          )}
                          % capacity used
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Available Orders List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-black">
                        Available Orders
                      </h3>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Search orders..."
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                        <select
                          value={orderPriorityFilter}
                          onChange={(e) =>
                            setOrderPriorityFilter(e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Priority</option>
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>
                    {getAvailableOrders().length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No available orders to assign</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getAvailableOrders().map((order) => {
                          const wouldExceedCapacity =
                            (selectedTripForOrders.capacityUsed || 0) +
                              calculateTotalWeight([
                                ...selectedOrders,
                                order.id,
                              ]) >
                            (selectedTripForOrders.capacityTotal || 0);
                          const isExpanded = expandedOrderIds.has(order.id);
                          const orderItems = (order.items_data || order.items);
                          const itemsArray = Array.isArray(orderItems) ? orderItems : [];

                          return (
                            <div
                              key={order.id}
                              className={`border rounded-lg transition-all overflow-hidden ${
                                selectedOrders.includes(order.id)
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              } ${
                                wouldExceedCapacity ? "border-orange-400" : ""
                              }`}
                            >
                              {/* Order Header - Always Visible */}
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedOrders.includes(order.id)}
                                      onChange={() => {
                                        if (!wouldExceedCapacity) {
                                          handleOrderToggle(order.id);
                                        }
                                      }}
                                      disabled={wouldExceedCapacity}
                                      className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <p className="font-medium text-black">
                                          {order.id}
                                        </p>
                                        <Badge
                                          variant={getPriorityVariant(order.priority)}
                                          className="text-xs"
                                        >
                                          {order.priority?.toUpperCase()}
                                        </Badge>
                                        {wouldExceedCapacity && (
                                          <span className="text-xs text-orange-600 font-medium">
                                            ⚠️ Exceeds capacity!
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {order.customer}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {order.address}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right text-sm">
                                      <p className="font-medium text-black">
                                        {order.weight}kg
                                      </p>
                                      <p className="text-gray-600">
                                        {itemsArray.length} items
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setExpandedOrderIds(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(order.id)) {
                                            newSet.delete(order.id);
                                          } else {
                                            newSet.add(order.id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Order Items - Expandable */}
                              {isExpanded && itemsArray.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50 px-4 pb-4">
                                  <h6 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                    Order Items
                                  </h6>
                                  <div className="space-y-2">
                                    {itemsArray.map((item: any, idx: number) => (
                                      <div
                                        key={item.id || idx}
                                        className="bg-white border border-gray-200 rounded-lg p-3"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                                              <span className="font-medium text-gray-900 text-sm">
                                                {item.product_name || "Unknown Product"}
                                              </span>
                                              {item.product_code && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                  {item.product_code}
                                                </span>
                                              )}
                                            </div>
                                            {item.description && (
                                              <p className="text-xs text-gray-500 ml-5">{item.description}</p>
                                            )}
                                            <div className="mt-2 ml-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                              <div>
                                                <span className="text-gray-500">Quantity:</span>
                                                <span className="ml-1 font-medium text-gray-900">
                                                  {item.quantity} {item.unit || "pcs"}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-500">Weight:</span>
                                                <span className="ml-1 font-medium text-gray-900">
                                                  {item.weight ?? 0} {item.weight_unit || "kg"}
                                                  {item.weight_type && (
                                                    <span className="text-gray-400">({item.weight_type})</span>
                                                  )}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-500">Volume:</span>
                                                <span className="ml-1 font-medium text-gray-900">
                                                  {item.volume ?? 0} m³
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-500">Price:</span>
                                                <span className="ml-1 font-medium text-gray-900">
                                                  {item.unit_price ? `${item.unit_price}/${item.unit || "unit"}` : "N/A"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {wouldExceedCapacity && (
                                    <div className="mt-3 flex justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSplitOrder(order)}
                                        className="text-xs"
                                      >
                                        <Scissors className="w-4 h-4 mr-1" />
                                        Split Order Items
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-between">
                    <Button
                      onClick={() => {
                        setShowOrderModal(false);
                        setExpandedOrderIds(new Set());
                      }}
                      variant="outline"
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignOrders}
                      disabled={selectedOrders.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Assign {selectedOrders.length} Order
                      {selectedOrders.length !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Split Order Modal - Item Level Selection */}
          {showSplitOptions && splitOrder && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-black">
                        Split Order Items
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {splitOrder.id} - {splitOrder.customer}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowSplitOptions(false);
                        setSplitOrder(null);
                        setSelectedSplitItems([]);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="px-6 py-6 overflow-y-auto flex-1">
                  {/* Capacity Info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Scissors className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-orange-800 mb-1">
                          Select Items to Assign
                        </h3>
                        <p className="text-sm text-orange-700">
                          Available Capacity: {(selectedTripForOrders?.capacityTotal || 0) - (selectedTripForOrders?.capacityUsed || 0)} kg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Selected Weight</p>
                        <p className="text-lg font-bold text-orange-600">
                          {(() => {
                            const orderItems = (splitOrder.items_data || splitOrder.items);
                            const itemsArray = Array.isArray(orderItems) ? orderItems : [];
                            return itemsArray.reduce((sum: number, item: any) => {
                              if (selectedSplitItems.includes(item.id || String(item.product_id))) {
                                return sum + (item.weight || 0);
                              }
                              return sum;
                            }, 0);
                          })()} kg
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-black">Order Items</h4>
                    {(() => {
                      const orderItems = (splitOrder.items_data || splitOrder.items);
                      const itemsArray = Array.isArray(orderItems) ? orderItems : [];

                      if (itemsArray.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No items found in this order</p>
                          </div>
                        );
                      }

                      return itemsArray.map((item: any, idx: number) => {
                        const itemId = item.id || String(item.product_id) || String(idx);
                        const isSelected = selectedSplitItems.includes(itemId);
                        const itemWeight = item.weight || 0;
                        const canSelect = (selectedTripForOrders?.capacityUsed || 0) +
                          (() => {
                            const currentWeight = itemsArray.reduce((sum: number, i: any) => {
                              if (selectedSplitItems.includes(i.id || String(i.product_id) || String(idx))) {
                                return sum + (i.weight || 0);
                              }
                              return sum;
                            }, 0);
                            return currentWeight + (isSelected ? 0 : itemWeight);
                          })() <= (selectedTripForOrders?.capacityTotal || 0);

                        return (
                          <div
                            key={itemId}
                            className={`border rounded-lg overflow-hidden transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : canSelect
                                ? 'border-gray-200 hover:border-gray-300 bg-white'
                                : 'border-gray-200 bg-gray-100 opacity-60'
                            }`}
                          >
                            <div className="p-4">
                              <div className="flex items-start gap-4">
                                <input
                                  type="checkbox"
                                  id={`item-${itemId}`}
                                  checked={isSelected}
                                  disabled={!canSelect && !isSelected}
                                  onChange={() => {
                                    setSelectedSplitItems(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(itemId)) {
                                        newSet.delete(itemId);
                                      } else {
                                        newSet.add(itemId);
                                      }
                                      return Array.from(newSet);
                                    });
                                  }}
                                  className="w-5 h-5 text-blue-600 rounded mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                      #{idx + 1}
                                    </span>
                                    <label
                                      htmlFor={`item-${itemId}`}
                                      className={`font-medium ${canSelect || isSelected ? 'text-black cursor-pointer' : 'text-gray-500 cursor-not-allowed'}`}
                                    >
                                      {item.product_name || "Unknown Product"}
                                    </label>
                                    {item.product_code && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {item.product_code}
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                  )}

                                  {/* Quantity Split Input */}
                                  <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Quantity to Assign (Max: {item.quantity || 1})
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={item.quantity || 1}
                                      defaultValue={isSelected ? item.quantity : 0}
                                      disabled={!isSelected}
                                      onChange={(e) => {
                                        // TODO: Track split quantities per item
                                        console.log(`Item ${itemId} quantity:`, e.target.value);
                                      }}
                                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="grid grid-cols-4 gap-3 text-xs">
                                    <div className="bg-gray-50 p-2 rounded">
                                      <p className="text-gray-500">Quantity</p>
                                      <p className="font-medium text-black">{item.quantity || 1} {item.unit || 'pcs'}</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                      <p className="text-gray-500">Weight</p>
                                      <p className="font-medium text-black">{itemWeight} kg</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                      <p className="text-gray-500">Volume</p>
                                      <p className="font-medium text-black">{item.volume || 0} m³</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                      <p className="text-gray-500">Price</p>
                                      <p className="font-medium text-black">
                                        {item.unit_price ? `${item.unit_price}/${item.unit || 'unit'}` : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-900 mb-3">This Trip</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Items Selected:</span>
                          <span className="font-medium text-blue-900">{selectedSplitItems.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Total Weight:</span>
                          <span className="font-medium text-blue-900">
                            {(() => {
                              const orderItems = (splitOrder.items_data || splitOrder.items);
                              const itemsArray = Array.isArray(orderItems) ? orderItems : [];
                              return itemsArray.reduce((sum: number, item: any) => {
                                if (selectedSplitItems.includes(item.id || String(item.product_id))) {
                                  return sum + (item.weight || 0);
                                }
                                return sum;
                              }, 0);
                            })()} kg
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h5 className="font-semibold text-orange-900 mb-3">Remaining</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-orange-700">Items Remaining:</span>
                          <span className="font-medium text-orange-900">
                            {(() => {
                              const orderItems = (splitOrder.items_data || splitOrder.items);
                              const itemsArray = Array.isArray(orderItems) ? orderItems : [];
                              return itemsArray.length - selectedSplitItems.length;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-700">Total Weight:</span>
                          <span className="font-medium text-orange-900">
                            {(() => {
                              const orderItems = (splitOrder.items_data || splitOrder.items);
                              const itemsArray = Array.isArray(orderItems) ? orderItems : [];
                              const selectedWeight = itemsArray.reduce((sum: number, item: any) => {
                                if (selectedSplitItems.includes(item.id || String(item.product_id))) {
                                  return sum + (item.weight || 0);
                                }
                                return sum;
                              }, 0);
                              return (splitOrder.weight || 0) - selectedWeight;
                            })()} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                  <div className="flex justify-between">
                    <Button
                      onClick={() => {
                        setShowSplitOptions(false);
                        setSplitOrder(null);
                        setSelectedSplitItems([]);
                      }}
                      variant="outline"
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        // TODO: Implement split assignment with selected items
                        handleConfirmSplit();
                      }}
                      disabled={selectedSplitItems.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Assign {selectedSplitItems.length} Item{selectedSplitItems.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
