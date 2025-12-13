import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types/auth';
import clsx from 'clsx';
import {
  Home,
  Building2,
  Users,
  Truck,
  FileText,
  DollarSign,
  Settings,
  Package,
  Navigation,
  CreditCard,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const navigationMenus: Record<UserRole, SidebarSection[]> = {
  [UserRole.SUPER_ADMIN]: [
    {
      title: 'Main',
      items: [
        { href: '/app/super-admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/super-admin/companies', label: 'Companies', icon: <Building2 size={20} /> },
        { href: '/app/super-admin/tenants', label: 'Tenants', icon: <Users size={20} /> },
      ],
    },
    {
      title: 'System',
      items: [
        { href: '/app/super-admin/subscriptions', label: 'Subscriptions', icon: <CreditCard size={20} /> },
        { href: '/app/super-admin/settings', label: 'Settings', icon: <Settings size={20} /> },
      ],
    },
  ],
  [UserRole.COMPANY_ADMIN]: [
    {
      title: 'Main',
      items: [
        { href: '/app/company-admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/company-admin/branches', label: 'Branches', icon: <Building2 size={20} /> },
        { href: '/app/company-admin/users', label: 'Users', icon: <Users size={20} /> },
        { href: '/app/company-admin/customers', label: 'Customers', icon: <Users size={20} /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { href: '/app/company-admin/vehicles', label: 'Vehicles', icon: <Truck size={20} /> },
        { href: '/app/company-admin/pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
        { href: '/app/company-admin/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
      ],
    },
    {
      title: 'Settings',
      items: [
        { href: '/app/company-admin/settings', label: 'Settings', icon: <Settings size={20} /> },
      ],
    },
  ],
  [UserRole.BRANCH_MANAGER]: [
    {
      title: 'Operations',
      items: [
        { href: '/app/branch-manager/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/branch-manager/orders', label: 'Orders', icon: <FileText size={20} /> },
        { href: '/app/branch-manager/customers', label: 'Customers', icon: <Users size={20} /> },
        { href: '/app/branch-manager/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
      ],
    },
  ],
  [UserRole.FINANCE_MANAGER]: [
    {
      title: 'Finance',
      items: [
        { href: '/app/finance-manager/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/finance-manager/orders', label: 'Orders', icon: <FileText size={20} /> },
        { href: '/app/finance-manager/pricing', label: 'Pricing', icon: <DollarSign size={20} /> },
        { href: '/app/finance-manager/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
      ],
    },
  ],
  [UserRole.LOGISTICS_MANAGER]: [
    {
      title: 'Logistics',
      items: [
        { href: '/app/logistics-manager/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/logistics-manager/trips', label: 'Trips', icon: <Navigation size={20} /> },
        { href: '/app/logistics-manager/vehicles', label: 'Vehicles', icon: <Truck size={20} /> },
        { href: '/app/logistics-manager/drivers', label: 'Drivers', icon: <Users size={20} /> },
        { href: '/app/logistics-manager/orders', label: 'Orders', icon: <Package size={20} /> },
        { href: '/app/logistics-manager/tracking', label: 'Live Tracking', icon: <Navigation size={20} /> },
      ],
    },
  ],
  [UserRole.DRIVER]: [
    {
      title: 'Driver',
      items: [
        { href: '/app/driver/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/app/driver/trips', label: 'My Trips', icon: <Navigation size={20} /> },
        { href: '/app/driver/profile', label: 'Profile', icon: <Users size={20} /> },
        { href: '/app/driver/completed', label: 'Completed', icon: <Package size={20} /> },
      ],
    },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile = false }) => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const notifications = useAppSelector((state) => state.notification.notifications);

  const menuItems = user?.role ? navigationMenus[user.role] : [];

  const isActive = (href: string) => {
    if (href === '/app') return false;
    return router.pathname.startsWith(href);
  };

  const getNotificationCount = (href: string) => {
    if (href.includes('notifications')) {
      return notifications.filter((n) => !n.isRead).length;
    }
    return 0;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Logistics ERP</h1>
        {isMobile && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const badge = getNotificationCount(item.href);
                return (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        {
                          'bg-gray-800 text-white': isActive(item.href),
                          'text-gray-300 hover:bg-gray-800 hover:text-white': !isActive(item.href),
                        }
                      )}
                      onClick={isMobile ? onClose : undefined}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => {
            // Handle logout
            router.push('/login');
          }}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={onClose}
          />
        )}
        {/* Mobile sidebar */}
        <div
          className={clsx(
            'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:hidden',
            {
              'translate-x-0': isOpen,
              '-translate-x-full': !isOpen,
            }
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64">{sidebarContent}</div>
    </div>
  );
};

export default Sidebar;