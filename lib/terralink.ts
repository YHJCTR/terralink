const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "ef_session";
function getAuthTokenClient(): string | undefined {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${JWT_COOKIE_NAME}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return undefined;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthTokenClient();
  const r = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || data?.detail || r.statusText);
  return data as T;
}

// Type definitions
interface OAuthProvider {
  id: number;
  name: string;
  display_name: string;
  client_id: string;
  is_active: boolean;
}

interface OAuthAuthResponse {
  auth_url: string;
  state: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    user_id: string;
    email: string;
    is_active: boolean;
    created_at: string;
  };
}

interface UserOAuthAccount {
  id: number;
  provider_name: string;
  provider_display_name: string;
  oauth_user_id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  is_primary: boolean;
  created_at: string;
}

// Connection related types
interface Connection {
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

interface ConnectionCreateRequest {
  name: string;
  auth_method: 'none' | 'api_key' | 'oauth2' | 'basic';
  credentials?: Record<string, any>;
  scopes?: string[];
  labels?: Record<string, any>;
}

interface ConnectionOAuth2StartRequest {
  name: string;
  redirect_uri?: string;
  scopes?: string[];
  labels?: Record<string, any>;
}

interface ConnectionOAuth2StartResponse {
  connection_id: string;
  auth_url: string;
  state: string;
}

// Tool related types
interface ToolDefinition {
  tool_key: string;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  default_enabled: boolean;
  default_config: Record<string, any>;
  required_scopes?: string[];
  version?: string;
  digest: string;
}

interface ToolOverride {
  id: number;
  connection_id: string;
  tool_key: string;
  enabled: boolean;
  config: Record<string, any>;
  tool_version?: string;
  resolved_digest?: string;
  is_stale: boolean;
}

interface ToolOverrideRequest {
  enabled: boolean;
  config?: Record<string, any>;
}

interface EffectiveTool {
  tool_key: string;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  enabled: boolean;
  config: Record<string, any>;
  required_scopes?: string[];
  version?: string;
  digest: string;
  is_stale: boolean;
}

interface EffectiveToolsResponse {
  connection_id: string;
  toolkit_key: string;
  tools: EffectiveTool[];
  total_count: number;
  enabled_count: number;
  disabled_count: number;
}

export const TL = {
  // auth - 基础认证
  login: (email: string, password: string) =>
    api<TokenResponse>("/api/proxy/v1/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) =>
    api("/api/proxy/v1/register", { method: "POST", body: JSON.stringify({ email, password }) }),

  // OAuth认证
  getOAuthProviders: () => api<OAuthProvider[]>("/api/proxy/v1/oauth/providers"),
  initiateOAuth: (provider: string, redirect_uri?: string) =>
    api<OAuthAuthResponse>("/api/proxy/v1/oauth/auth", { 
      method: "POST", 
      body: JSON.stringify({ provider, redirect_uri }) 
    }),
  handleOAuthCallback: (provider: string, code: string, state?: string) =>
    api<TokenResponse>("/api/proxy/v1/oauth/callback", {
      method: "POST",
      body: JSON.stringify({ provider, code, state })
    }),
  
  // OAuth账户管理
  listOAuthAccounts: () => api<UserOAuthAccount[]>("/api/proxy/v1/gui/oauth/accounts"),
  removeOAuthAccount: (accountId: number) => 
    api(`/api/proxy/v1/gui/oauth/accounts/${accountId}`, { method: "DELETE" }),

  // user info（从平台用 Bearer 获取）
  me: () => api<{ user_id: string }>("/api/proxy/v1/gui/me"),

  // api keys - GUI版本
  listApiKeys: () => api<any[]>("/api/proxy/v1/gui/api-keys"),
  createApiKey: (label?: string, prefix: "live"|"test"="live") =>
    api("/api/proxy/v1/gui/api-keys", { method: "POST", body: JSON.stringify({ label, prefix }) }),
  revokeApiKey: (id: number) => api(`/api/proxy/v1/gui/api-keys/${id}`, { method: "DELETE" }),
  removeApiKey: (id: number) => api(`/api/proxy/v1/gui/api-keys/${id}/remove`, { method: "DELETE" }),

  // toolkits - GUI版本
  listToolkits: () => api<any[]>("/api/proxy/v1/gui/toolkits"),
  
  // tools - GUI版本
  listTools: (toolkit?: string) => {
    const params = toolkit ? `?toolkit=${encodeURIComponent(toolkit)}` : "";
    return api<any[]>(`/api/proxy/v1/gui/tools${params}`);
  },
  getToolDetail: (toolSlug: string) => api(`/api/proxy/v1/gui/tools/${encodeURIComponent(toolSlug)}`),
  executeTool: (toolSlug: string, args: any, context?: any) =>
    api(`/api/proxy/v1/gui/tools/${encodeURIComponent(toolSlug)}/execute`, {
      method: "POST",
      body: JSON.stringify({ inputs: args, metadata: context })
    }),
  
  // connections - GUI版本（基于后端实际实现的端点）
  // 获取工具包的连接列表
  getToolkitConnections: (toolkitKey: string) =>
    api<Connection[]>(`/api/proxy/v1/gui/toolkits/${encodeURIComponent(toolkitKey)}/connections`),
  
  // 创建新连接
  createConnection: (toolkitKey: string, request: ConnectionCreateRequest) =>
    api<Connection>(`/api/proxy/v1/gui/toolkits/${encodeURIComponent(toolkitKey)}/connections`, {
      method: "POST",
      body: JSON.stringify(request)
    }),
  
  // 获取连接的有效工具列表
  getConnectionTools: (connectionId: string, includeDisabled: boolean = false) =>
    api<EffectiveToolsResponse>(`/api/proxy/v1/gui/connections/${encodeURIComponent(connectionId)}/tools?include_disabled=${includeDisabled}`),
  
  // SDK版本的API（用于完整功能）
  // 开始OAuth2流程
  startOAuth2Flow: (toolkitKey: string, request: ConnectionOAuth2StartRequest) =>
    api<ConnectionOAuth2StartResponse>(`/api/proxy/v1/sdk/toolkits/${encodeURIComponent(toolkitKey)}/connections/oauth2-start`, {
      method: "POST",
      body: JSON.stringify(request)
    }),
  
  // 获取特定连接
  getConnection: (connectionId: string) =>
    api<Connection>(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}`),
  
  // 更新连接
  updateConnection: (connectionId: string, request: Partial<ConnectionCreateRequest>) =>
    api<Connection>(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}`, {
      method: "PATCH",
      body: JSON.stringify(request)
    }),
  
  // 删除连接
  deleteConnection: (connectionId: string) =>
    api(`/api/proxy/v1/gui/connections/${encodeURIComponent(connectionId)}`, { method: "DELETE" }),
  
  // 设置工具覆盖（启用/禁用工具）
  setToolOverride: (connectionId: string, toolKey: string, request: ToolOverrideRequest) =>
    api<ToolOverride>(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}/tools/${encodeURIComponent(toolKey)}`, {
      method: "PATCH",
      body: JSON.stringify(request)
    }),
  
  // 删除工具覆盖
  deleteToolOverride: (connectionId: string, toolKey: string) =>
    api(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}/tools/${encodeURIComponent(toolKey)}`, {
      method: "DELETE"
    }),
  
