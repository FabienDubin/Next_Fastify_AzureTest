// Authentication types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
