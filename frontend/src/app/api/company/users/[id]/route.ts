/**
 * Proxy API route for individual user operations
 * Forwards requests to the company service
 */
import { createApiRoute } from '@/utils/apiProxy'

// Get the company service URL from environment variables
const COMPANY_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

// Create the API route handler - dynamically handles the user ID in the path
// The [id] placeholder will be replaced with the actual user ID from the route params
export const GET = createApiRoute(COMPANY_API_URL, 'users/[id]/')
export const PUT = createApiRoute(COMPANY_API_URL, 'users/[id]/')
export const DELETE = createApiRoute(COMPANY_API_URL, 'users/[id]/')