  // 获取工具包的工具定义
  getToolkitTools: (toolkitKey: string) =>
    api<ToolDefinition[]>(`/api/proxy/v1/sdk/toolkits/${encodeURIComponent(toolkitKey)}/tools`),
  
  // 测试连接
  testConnection: (connectionId: string) =>
    api(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}/test`, { method: "POST" }),
  
  // 刷新连接
  refreshConnection: (connectionId: string) =>
    api(`/api/proxy/v1/sdk/connections/${encodeURIComponent(connectionId)}/refresh`, { method: "POST" }),
  
  // 旧的API保持兼容性（标记为废弃）
  /** @deprecated 使用 getToolkitConnections 替代 */
  listAccounts: (user_id: string, toolkit?: string) =>
    api(`/api/proxy/v1/gui/auth/connected-accounts?user_id=${user_id}${toolkit ? `&toolkit=${toolkit}` : ""}`),
  /** @deprecated 使用 deleteConnection 替代 */
  revokeAccount: (id: string|number) =>
    api(`/api/proxy/v1/gui/auth/connected-accounts/${id}`, { method: "DELETE" }),

  // Analytics API
  getToolExecutionHistory: (params?: {
    page?: number;
    page_size?: number;
    toolkit_name?: string;
    tool_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api(`/api/proxy/v1/gui/analytics/executions?${searchParams.toString()}`);
  },

  getToolExecutionDetail: (executionId: string) =>
    api(`/api/proxy/v1/gui/analytics/executions/${encodeURIComponent(executionId)}`),

  getUserToolStats: (params?: {
    start_date?: string;
    end_date?: string;
    toolkit_name?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api(`/api/proxy/v1/analytics/user-tool-stats?${searchParams.toString()}`);
  },
};
