#!/bin/bash
# 测试 GLM 4.6 API 接口

API_KEY="${GLM_API_KEY:-your_api_key}"
MODEL="${MODEL:-glm-4}"

echo "Testing GLM API with model: $MODEL"
echo "API Key: ${API_KEY:0:10}..."

curl -X POST https://open.bigmodel.cn/api/paas/v4/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "'"$MODEL"'",
    "messages": [
      {
        "role": "user",
        "content": "Write Hello World to test.txt using fs_write tool."
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "fs_write",
          "description": "Write content to a file",
          "parameters": {
            "type": "object",
            "properties": {
              "path": {"type": "string", "description": "Path to the file"},
              "content": {"type": "string", "description": "Content to write"}
            },
            "required": ["path", "content"]
          }
        }
      }
    ],
    "stream": true,
    "max_tokens": 1024
  }' 2>&1 | head -30
