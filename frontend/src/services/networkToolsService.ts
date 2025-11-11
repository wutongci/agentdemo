import apiClient from './apiClient';

export interface HttpRequestParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface HttpRequestResponse {
  status_code: number;
  headers: Record<string, string>;
  body: string;
  content_type?: string;
  is_json?: boolean;
  json_data?: any;
}

export interface WebSearchParams {
  query: string;
  max_results?: number;
  topic?: 'general' | 'news' | 'finance';
  include_raw_content?: boolean;
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  raw_content?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  query: string;
}

/**
 * 执行 HTTP 请求（通过 Agent）
 */
export const executeHttpRequest = async (params: HttpRequestParams): Promise<HttpRequestResponse> => {
  // 通过创建临时 Agent 并发送消息来执行工具
  const sessionResponse = await apiClient.post<{ id: string }>('/sessions', {
    title: 'HTTP Request Test',
  });
  const sessionId = sessionResponse.data.id;

  try {
    // 构造工具调用消息
    const toolMessage = `请使用 http_request 工具执行以下请求：
URL: ${params.url}
Method: ${params.method || 'GET'}
${params.headers ? `Headers: ${JSON.stringify(params.headers)}` : ''}
${params.body ? `Body: ${params.body}` : ''}`;

    const response = await apiClient.post(`/sessions/${sessionId}/chat`, {
      message: toolMessage,
    });

    return response.data;
  } finally {
    // 清理会话
    await apiClient.delete(`/sessions/${sessionId}`).catch(() => {});
  }
};

/**
 * 执行 Web 搜索（通过 Agent）
 */
export const executeWebSearch = async (params: WebSearchParams): Promise<WebSearchResponse> => {
  // 通过创建临时 Agent 并发送消息来执行工具
  const sessionResponse = await apiClient.post<{ id: string }>('/sessions', {
    title: 'Web Search Test',
  });
  const sessionId = sessionResponse.data.id;

  try {
    // 构造工具调用消息
    const toolMessage = `请使用 web_search 工具搜索：
Query: ${params.query}
Max Results: ${params.max_results || 5}
Topic: ${params.topic || 'general'}
Include Raw Content: ${params.include_raw_content ? 'Yes' : 'No'}`;

    const response = await apiClient.post(`/sessions/${sessionId}/chat`, {
      message: toolMessage,
    });

    return response.data;
  } finally {
    // 清理会话
    await apiClient.delete(`/sessions/${sessionId}`).catch(() => {});
  }
};
