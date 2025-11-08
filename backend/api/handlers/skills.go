package handlers

import (
	"bytes"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
)

// SkillsHandler Skills 处理器
type SkillsHandler struct {
	skillsPackagePath string
}

// NewSkillsHandler 创建 Skills 处理器
func NewSkillsHandler(skillsPackagePath string) *SkillsHandler {
	return &SkillsHandler{
		skillsPackagePath: skillsPackagePath,
	}
}

// CommandInfo 命令信息
type CommandInfo struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	ArgumentHint string   `json:"argument_hint"`
	AllowedTools []string `json:"allowed_tools"`
}

// SkillInfo 技能信息
type SkillInfo struct {
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	AllowedTools []string        `json:"allowed_tools"`
	Triggers     []TriggerConfig `json:"triggers"`
}

// TriggerConfig 触发配置
type TriggerConfig struct {
	Type      string   `json:"type"`
	Keywords  []string `json:"keywords,omitempty"`
	Condition string   `json:"condition,omitempty"`
}

// commandFrontmatter 命令 frontmatter 结构
type commandFrontmatter struct {
	Description  string   `yaml:"description"`
	ArgumentHint string   `yaml:"argument-hint"`
	AllowedTools []string `yaml:"allowed-tools"`
}

// skillFrontmatter 技能 frontmatter 结构
type skillFrontmatter struct {
	Name         string `yaml:"name"`
	Description  string `yaml:"description"`
	AllowedTools []string `yaml:"allowed-tools"`
	Triggers     []struct {
		Type      string   `yaml:"type"`
		Keywords  []string `yaml:"keywords,omitempty"`
		Condition string   `yaml:"condition,omitempty"`
	} `yaml:"triggers"`
}

// ListCommands 列出所有可用命令
// GET /api/skills/commands
func (h *SkillsHandler) ListCommands(c *gin.Context) {
	commandsDir := filepath.Join(h.skillsPackagePath, "commands")

	// 读取 commands 目录
	files, err := os.ReadDir(commandsDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("读取命令目录失败: %v", err)})
		return
	}

	commands := make([]CommandInfo, 0)
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".md") {
			continue
		}

		// 获取命令名称（去掉 .md 后缀）
		name := strings.TrimSuffix(file.Name(), ".md")

		// 读取文件内容
		content, err := os.ReadFile(filepath.Join(commandsDir, file.Name()))
		if err != nil {
			continue
		}

		// 解析 frontmatter
		info := parseCommandFile(name, content)
		commands = append(commands, info)
	}

	c.JSON(http.StatusOK, gin.H{"commands": commands})
}

// GetCommand 获取单个命令详情
// GET /api/skills/commands/:name
func (h *SkillsHandler) GetCommand(c *gin.Context) {
	commandName := c.Param("name")
	commandPath := filepath.Join(h.skillsPackagePath, "commands", commandName+".md")

	// 读取文件
	content, err := os.ReadFile(commandPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "命令不存在"})
		return
	}

	// 解析并返回
	info := parseCommandFile(commandName, content)
	c.JSON(http.StatusOK, info)
}

// ListSkills 列出所有可用技能
// GET /api/skills/skills
func (h *SkillsHandler) ListSkills(c *gin.Context) {
	skillsDir := filepath.Join(h.skillsPackagePath, "skills")

	skills := make([]SkillInfo, 0)

	// 遍历 skills 目录（包括子目录）
	err := filepath.WalkDir(skillsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// 只处理 SKILL.md 文件
		if d.IsDir() || d.Name() != "SKILL.md" {
			return nil
		}

		// 读取文件内容
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}

		// 解析 frontmatter
		info := parseSkillFile(content)
		if info.Name != "" {
			skills = append(skills, info)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("读取技能目录失败: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"skills": skills})
}

// GetSkill 获取单个技能详情
// GET /api/skills/skills/:name
func (h *SkillsHandler) GetSkill(c *gin.Context) {
	skillName := c.Param("name")
	skillsDir := filepath.Join(h.skillsPackagePath, "skills")

	// 查找技能文件
	var skillPath string
	err := filepath.WalkDir(skillsDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() || d.Name() != "SKILL.md" {
			return nil
		}

		// 读取文件查看是否是目标技能
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}

		info := parseSkillFile(content)
		if info.Name == skillName {
			skillPath = path
			return filepath.SkipAll
		}

		return nil
	})

	if err != nil || skillPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "技能不存在"})
		return
	}

	// 读取并解析技能文件
	content, _ := os.ReadFile(skillPath)
	info := parseSkillFile(content)
	c.JSON(http.StatusOK, info)
}

// parseCommandFile 解析命令文件
func parseCommandFile(name string, content []byte) CommandInfo {
	frontmatter, _ := extractFrontmatter(content)

	var fm commandFrontmatter
	_ = yaml.Unmarshal(frontmatter, &fm)

	return CommandInfo{
		Name:         name,
		Description:  fm.Description,
		ArgumentHint: fm.ArgumentHint,
		AllowedTools: fm.AllowedTools,
	}
}

// parseSkillFile 解析技能文件
func parseSkillFile(content []byte) SkillInfo {
	frontmatter, _ := extractFrontmatter(content)

	var fm skillFrontmatter
	_ = yaml.Unmarshal(frontmatter, &fm)

	triggers := make([]TriggerConfig, 0, len(fm.Triggers))
	for _, t := range fm.Triggers {
		triggers = append(triggers, TriggerConfig{
			Type:      t.Type,
			Keywords:  t.Keywords,
			Condition: t.Condition,
		})
	}

	return SkillInfo{
		Name:         fm.Name,
		Description:  fm.Description,
		AllowedTools: fm.AllowedTools,
		Triggers:     triggers,
	}
}

// extractFrontmatter 从 markdown 文件中提取 frontmatter
func extractFrontmatter(content []byte) ([]byte, []byte) {
	// 查找 frontmatter 的开始和结束标记
	lines := bytes.Split(content, []byte("\n"))

	if len(lines) < 3 {
		return nil, content
	}

	// 检查第一行是否是 "---"
	if !bytes.Equal(bytes.TrimSpace(lines[0]), []byte("---")) {
		return nil, content
	}

	// 查找第二个 "---"
	for i := 1; i < len(lines); i++ {
		if bytes.Equal(bytes.TrimSpace(lines[i]), []byte("---")) {
			// 找到了结束标记
			frontmatter := bytes.Join(lines[1:i], []byte("\n"))
			markdown := bytes.Join(lines[i+1:], []byte("\n"))
			return frontmatter, markdown
		}
	}

	return nil, content
}
