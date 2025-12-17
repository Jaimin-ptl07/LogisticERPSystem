'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getCurrentUserAsync } from '@/store/slices/auth.slice';
import { canAccessRoute, getDefaultRoute } from '@/lib/roles';
import { Spinner } from '@/components/ui/Spinner';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If authenticated but no user data, fetch it
    if (isAuthenticated && !user) {
      dispatch(getCurrentUserAsync());
      return;
    }

    // Check role-based access
    if (user && user.role?.name) {
      const userRole = user.role.name;
      
      // Check if user can access current route
      if (!canAccessRoute(userRole, pathname)) {
        console.warn(`Access denied for role ${userRole} to ${pathname}`);
        // Redirect to default route for this role
        const defaultRoute = getDefaultRoute(userRole);
        router.push(defaultRoute);
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router, dispatch]);

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="w-12 h-12 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render with persistent Sidebar and Header
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  );
}

