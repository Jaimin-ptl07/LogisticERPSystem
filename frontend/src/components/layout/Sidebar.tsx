"use client";

import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  ChevronRight,
  ChevronDown,
  User,
  UserCircle,
  LogOut,
  Building2,
  Users,
  DollarSign,
  Package2,
  LayoutDashboard,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { logoutAsync } from "@/store/slices/auth.slice";
import { useState } from "react";
import { ROLES } from "@/lib/roles";

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  role: string;
  subItems?: SubMenuItem[];
}

// Define navigation structure for each role
const navigationStructure: NavItem[] = [
  {
    label: "Super Admin",
    icon: User,
    role: ROLES.SUPER_ADMIN,
    subItems: [
      { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
      { label: "Companies", href: "/super-admin/companies", icon: Building2 },
      { label: "Users", href: "/super-admin/users", icon: Users },
      {
        label: "System Settings",
        href: "/super-admin/settings",
        icon: Settings,
      },
    ],
  },
  {
    label: "Company Admin",
    icon: Building2,
    role: ROLES.COMPANY_ADMIN,
    subItems: [
      {
        label: "Dashboard",
        href: "/company-admin/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Orders", href: "/company-admin/orders", icon: ShoppingCart },
      { label: "Trips", href: "/company-admin/trips", icon: Truck },
      { label: "Masters", href: "/company-admin/masters", icon: Settings },
    ],
  },
  {
    label: "Branch Manager",
    icon: MapPin,
    role: ROLES.BRANCH_MANAGER,
    subItems: [
      {
        label: "Dashboard",
        href: "/branch-manager/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Orders", href: "/branch-manager/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Finance Manager",
    icon: DollarSign,
    role: ROLES.FINANCE_MANAGER,
    subItems: [
      {
        label: "Dashboard",
        href: "/finance-manager/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Invoices", href: "/finance-manager/invoices", icon: FileText },
      { label: "Reports", href: "/finance-manager/reports", icon: FileText },
    ],
  },
  {
    label: "Logistics Manager",
    icon: Package2,
    role: ROLES.LOGISTICS_MANAGER,
    subItems: [
      {
        label: "Dashboard",
        href: "/logistics-manager/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Fleet Management",
        href: "/logistics-manager/fleet",
        icon: Truck,
      },
      { label: "Routes", href: "/logistics-manager/routes", icon: MapPin },
    ],
  },
  {
    label: "Driver",
    icon: Truck,
    role: ROLES.DRIVER,
    subItems: [
      { label: "My Trips", href: "/driver/trips", icon: Truck },
      { label: "Deliveries", href: "/driver/deliveries", icon: Package },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Get user role - normalize it
  const userRole = user?.role?.name?.toLowerCase().replace(/[\s_-]+/g, "_");

  // Handle logout
  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Toggle menu expansion
  const toggleMenu = (role: string) => {
    setExpandedMenus((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (!user) return [];

    // Super admin sees everything
    if (user.is_superuser || userRole === ROLES.SUPER_ADMIN) {
      return navigationStructure;
    }

    // Other users only see their own role menu
    return navigationStructure.filter((nav) => nav.role === userRole);
  };

  const filteredNavigation = getFilteredNavigation();

  // Auto-expand active menu on mount
  useState(() => {
    filteredNavigation.forEach((nav) => {
      const isActive = nav.subItems?.some((sub) =>
        pathname.startsWith(sub.href)
      );
      if (isActive && !expandedMenus.includes(nav.role)) {
        setExpandedMenus((prev) => [...prev, nav.role]);
      }
    });
  });

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto",
        className
      )}
    >
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">LogisticERP</h1>
        <p className="text-sm text-gray-500">Management System</p>
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenus.includes(item.role);
            const hasActiveChild = item.subItems?.some((sub) =>
              pathname.startsWith(sub.href)
            );

            return (
              <li key={item.role}>
                {/* Main Menu Item */}
                <button
                  onClick={() => toggleMenu(item.role)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    hasActiveChild
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Sub Menu Items */}
                {isExpanded && item.subItems && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon || ChevronRight;
                      const isActive =
                        pathname === subItem.href ||
                        pathname.startsWith(subItem.href + "/");

                      return (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <SubIcon className="w-4 h-4" />
                            {subItem.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <Dropdown
          trigger={
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role?.name || "User"}
                </p>
              </div>
            </div>
          }
        >
          <DropdownItem onClick={() => router.push("/profile")}>
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Profile
            </div>
          </DropdownItem>
          <DropdownItem onClick={() => router.push("/settings")}>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </div>
          </DropdownItem>
          <hr className="my-1" />
          <DropdownItem onClick={handleLogout}>
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </div>
          </DropdownItem>
        </Dropdown>
      </div>
    </aside>
  );
}
