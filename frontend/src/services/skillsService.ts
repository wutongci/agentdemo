import type { CommandInfo, SkillInfo, CommandsResponse, SkillsResponse } from '../types/skills';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 获取所有可用命令
 */
export async function fetchCommands(): Promise<CommandInfo[]> {
  const response = await fetch(`${API_BASE_URL}/skills/commands`);
  if (!response.ok) {
    throw new Error('Failed to fetch commands');
  }
  const data: CommandsResponse = await response.json();
  return data.commands;
}

/**
 * 获取单个命令详情
 */
export async function fetchCommand(name: string): Promise<CommandInfo> {
  const response = await fetch(`${API_BASE_URL}/skills/commands/${name}`);
  if (!response.ok) {
    throw new Error('Failed to fetch command');
  }
  return response.json();
}

/**
 * 获取所有可用技能
 */
export async function fetchSkills(): Promise<SkillInfo[]> {
  const response = await fetch(`${API_BASE_URL}/skills/skills`);
  if (!response.ok) {
    throw new Error('Failed to fetch skills');
  }
  const data: SkillsResponse = await response.json();
  return data.skills;
}

/**
 * 获取单个技能详情
 */
export async function fetchSkill(name: string): Promise<SkillInfo> {
  const response = await fetch(`${API_BASE_URL}/skills/skills/${name}`);
  if (!response.ok) {
    throw new Error('Failed to fetch skill');
  }
  return response.json();
}
