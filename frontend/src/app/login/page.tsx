import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { login } from '@/store/slices/authSlice';
import Button from '@/components/shared/ui/Button';
import Input from '@/components/shared/ui/Input';
import Card from '@/components/shared/ui/Card';
import Link from 'next/link';
import { Mail, Lock, Truck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = (router.query.redirect as string) || '/app';
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await dispatch(login(data)).unwrap();
    } catch (err) {
      // Error is handled by the slice
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              register for a new account
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              {...register('email')}
              label="Email address"
              type="email"
              placeholder="Enter your email"
              leftIcon={<Mail size={20} />}
              error={errors.email?.message}
              required
            />

            <Input
              {...register('password')}
              label="Password"
              type="password"
              placeholder="Enter your password"
              leftIcon={<Lock size={20} />}
              error={errors.password?.message}
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">Demo Accounts:</p>
            <div className="space-y-2">
              <div className="text-xs bg-gray-50 rounded p-2">
                <p className="font-semibold">Super Admin:</p>
                <p>admin@logistics.com / admin123</p>
              </div>
              <div className="text-xs bg-gray-50 rounded p-2">
                <p className="font-semibold">Company Admin:</p>
                <p>company@logistics.com / admin123</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}