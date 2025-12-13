import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { getCurrentUser } from '@/store/slices/authSlice';
import Sidebar from '../Sidebar';
import Header from '../Header';
import LoadingSpinner from '@/components/shared/ui/LoadingSpinner';

interface AppLayoutProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, requiredPermissions = [] }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication on mount and route change
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Get current user if not loaded
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, isLoading, user, dispatch, router]);

  // Check permissions
  const hasPermission = React.useMemo(() => {
    if (!user || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((permission) =>
      user.permissions.some((p) => p.name === permission)
    );
  }, [user, requiredPermissions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile />

      {/* Desktop sidebar */}
      <Sidebar isOpen={true} onClose={() => {}} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;