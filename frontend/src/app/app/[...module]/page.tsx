import React from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types/auth';
import AppLayout from '@/components/shared/layout/AppLayout';

// Dynamic import for module components
const modulePages = {
  'super-admin': React.lazy(() => import('@/components/modules/super-admin/Dashboard')),
  'company-admin': React.lazy(() => import('@/components/modules/company-admin/Dashboard')),
  'branch-manager': React.lazy(() => import('@/components/modules/branch-manager/Dashboard')),
  'finance-manager': React.lazy(() => import('@/components/modules/finance-manager/Dashboard')),
  'logistics-manager': React.lazy(() => import('@/components/modules/logistics-manager/Dashboard')),
  'driver': React.lazy(() => import('@/components/modules/driver/Dashboard')),
};

export default function ModulePage() {
  const router = useRouter();
  const { module } = router.query;
  const { user } = useAppSelector((state) => state.auth);

  const ModuleComponent = modulePages[module as keyof typeof modulePages];

  // Check if user has access to this module
  const hasAccess = React.useMemo(() => {
    if (!user || !module) return false;

    const moduleRoleMap: Record<string, UserRole> = {
      'super-admin': UserRole.SUPER_ADMIN,
      'company-admin': UserRole.COMPANY_ADMIN,
      'branch-manager': UserRole.BRANCH_MANAGER,
      'finance-manager': UserRole.FINANCE_MANAGER,
      'logistics-manager': UserRole.LOGISTICS_MANAGER,
      'driver': UserRole.DRIVER,
    };

    return user.role === moduleRoleMap[module as string];
  }, [user, module]);

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this module.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <React.Suspense fallback={<div>Loading...</div>}>
        {ModuleComponent && <ModuleComponent />}
      </React.Suspense>
    </AppLayout>
  );
}