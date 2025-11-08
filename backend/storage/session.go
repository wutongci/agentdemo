package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"

	"github.com/coso/agentdemo/backend/models"
)

const sessionsFile = ".agentsdk/sessions.json"

// SessionStore 会话存储
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*models.Session
	filePath string
}

// NewSessionStore 创建会话存储
func NewSessionStore() (*SessionStore, error) {
	store := &SessionStore{
		sessions: make(map[string]*models.Session),
		filePath: sessionsFile,
	}

	// 确保目录存在
	dir := filepath.Dir(sessionsFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create sessions directory: %w", err)
	}

	// 加载现有会话
	if err := store.load(); err != nil {
		// 如果文件不存在，忽略错误
		if !os.IsNotExist(err) {
			return nil, err
		}
	}

	return store, nil
}

// Create 创建新会话
func (s *SessionStore) Create(session *models.Session) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session.CreatedAt = time.Now()
	session.UpdatedAt = time.Now()
	s.sessions[session.ID] = session

	return s.save()
}

// Get 获取会话
func (s *SessionStore) Get(id string) (*models.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, ok := s.sessions[id]
	if !ok {
		return nil, fmt.Errorf("session not found: %s", id)
	}

	// 向后兼容：为旧会话设置默认 AgentType
	if session.AgentType == "" {
		session.AgentType = "simple-chat"
	}

	return session, nil
}

// List 列出所有会话
func (s *SessionStore) List() ([]*models.Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*models.Session, 0, len(s.sessions))
	for _, session := range s.sessions {
		sessions = append(sessions, session)
	}

	// 按更新时间倒序排序
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].UpdatedAt.After(sessions[j].UpdatedAt)
	})

	return sessions, nil
}

// Update 更新会话
func (s *SessionStore) Update(session *models.Session) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.sessions[session.ID]; !ok {
		return fmt.Errorf("session not found: %s", session.ID)
	}

	session.UpdatedAt = time.Now()
	s.sessions[session.ID] = session

	return s.save()
}

// Delete 删除会话
func (s *SessionStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.sessions[id]; !ok {
		return fmt.Errorf("session not found: %s", id)
	}

	delete(s.sessions, id)

	return s.save()
}

// load 从文件加载会话
func (s *SessionStore) load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}

	var sessions []*models.Session
	if err := json.Unmarshal(data, &sessions); err != nil {
		return fmt.Errorf("unmarshal sessions: %w", err)
	}

	for _, session := range sessions {
		s.sessions[session.ID] = session
	}

	return nil
}

// save 保存会话到文件
func (s *SessionStore) save() error {
	sessions := make([]*models.Session, 0, len(s.sessions))
	for _, session := range s.sessions {
		sessions = append(sessions, session)
	}

	data, err := json.MarshalIndent(sessions, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal sessions: %w", err)
	}

	return os.WriteFile(s.filePath, data, 0644)
}
