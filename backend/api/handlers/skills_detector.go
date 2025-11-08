package handlers

import (
	"strings"

	"github.com/coso/agentdemo/backend/models"
)

// 定义 Skills 的触发关键词
var skillKeywords = map[string][]string{
	"best-practices": {"最佳实践", "best practice", "规范", "标准", "如何", "应该", "SOLID", "DRY", "KISS"},
	"code-quality":   {"质量", "quality", "重构", "refactor", "优化", "optimize", "复杂度", "complexity"},
	"security":       {"安全", "security", "漏洞", "vulnerability", "攻击", "认证", "授权", "OWASP"},
}

// DetectSlashCommand 检测是否是 Slash Command
func DetectSlashCommand(message string) *models.CommandExecutedData {
	message = strings.TrimSpace(message)
	if !strings.HasPrefix(message, "/") {
		return nil
	}

	// 提取命令名称和参数
	parts := strings.Fields(message)
	if len(parts) == 0 {
		return nil
	}

	commandName := strings.TrimPrefix(parts[0], "/")
	arguments := ""
	if len(parts) > 1 {
		arguments = strings.Join(parts[1:], " ")
	}

	return &models.CommandExecutedData{
		CommandName: commandName,
		Arguments:   arguments,
	}
}

// DetectActivatedSkills 检测可能激活的 Skills
func DetectActivatedSkills(message string) *models.SkillActivatedData {
	message = strings.ToLower(message)
	activatedSkills := make([]string, 0)

	// 检查每个 skill 的关键词
	for skillName, keywords := range skillKeywords {
		for _, keyword := range keywords {
			if strings.Contains(message, strings.ToLower(keyword)) {
				activatedSkills = append(activatedSkills, skillName)
				break // 找到一个关键词就足够了
			}
		}
	}

	if len(activatedSkills) == 0 {
		return nil
	}

	return &models.SkillActivatedData{
		SkillNames: activatedSkills,
		Trigger:    "keyword",
	}
}
