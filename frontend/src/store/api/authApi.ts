import { api } from '@/lib/api/config';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { LoginCredentials, AuthResponse, User } from '@/types/auth';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/auth`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    refreshToken: builder.mutation<AuthResponse, string>({
      query: (refreshToken) => ({
        url: '/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (data) => ({
        url: '/change-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;

// Export raw API functions for use in auth slice
export const authApiRaw = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};