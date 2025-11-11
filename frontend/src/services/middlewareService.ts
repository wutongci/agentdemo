const API_BASE_URL = '/api';

export interface MiddlewareInfo {
  name: string;
  priority: number;
  description: string;
  tools: string[];
  status: 'active' | 'inactive';
}

export interface MiddlewareStatsResponse {
  middleware_name: string;
  call_count: number;
  total_duration_ms: number;
  avg_duration_ms: number;
  last_called: string;
  details: Record<string, any>;
}

export interface ToolInfo {
  name: string;
  description: string;
  category: string;
}

/**
 * 获取所有可用的 Middleware
 */
export const getAvailableMiddlewares = async (): Promise<MiddlewareInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/middleware`);
  if (!response.ok) throw new Error('Failed to fetch middlewares');
  const data = await response.json();
  return data.middlewares;
};

/**
 * 获取特定 Agent 的 Middleware 配置
 */
export const getAgentMiddlewares = async (agentId: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/middleware/agent/${agentId}`);
  if (!response.ok) throw new Error('Failed to fetch agent middlewares');
  const data = await response.json();
  return data.middlewares;
};

/**
 * 获取 Middleware 统计信息
 */
export const getMiddlewareStats = async (
  agentId: string
): Promise<MiddlewareStatsResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/middleware/agent/${agentId}/stats`);
  if (!response.ok) throw new Error('Failed to fetch middleware stats');
  const data = await response.json();
  return data.stats;
};

/**
 * 获取 Middleware 提供的工具列表
 */
export const getMiddlewareTools = async (
  middlewareName: string
): Promise<ToolInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/middleware/${middlewareName}/tools`);
  if (!response.ok) throw new Error('Failed to fetch middleware tools');
  const data = await response.json();
  return data.tools;
};
