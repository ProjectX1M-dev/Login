export interface LoginCredentials {
  username: string;
  password: string;
  server: string;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  accountNumber: string;
  accountName: string;
  serverName: string;
  leverage: number;
  profit: number;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}