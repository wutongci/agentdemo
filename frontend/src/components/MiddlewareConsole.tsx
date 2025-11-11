import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAvailableMiddlewares,
  getMiddlewareTools,
  type MiddlewareInfo,
  type ToolInfo,
} from '../services/middlewareService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function MiddlewareConsole() {
  const [selectedMiddleware, setSelectedMiddleware] = useState<string | null>(null);

  // 获取所有可用的 Middleware
  const { data: middlewares, isLoading } = useQuery<MiddlewareInfo[]>({
    queryKey: ['middlewares'],
    queryFn: getAvailableMiddlewares,
  });

  // 获取选中 Middleware 的工具列表
  const { data: tools } = useQuery<ToolInfo[]>({
    queryKey: ['middleware-tools', selectedMiddleware],
    queryFn: () => getMiddlewareTools(selectedMiddleware!),
    enabled: !!selectedMiddleware,
  });

  // 默认选中第一个 Middleware
  useEffect(() => {
    if (middlewares && middlewares.length > 0 && !selectedMiddleware) {
      setSelectedMiddleware(middlewares[0].name);
    }
  }, [middlewares, selectedMiddleware]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Middleware 控制台</h1>
        <p className="text-muted-foreground">
          管理和监控 AgentSDK 的 Middleware 系统（Phase 6C 新功能）
        </p>
      </div>

      <Tabs value={selectedMiddleware || ''} onValueChange={setSelectedMiddleware}>
        <TabsList className="grid w-full grid-cols-3">
          {middlewares?.map((mw) => (
            <TabsTrigger key={mw.name} value={mw.name}>
              {mw.name}
              <Badge
                variant={mw.status === 'active' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {mw.status === 'active' ? '启用' : '未启用'}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {middlewares?.map((mw) => (
          <TabsContent key={mw.name} value={mw.name} className="space-y-4">
            {/* Middleware 概览卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{mw.name}</CardTitle>
                    <CardDescription className="mt-2">{mw.description}</CardDescription>
                  </div>
                  <Badge
                    variant={mw.status === 'active' ? 'default' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    优先级: {mw.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">状态</div>
                    <div className="font-medium">
                      {mw.status === 'active' ? '✅ 已启用' : '⏸️ 未启用'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">提供工具</div>
                    <div className="font-medium">
                      {mw.tools.length > 0 ? `${mw.tools.length} 个工具` : '无工具（纯处理型）'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 工具列表 */}
            {tools && tools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>工具列表</CardTitle>
                  <CardDescription>
                    该 Middleware 提供的所有工具
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>工具名称</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>分类</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tools.map((tool) => (
                        <TableRow key={tool.name}>
                          <TableCell className="font-mono font-medium">
                            {tool.name}
                          </TableCell>
                          <TableCell>{tool.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tool.category}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 功能说明卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>功能说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mw.name === 'summarization' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">自动总结长对话</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>当对话历史超过 170,000 tokens 时自动触发</li>
                        <li>保留最近 6 条消息</li>
                        <li>将旧消息总结为简洁的摘要</li>
                        <li>节省 token 成本并保持上下文连贯性</li>
                      </ul>
                    </div>
                  )}
                  {mw.name === 'filesystem' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">文件系统操作</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>提供 6 个强大的文件系统工具</li>
                        <li>支持读取、写入、编辑、搜索文件</li>
                        <li>自动驱逐大结果（超过 20k tokens）</li>
                        <li>使用 Glob 模式匹配文件（如 **/*.go）</li>
                      </ul>
                    </div>
                  )}
                  {mw.name === 'subagent' && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">子代理任务委托</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>将复杂任务委托给专门的子代理</li>
                        <li>支持并行执行多个任务</li>
                        <li>提供上下文隔离和独立执行环境</li>
                        <li>适合研究、编码、审查等专业任务</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 使用示例 */}
            {mw.name === 'filesystem' && tools && tools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>使用示例</CardTitle>
                  <CardDescription>如何在对话中使用这些工具</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm font-medium mb-2">示例对话：</div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">用户：</span>
                          "请搜索项目中所有包含 'TODO' 的 Go 文件"
                        </div>
                        <div>
                          <span className="font-medium">AI：</span>
                          [使用 fs_glob 找到所有 .go 文件，然后使用 fs_grep 搜索 'TODO']
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 底部说明 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold mb-1">关于 Middleware 系统</h3>
              <p className="text-sm text-muted-foreground">
                Middleware 采用洋葱模型架构，可以在模型调用和工具执行的前后进行拦截和处理。
                每个 Middleware 都有优先级（数值越小越先执行），可以灵活组合使用。
                这是 AgentSDK Phase 6C 引入的核心功能，极大提升了系统的可扩展性。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
