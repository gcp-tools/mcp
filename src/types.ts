import { z } from 'zod';

// MCP Resource Types
export type Resource = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
};

// MCP Tool Types
export type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
};

// Foundation Project Setup Types
export const SetupFoundationProjectSchema = z.object({
  projectName: z.string().min(1),
  orgId: z.string().min(1),
  billingAccount: z.string().min(1),
  region: z.string().min(1),
  githubIdentity: z.string().min(1),
  developerIdentity: z.string().min(1),
});

export type SetupFoundationProjectArgs = z.infer<typeof SetupFoundationProjectSchema>;

export type SetupFoundationProjectResult = {
  projectId: string;
  serviceAccount: string;
  workloadIdentityPool: string;
  status: 'success' | 'failed';
  message: string;
};

// Project Scaffolding Types
export const ScaffoldProjectSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().min(1),
  template: z.enum(['basic', 'full', 'microservices']),
  languages: z.array(z.enum(['typescript', 'rust', 'python'])),
  services: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['api', 'worker', 'function']),
    language: z.enum(['typescript', 'rust', 'python']),
  })).optional(),
});

export type ScaffoldProjectArgs = z.infer<typeof ScaffoldProjectSchema>;

export const ProjectFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export type ProjectFile = z.infer<typeof ProjectFileSchema>;

export type ProjectStructure = {
  files: ProjectFile[];
  directories: string[];
};

export type ScaffoldProjectResult = {
  projectStructure: ProjectStructure;
  status: 'created' | 'failed';
  message: string;
};

// GitHub Integration Types
export const CreateGitHubRepositorySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  isPrivate: z.boolean(),
  orgName: z.string().optional(),
  autoInit: z.boolean(),
});

export type CreateGitHubRepositoryArgs = z.infer<typeof CreateGitHubRepositorySchema>;

export type CreateGitHubRepositoryResult = {
  repositoryUrl: string;
  repositoryId: string;
  status: 'created' | 'failed';
  message: string;
};

export const SetupGitHubSecretsSchema = z.object({
  repository: z.string().min(1),
  secrets: z.record(z.string()),
  environmentVariables: z.record(z.string()),
  environments: z.array(z.string()),
});

export type SetupGitHubSecretsArgs = z.infer<typeof SetupGitHubSecretsSchema>;

export type SetupGitHubSecretsResult = {
  secretsConfigured: string[];
  environmentsConfigured: string[];
  status: 'success' | 'failed';
  message: string;
};

export const PushToGitHubSchema = z.object({
  repository: z.string().min(1),
  branch: z.string().min(1),
  files: z.array(ProjectFileSchema),
  commitMessage: z.string().min(1),
});

export type PushToGitHubArgs = z.infer<typeof PushToGitHubSchema>;

export type PushToGitHubResult = {
  commitSha: string;
  branch: string;
  status: 'pushed' | 'failed';
  message: string;
};

// Service Development Types
export const CreateServiceSchema = z.object({
  serviceName: z.string().min(1),
  language: z.enum(['typescript', 'rust', 'python']),
  type: z.enum(['api', 'worker', 'function']),
  requirements: z.object({
    endpoints: z.array(z.object({
      path: z.string().min(1),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      description: z.string().min(1),
    })).optional(),
    database: z.enum(['firestore', 'sql']).optional(),
    authentication: z.boolean().optional(),
    validation: z.boolean().optional(),
  }),
});

export type CreateServiceArgs = z.infer<typeof CreateServiceSchema>;

export type CreateServiceResult = {
  serviceFiles: ProjectFile[];
  status: 'created' | 'failed';
  message: string;
};

export const ConfigureInfrastructureSchema = z.object({
  serviceName: z.string().min(1),
  infrastructureType: z.enum(['app', 'ingress']),
  config: z.object({
    runtime: z.string().min(1),
    memory: z.string().min(1),
    cpu: z.string().min(1),
    minScale: z.number().min(0),
    maxScale: z.number().min(1),
    environment: z.record(z.string()),
    secrets: z.array(z.string()),
  }),
});

export type ConfigureInfrastructureArgs = z.infer<typeof ConfigureInfrastructureSchema>;

export type ConfigureInfrastructureResult = {
  infrastructureFiles: ProjectFile[];
  status: 'configured' | 'failed';
  message: string;
};

// Deployment and Monitoring Types
export const DeployServicesSchema = z.object({
  repository: z.string().min(1),
  services: z.array(z.string()),
  environment: z.enum(['dev', 'test', 'sbx', 'prod']),
  commitMessage: z.string().min(1),
});

export type DeployServicesArgs = z.infer<typeof DeployServicesSchema>;

export type DeployServicesResult = {
  deploymentId: string;
  workflowRunId: string;
  status: 'triggered' | 'failed';
  message: string;
};

export const MonitorDeploymentSchema = z.object({
  repository: z.string().min(1),
  workflowRunId: z.string().min(1),
  deploymentId: z.string().optional(),
});

export type MonitorDeploymentArgs = z.infer<typeof MonitorDeploymentSchema>;

export type DeploymentLog = {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
};

export type ServiceStatus = {
  name: string;
  status: string;
  url?: string;
};

export type MonitorDeploymentResult = {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  logs: DeploymentLog[];
  services: ServiceStatus[];
};

export const FixDeploymentIssuesSchema = z.object({
  repository: z.string().min(1),
  issues: z.array(z.object({
    type: z.enum(['build', 'deploy', 'runtime']),
    service: z.string().min(1),
    error: z.string().min(1),
    fix: z.string().min(1),
  })),
});

export type FixDeploymentIssuesArgs = z.infer<typeof FixDeploymentIssuesSchema>;

export type FixDeploymentIssuesResult = {
  fixesApplied: Array<{
    file: string;
    changes: string[];
  }>;
  redeploymentTriggered: boolean;
  status: 'fixed' | 'failed';
  message: string;
};

// Environment Configuration
export type EnvironmentConfig = {
  GCP_PROJECT_ID?: string;
  GITHUB_TOKEN?: string;
  GCP_REGION?: string;
  GCP_ORG_ID?: string;
  GCP_BILLING_ACCOUNT?: string;
};

// Tool Registry
export type ToolRegistry = Map<string, Tool>;
export type ResourceRegistry = Map<string, Resource>;

// MCP Server Configuration
export type MCPServerConfig = {
  name: string;
  version: string;
  capabilities: {
    resources: Record<string, any>;
    tools: Record<string, any>;
    prompts: Record<string, any>;
  };
};
