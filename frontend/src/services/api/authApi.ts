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

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQuery,
  tagTypes: ['AuthUser'],
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
  }),
})

export const {
  useCreateAuthUserMutation,
} = authApi