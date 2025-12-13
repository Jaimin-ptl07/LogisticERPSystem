export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  branchId?: string;
  permissions: Permission[];
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  BRANCH_MANAGER = 'branch_manager',
  FINANCE_MANAGER = 'finance_manager',
  LOGISTICS_MANAGER = 'logistics_manager',
  DRIVER = 'driver'
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}