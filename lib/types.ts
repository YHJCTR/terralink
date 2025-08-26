export interface User {
  user_id: string;
  email?: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface ApiKey {
  id: string;
  public_id?: string;
  name?: string;
  label?: string;
  prefix?: string;
  key?: string; // Only shown once during creation
  key_preview?: string;
  is_active?: boolean;
  status?: string;
  created_at: string;
  last_used?: string;
  last_used_at?: string;
  permissions?: string[];
}

export interface Toolkit {
  id: string;
  name: string;
  description: string;
  version?: string;
  status?: string;
  updated_at?: string;
  tags?: string[];
  tools?: Tool[];
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string;
  parameters?: any;
  metadata?: any;
  toolkit: string;
  version?: string;
  category?: string;
  status?: string;
  requires_connection?: boolean;
}

export interface Connection {
  id: string;
  user_id: string;
  toolkit_id: number;
  name: string;
  enabled: boolean;
  status: 'valid' | 'invalid' | 'pending' | 'expired';
  priority: number;
  labels: Record<string, any>;
  last_used_at?: string;
  auth_method: 'none' | 'api_key' | 'oauth2' | 'basic';
  scopes?: string[];
  expires_at?: string;
  last_error?: string;
  mcp_transport?: string;
  mcp_endpoint_url?: string;
  mcp_protocol_version?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
