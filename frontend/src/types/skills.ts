export interface CommandInfo {
  name: string
  description: string
  argument_hint: string
  allowed_tools: string[]
}

export interface TriggerConfig {
  type: string
  keywords?: string[]
  condition?: string
}

export interface SkillInfo {
  name: string
  description: string
  allowed_tools: string[]
  triggers: TriggerConfig[]
}

export interface CommandsResponse {
  commands: CommandInfo[]
}

export interface SkillsResponse {
  skills: SkillInfo[]
}
