import { z } from 'zod'

// MCP Resource Types
export type Resource = {
  uri: string
  name: string
  description: string
  mimeType: string
}

// MCP Tool Types
export type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// Foundation Project Setup Types
export const SetupFoundationProjectSchema = z.object({
  projectName: z.string().min(1),
  orgId: z.string().min(1),
  billingAccount: z.string().min(1),
  region: z.string().min(1),
  githubIdentity: z.string().min(1),
  developerIdentity: z.string().min(1),
})

export type SetupFoundationProjectArgs = z.infer<
  typeof SetupFoundationProjectSchema
>

export type SetupFoundationProjectResult = {
  projectId: string
  serviceAccount: string
  workloadIdentityPool: string
  projectNumber?: string
  workloadIdentityProviders?: {
    dev?: string
    test?: string
    sbx?: string
    prod?: string
  }
  status: 'success' | 'failed'
  message: string
}

// Environment Configuration
export type EnvironmentConfig = {
  GCP_PROJECT_ID?: string
  GITHUB_TOKEN?: string
  GCP_REGION?: string
  GCP_ORG_ID?: string
  GCP_BILLING_ACCOUNT?: string
}

// Tool Registry
export type ToolRegistry = Map<string, Tool>
export type ResourceRegistry = Map<string, Resource>

// MCP Server Configuration
export type MCPServerConfig = {
  name: string
  version: string
  capabilities: {
    resources: Record<string, unknown>
    tools: Record<string, unknown>
    prompts: Record<string, unknown>
  }
}

export type DependencyCheckResult = {
  name: string
  present?: boolean
  installed?: boolean
  error?: string
}

export type CreateGitHubRepoResult = {
  status: 'success' | 'failed'
  message: string
  repoName?: string
  repoUrl?: string
  isPrivate?: boolean
  topics?: string[]
  error?: string
}

export type SetupGitHubSecretsResult = {
  status: 'success' | 'failed'
  message: string
  repoName: string
  results: Array<{
    name: string
    type: string
    status: string
    env?: string
    error?: string
  }>
  summary: {
    secretsCreated: number
    variablesCreated: number
    workflowsCreated: number
    totalItems: number
  }
  error?: string
}

export type InstallPrerequisitesResult = {
  summary: DependencyCheckResult[]
  message: string
}

export type CompleteProjectSetupResult = {
  status: 'success' | 'failed'
  message: string
  results: {
    step1: {
      status: string
      message: string
      details?: InstallPrerequisitesResult
    }
    step2: { status: string; message: string; details?: CreateGitHubRepoResult }
    step3: {
      status: string
      message: string
      details?: SetupFoundationProjectResult
    }
    step4: {
      status: string
      message: string
      details?: SetupGitHubSecretsResult
    }
  }
  summary?: {
    githubRepo?: string
    gcpProject?: string
    serviceAccount?: string
    secretsCreated?: number
    variablesCreated?: number
    workflowCreated?: number
  }
  error?: string
}
