#!/bin/bash

# 实时监控后端日志

echo "=========================================="
echo "实时监控后端日志 (按 Ctrl+C 退出)"
echo "=========================================="
echo ""

tail -f /tmp/backend_debug.log | grep -E "\[(WorkflowHandler|WorkflowOrchestrator|PoolManager|executeWorkflow|executeResearchStage|executeWritingStage|executeEditingStage)\]" --color=always

