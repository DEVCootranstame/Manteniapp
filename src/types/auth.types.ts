export type UserRole = 'admin' | 'supervisor' | 'gestor' | 'tecnico';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  agencia_id: number;
  agencia?: { id: number; nombre: string; codigo?: string };
  role: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
