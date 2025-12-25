import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from './baseApi'

// Types for auth service
export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  tenant_id: string
  role_id?: number
  is_active: boolean
  is_superuser: boolean
  last_login?: string
  created_at: string
}

export interface AuthUserCreate {
  email: string
  password: string
  first_name: string
  last_name: string
  tenant_id?: string
  role_id?: number
  is_superuser?: boolean
}

export interface AuthRole {
  id: number
  name: string
  description?: string
  is_system: boolean
  tenant_id: string
  created_at: string
  updated_at?: string
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQuery,
  tagTypes: ['AuthUser', 'AuthRole'],
  endpoints: (builder) => ({
    // Create auth user
    createAuthUser: builder.mutation<AuthUser, AuthUserCreate>({
      query: (userData) => ({
        url: 'auth/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['AuthUser'],
    }),

    // Get all roles for the current tenant
    getRoles: builder.query<AuthRole[], void>({
      query: () => ({
        url: 'auth/v1/roles',  // Fixed: use v1 path to match auth service route
        method: 'GET',
      }),
      providesTags: ['AuthRole'],
    }),
  }),
})

export const {
  useCreateAuthUserMutation,
  useGetRolesQuery,
} = authApi
