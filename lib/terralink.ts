async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init.headers||{}) }});
  const data = await r.json().catch(()=> ({}));
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
  
  // connections - GUI版本
  createConnection: (toolkit: string, user_id: string) =>
    api("/api/proxy/v1/gui/auth/connections", { method: "POST", body: JSON.stringify({ toolkit, user_id }) }),
  pollConnection: (id: string) => api(`/api/proxy/v1/gui/auth/connections/${id}`),
  listAccounts: (user_id: string, toolkit?: string) =>
    api(`/api/proxy/v1/gui/auth/connected-accounts?user_id=${user_id}${toolkit ? `&toolkit=${toolkit}` : ""}`),
  revokeAccount: (id: string|number) =>
    api(`/api/proxy/v1/gui/auth/connected-accounts/${id}`, { method: "DELETE" }),
};
