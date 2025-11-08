#!/bin/bash

# 检查 ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY environment variable is not set"
    echo "Please run: export ANTHROPIC_API_KEY='your-api-key'"
    exit 1
fi

echo "Starting backend server..."
cd backend
go run main.go

