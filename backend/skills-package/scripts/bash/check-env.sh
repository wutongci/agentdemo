#!/bin/bash

# 环境检查脚本
# 用于在执行命令前检查环境状态

echo "=== 环境检查 ==="

# 检查当前目录
echo "当前工作目录: $(pwd)"

# 检查 Go 版本（如果需要）
if command -v go &> /dev/null; then
    echo "Go 版本: $(go version)"
else
    echo "警告: 未找到 Go"
fi

# 检查文件数量
file_count=$(find . -type f | wc -l)
echo "工作目录文件数: $file_count"

# 检查可用磁盘空间
if command -v df &> /dev/null; then
    echo "磁盘空间: $(df -h . | tail -1 | awk '{print $4}') 可用"
fi

echo "=== 检查完成 ==="
exit 0
