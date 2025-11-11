import apiClient from './apiClient';

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
  const response = await apiClient.get<{
    middlewares: MiddlewareInfo[];
    total: number;
  }>('/middleware');
  return response.data.middlewares;
};

/**
 * 获取特定 Agent 的 Middleware 配置
 */
export const getAgentMiddlewares = async (agentId: string): Promise<string[]> => {
  const response = await apiClient.get<{
    agent_id: string;
    middlewares: string[];
  }>(`/middleware/agent/${agentId}`);
  return response.data.middlewares;
};

/**
 * 获取 Middleware 统计信息
 */
export const getMiddlewareStats = async (
  agentId: string
): Promise<MiddlewareStatsResponse[]> => {
  const response = await apiClient.get<{
    agent_id: string;
    stats: MiddlewareStatsResponse[];
  }>(`/middleware/agent/${agentId}/stats`);
  return response.data.stats;
};

/**
 * 获取 Middleware 提供的工具列表
 */
export const getMiddlewareTools = async (
  middlewareName: string
): Promise<ToolInfo[]> => {
  const response = await apiClient.get<{
    middleware: string;
    tools: ToolInfo[];
    total: number;
  }>(`/middleware/${middlewareName}/tools`);
  return response.data.tools;
};
