import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/store';
import LoadingSpinner from '@/components/shared/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect to appropriate dashboard based on role
        const roleToModule = {
          super_admin: '/app/super-admin',
          company_admin: '/app/company-admin',
          branch_manager: '/app/branch-manager',
          finance_manager: '/app/finance-manager',
          logistics_manager: '/app/logistics-manager',
          driver: '/app/driver',
        };

        const module = roleToModule[user.role as keyof typeof roleToModule];
        if (module) {
          router.push(module);
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text="Redirecting..." />
    </div>
  );
}