import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

export function NetworkTools() {
  // HTTP Request 状态
  const [httpUrl, setHttpUrl] = useState('https://api.github.com/repos/golang/go');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'>('GET');
  const [httpHeaders, setHttpHeaders] = useState('{"Accept": "application/vnd.github+json"}');
  const [httpBody, setHttpBody] = useState('');
  const [httpResponse, setHttpResponse] = useState<string>('');
  const [httpLoading, setHttpLoading] = useState(false);

  // Web Search 状态
  const [searchQuery, setSearchQuery] = useState('AgentSDK Phase 6 features');
  const [searchMaxResults, setSearchMaxResults] = useState(5);
  const [searchTopic, setSearchTopic] = useState<'general' | 'news' | 'finance'>('general');
  const [searchResponse, setSearchResponse] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleHttpRequest = async () => {
    setHttpLoading(true);
    setHttpResponse('正在执行 HTTP 请求...\n\n注意：网络工具已注册，但需要通过 Agent 调用。\n建议：在"简单对话"页面中直接与 AI 对话，让 AI 使用这些工具。');

    setTimeout(() => {
      setHttpLoading(false);
      setHttpResponse(`HTTP 请求工具演示

工具名称: http_request
状态: ✅ 已注册并可用

支持的 HTTP 方法:
• GET - 获取资源
• POST - 创建资源
• PUT - 更新资源
• DELETE - 删除资源
• PATCH - 部分更新
• HEAD - 获取元数据

特性:
✓ 自动 JSON 解析
✓ 自定义请求头
✓ 可配置超时（默认 30 秒）
✓ 完整的错误处理

使用方式：
在对话页面向 AI 说：
"请使用 http_request 工具访问 ${httpUrl}"

AI 会自动调用工具并返回结果！`);
    }, 1000);
  };

  const handleWebSearch = async () => {
    setSearchLoading(true);
    setSearchResponse('正在执行 Web 搜索...\n\n注意：需要配置 TAVILY_API_KEY 环境变量。');

    setTimeout(() => {
      setSearchLoading(false);
      setSearchResponse(`Web 搜索工具演示

工具名称: web_search
状态: ✅ 已注册（需要 API Key）

搜索引擎: Tavily API
主题类型:
• general - 通用搜索
• news - 新闻搜索
• finance - 财经搜索

配置方法:
1. 获取 Tavily API Key: https://tavily.com
2. 设置环境变量:
   export TAVILY_API_KEY="tvly-xxxxx"
   或
   export WF_TAVILY_API_KEY="tvly-xxxxx"

使用方式：
在对话页面向 AI 说：
"请使用 web_search 工具搜索：${searchQuery}"

AI 会自动调用 Tavily API 并返回搜索结果！

特性:
✓ 实时网络搜索
✓ 可配置结果数量（1-10）
✓ 支持不同主题类型
✓ 可选包含完整页面内容`);
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">网络工具演示</h1>
        <p className="text-muted-foreground">
          测试 AgentSDK Phase 6B-1 的网络工具功能（HTTP 请求 + Web 搜索）
        </p>
      </div>

      <Tabs defaultValue="http" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="http">
            🌐 HTTP Request
          </TabsTrigger>
          <TabsTrigger value="search">
            🔍 Web Search
          </TabsTrigger>
        </TabsList>

        {/* HTTP Request Tab */}
        <TabsContent value="http" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HTTP 请求工具</CardTitle>
              <CardDescription>
                执行 HTTP/HTTPS 请求到外部 API 和网站
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <Input
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">方法</label>
                <select
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as any)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                  <option value="HEAD">HEAD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">请求头（JSON 格式）</label>
                <Textarea
                  value={httpHeaders}
                  onChange={(e) => setHttpHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  rows={3}
                />
              </div>

              {(httpMethod === 'POST' || httpMethod === 'PUT' || httpMethod === 'PATCH') && (
                <div>
                  <label className="block text-sm font-medium mb-2">请求体</label>
                  <Textarea
                    value={httpBody}
                    onChange={(e) => setHttpBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              )}

              <Button
                onClick={handleHttpRequest}
                disabled={httpLoading}
                className="w-full"
              >
                {httpLoading ? '执行中...' : '执行 HTTP 请求'}
              </Button>

              {httpResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">响应</label>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                    {httpResponse}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* HTTP Request 示例 */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">💡 使用示例</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white dark:bg-gray-900 p-3 rounded">
                  <div className="font-medium mb-1">示例 1: 获取 GitHub 仓库信息</div>
                  <div className="text-muted-foreground">
                    在对话中说："请使用 http_request 工具获取 golang/go 仓库的信息"
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded">
                  <div className="font-medium mb-1">示例 2: POST 请求</div>
                  <div className="text-muted-foreground">
                    "请使用 http_request 工具向 https://api.example.com/data POST 这些数据：..."
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Web Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Web 搜索工具</CardTitle>
              <CardDescription>
                使用 Tavily API 进行实时网络搜索
                <Badge variant="outline" className="ml-2">需要 API Key</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">搜索查询</label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入搜索关键词..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">结果数量</label>
                  <Input
                    type="number"
                    value={searchMaxResults}
                    onChange={(e) => setSearchMaxResults(Number(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">主题类型</label>
                  <select
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value as any)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="general">通用搜索</option>
                    <option value="news">新闻搜索</option>
                    <option value="finance">财经搜索</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleWebSearch}
                disabled={searchLoading}
                className="w-full"
              >
                {searchLoading ? '搜索中...' : '执行 Web 搜索'}
              </Button>

              {searchResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">结果</label>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
                    {searchResponse}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Web Search 配置说明 */}
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">⚙️ 配置说明</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">1. 获取 Tavily API Key</div>
                  <div className="text-muted-foreground">
                    访问 <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tavily.com</a> 注册并获取免费 API Key
                  </div>
                </div>
                <div>
                  <div className="font-medium">2. 配置环境变量</div>
                  <div className="bg-white dark:bg-gray-900 p-2 rounded font-mono text-xs">
                    export TAVILY_API_KEY="tvly-xxxxx"
                  </div>
                </div>
                <div>
                  <div className="font-medium">3. 重启后端服务器</div>
                  <div className="text-muted-foreground">
                    配置后重启 backend 服务，工具将自动可用
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web Search 示例 */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">💡 使用示例</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white dark:bg-gray-900 p-3 rounded">
                  <div className="font-medium mb-1">示例 1: 搜索技术文档</div>
                  <div className="text-muted-foreground">
                    "请使用 web_search 搜索 'AgentSDK Phase 6 新功能'"
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded">
                  <div className="font-medium mb-1">示例 2: 搜索最新新闻</div>
                  <div className="text-muted-foreground">
                    "请用 web_search 工具（topic: news）搜索最新的 AI 新闻"
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 底部说明 */}
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">✨</div>
            <div>
              <h3 className="font-semibold mb-1">关于网络工具</h3>
              <p className="text-sm text-muted-foreground">
                这些工具由 AgentSDK Phase 6B-1 提供，已自动注册到工具注册表中。
                最佳使用方式是在对话页面中让 AI 自动调用这些工具，而不是手动测试。
                AI 会根据你的需求自动选择合适的工具并执行操作。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
