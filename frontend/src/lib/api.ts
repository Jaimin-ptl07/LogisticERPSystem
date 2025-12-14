// Client-side API helper functions

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  role_id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  login_attempts?: number;
  locked_until?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  tenant?: {
    id: string;
    name: string;
    domain?: string;
  };
}

class ApiHelper {
  // Get the stored token from localStorage and verify with cookies
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');

      if (!token) {
        return null;
      }

      // Verify token exists in cookie (server-side validation)
      const cookies = document.cookie.split(';');
      let cookieToken = null;
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
          cookieToken = value;
          break;
        }
      }

      // If token doesn't exist in cookie or doesn't match, logout
      if (!cookieToken || cookieToken !== token) {
        console.warn('Token validation failed: mismatch or missing cookie');
        this.logout();
        return null;
      }

      return token;
    }
    return null;
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // Make authenticated requests with automatic token refresh
  private async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the initial request
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401 Unauthorized, try to refresh the token
    if (response.status === 401 && !url.includes('/api/auth/me') && !url.includes('/api/auth/refresh')) {
      console.warn('Received 401 response, attempting to refresh token...');

      try {
        // Try to refresh the token
        const refreshed = await this.refreshToken();

        if (refreshed) {
          // Get the new token and retry the original request
          const newToken = this.getToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            console.log('Token refreshed successfully, retrying original request...');
            response = await fetch(url, {
              ...options,
              headers,
            });
          }
        } else {
          // Refresh failed, logout user
          console.error('Token refresh failed, logging out...');
          this.logout();
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        this.logout();
        window.location.href = '/login';
      }
    }

    return response;
  }

  // Refresh access token using refresh token
  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: LoginResponse = await response.json();

      // Store the new tokens
      this.setTokens(data.access_token, data.refresh_token);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await this.authenticatedFetch('/api/auth/me');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    return response.json();
  }

  // Logout
  logout(): void {
    if (typeof window !== 'undefined') {
      // Remove from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Remove from cookies
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }

  // Set both access and refresh tokens in localStorage and cookies
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      // Store in localStorage for client-side access
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      // Store access token in cookie for server-side middleware access
      // Set cookie to expire in 24 hours (same as JWT token)
      const expires = new Date();
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
      document.cookie = `access_token=${accessToken}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;

      // Store refresh token in cookie (httpOnly for security)
      const refreshExpires = new Date();
      refreshExpires.setTime(refreshExpires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      document.cookie = `refresh_token=${refreshToken}; expires=${refreshExpires.toUTCString()}; path=/; SameSite=Strict; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
    }
  }

  // Set token in both localStorage and cookies (for backward compatibility)
  setToken(token: string): void {
    console.warn('setToken is deprecated, use setTokens instead');
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        this.setTokens(token, refreshToken);
      } else {
        // Fallback to old behavior
        localStorage.setItem('access_token', token);
        const expires = new Date();
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
        document.cookie = `access_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
      }
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const api = new ApiHelper();