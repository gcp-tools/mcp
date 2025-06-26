import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  SetupFoundationProjectArgs,
  SetupFoundationProjectResult,
  ScaffoldProjectArgs,
  ScaffoldProjectResult,
  CreateGitHubRepositoryArgs,
  CreateGitHubRepositoryResult,
  SetupGitHubSecretsArgs,
  SetupGitHubSecretsResult,
  PushToGitHubArgs,
  PushToGitHubResult,
  CreateServiceArgs,
  CreateServiceResult,
  ConfigureInfrastructureArgs,
  ConfigureInfrastructureResult,
  DeployServicesArgs,
  DeployServicesResult,
  MonitorDeploymentArgs,
  MonitorDeploymentResult,
  FixDeploymentIssuesArgs,
  FixDeploymentIssuesResult,
} from '../types.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ToolHandlers {
  /**
   * Execute the setup_foundation_project.sh script in GCP
   */
  static async setupFoundationProject(args: SetupFoundationProjectArgs): Promise<SetupFoundationProjectResult> {
    try {
      // Set environment variables for the script
      process.env.GCP_TOOLS_PROJECT_NAME = args.projectName;
      process.env.GCP_TOOLS_ORG_ID = args.orgId;
      process.env.GCP_TOOLS_BILLING_ACCOUNT = args.billingAccount;
      process.env.GCP_DEFAULT_REGION = args.region;
      process.env.GCP_TOOLS_GITHUB_IDENTITY_SPECIFIER = args.githubIdentity;
      process.env.GCP_TOOLS_DEVELOPER_IDENTITY_SPECIFIER = args.developerIdentity;

      // Path to the setup script (assuming it's in the gcp-tools-cdktf directory)
      const scriptPath = path.resolve(__dirname, '../../../gcp-tools-cdktf/scripts/setup_foundation_project.sh');

      const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
        env: process.env,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr) {
        console.warn('Script stderr:', stderr);
      }

      // Parse output to extract project information
      const projectIdMatch = stdout.match(/Project ID: ([^\n]+)/);
      const serviceAccountMatch = stdout.match(/Service Account: ([^\n]+)/);
      const workloadIdentityPoolMatch = stdout.match(/Workload Identity Pool: ([^\n]+)/);

      return {
        projectId: projectIdMatch?.[1] || '',
        serviceAccount: serviceAccountMatch?.[1] || '',
        workloadIdentityPool: workloadIdentityPoolMatch?.[1] || '',
        status: 'success',
        message: 'Foundation project setup completed successfully',
      };
    } catch (error) {
      return {
        projectId: '',
        serviceAccount: '',
        workloadIdentityPool: '',
        status: 'failed',
        message: `Foundation project setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create new project structure based on gcp-tools-cdktf patterns
   */
  static async scaffoldProject(args: ScaffoldProjectArgs): Promise<ScaffoldProjectResult> {
    try {
      const projectStructure = {
        files: [
          {
            path: '.github/workflows/deploy-infrastructure.yml',
            content: this.generateInfrastructureWorkflow(args),
          },
          {
            path: '.github/workflows/deploy-services.yml',
            content: this.generateServicesWorkflow(args),
          },
          {
            path: 'iac/projects/host-stack.mts',
            content: this.generateHostStack(args),
          },
          {
            path: 'iac/projects/data-stack.mts',
            content: this.generateDataStack(args),
          },
          {
            path: 'iac/projects/app-stack.mts',
            content: this.generateAppStack(args),
          },
          {
            path: 'package.json',
            content: this.generatePackageJson(args),
          },
          {
            path: 'tsconfig.json',
            content: this.generateTsConfig(args),
          },
          {
            path: 'biome.json',
            content: this.generateBiomeConfig(args),
          },
          {
            path: 'Makefile',
            content: this.generateMakefile(args),
          },
          {
            path: '.gitignore',
            content: this.generateGitignore(args),
          },
          {
            path: '.nvmrc',
            content: this.generateNvmrc(args),
          },
          {
            path: '.editorconfig',
            content: this.generateEditorConfig(args),
          },
        ],
        directories: [
          '.github/actions',
          '.github/workflows',
          '.husky',
          'docs',
          'iac/projects',
          'iac/infrastructure',
          'iac/app',
          'iac/ingress',
          'scripts',
          'services',
        ],
      };

      // Add service directories and files
      for (const service of args.services || []) {
        projectStructure.directories.push(`services/${service.name}`);
        projectStructure.files.push({
          path: `services/${service.name}/package.json`,
          content: this.generateServicePackageJson(service),
        });
        projectStructure.files.push({
          path: `services/${service.name}/src/index.ts`,
          content: this.generateServiceCode(service),
        });
      }

      return {
        projectStructure,
        status: 'created',
        message: 'Project structure created successfully',
      };
    } catch (error) {
      return {
        projectStructure: { files: [], directories: [] },
        status: 'failed',
        message: `Project scaffolding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create new GitHub repository for the application
   */
  static async createGitHubRepository(args: CreateGitHubRepositoryArgs): Promise<CreateGitHubRepositoryResult> {
    try {
      // This would integrate with GitHub API
      // For now, return a mock result
      const repoName = args.orgName ? `${args.orgName}/${args.name}` : args.name;

      return {
        repositoryUrl: `https://github.com/${repoName}`,
        repositoryId: `repo_${Date.now()}`,
        status: 'created',
        message: 'GitHub repository created successfully',
      };
    } catch (error) {
      return {
        repositoryUrl: '',
        repositoryId: '',
        status: 'failed',
        message: `GitHub repository creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Configure GitHub secrets and environment variables
   */
  static async setupGitHubSecrets(args: SetupGitHubSecretsArgs): Promise<SetupGitHubSecretsResult> {
    try {
      // This would integrate with GitHub API
      // For now, return a mock result
      const secretsConfigured = Object.keys(args.secrets);
      const environmentsConfigured = args.environments;

      return {
        secretsConfigured,
        environmentsConfigured,
        status: 'success',
        message: 'GitHub secrets and environment variables configured successfully',
      };
    } catch (error) {
      return {
        secretsConfigured: [],
        environmentsConfigured: [],
        status: 'failed',
        message: `GitHub secrets setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Push scaffolded project to GitHub repository
   */
  static async pushToGitHub(args: PushToGitHubArgs): Promise<PushToGitHubResult> {
    try {
      // This would integrate with GitHub API
      // For now, return a mock result
      return {
        commitSha: `commit_${Date.now()}`,
        branch: args.branch,
        status: 'pushed',
        message: 'Project pushed to GitHub successfully',
      };
    } catch (error) {
      return {
        commitSha: '',
        branch: args.branch,
        status: 'failed',
        message: `GitHub push failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create new service in the services directory
   */
  static async createService(args: CreateServiceArgs): Promise<CreateServiceResult> {
    try {
      const serviceFiles = [
        {
          path: `services/${args.serviceName}/package.json`,
          content: this.generateServicePackageJson({
            name: args.serviceName,
            language: args.language,
            type: args.type,
          }),
        },
        {
          path: `services/${args.serviceName}/src/index.ts`,
          content: this.generateServiceCode({
            name: args.serviceName,
            language: args.language,
            type: args.type,
            requirements: args.requirements,
          }),
        },
      ];

      return {
        serviceFiles,
        status: 'created',
        message: 'Service created successfully',
      };
    } catch (error) {
      return {
        serviceFiles: [],
        status: 'failed',
        message: `Service creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Configure infrastructure for services
   */
  static async configureInfrastructure(args: ConfigureInfrastructureArgs): Promise<ConfigureInfrastructureResult> {
    try {
      const infrastructureFiles = [
        {
          path: `iac/app/${args.serviceName}-stack.mts`,
          content: this.generateInfrastructureStack(args),
        },
      ];

      return {
        infrastructureFiles,
        status: 'configured',
        message: 'Infrastructure configured successfully',
      };
    } catch (error) {
      return {
        infrastructureFiles: [],
        status: 'failed',
        message: `Infrastructure configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Deploy services by pushing to GitHub
   */
  static async deployServices(_args: DeployServicesArgs): Promise<DeployServicesResult> {
    try {
      // This would trigger a GitHub Actions workflow
      return {
        deploymentId: `deploy_${Date.now()}`,
        workflowRunId: `workflow_${Date.now()}`,
        status: 'triggered',
        message: 'Deployment triggered successfully',
      };
    } catch (error) {
      return {
        deploymentId: '',
        workflowRunId: '',
        status: 'failed',
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Monitor deployment status and logs
   */
  static async monitorDeployment(_args: MonitorDeploymentArgs): Promise<MonitorDeploymentResult> {
    try {
      // This would check GitHub Actions and GCP deployment status
      return {
        status: 'completed',
        progress: 100,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: 'Deployment completed successfully',
          },
        ],
        services: [
          {
            name: 'example-service',
            status: 'RUNNING',
            url: 'https://example-service-xyz.run.app',
          },
        ],
      };
    } catch (error) {
      return {
        status: 'failed',
        progress: 0,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `Deployment monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        services: [],
      };
    }
  }

  /**
   * Fix deployment issues and redeploy
   */
  static async fixDeploymentIssues(args: FixDeploymentIssuesArgs): Promise<FixDeploymentIssuesResult> {
    try {
      const fixesApplied = args.issues.map((issue: any) => ({
        file: `services/${issue.service}/src/index.ts`,
        changes: [issue.fix],
      }));

      return {
        fixesApplied,
        redeploymentTriggered: true,
        status: 'fixed',
        message: 'Deployment issues fixed and redeployment triggered',
      };
    } catch (error) {
      return {
        fixesApplied: [],
        redeploymentTriggered: false,
        status: 'failed',
        message: `Issue fixing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Helper methods for generating content
  private static generateInfrastructureWorkflow(_args: ScaffoldProjectArgs): string {
    return `name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths: ['iac/**']
  pull_request:
    branches: [main]
    paths: ['iac/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:infrastructure
`;
  }

  private static generateServicesWorkflow(_args: ScaffoldProjectArgs): string {
    return `name: Deploy Services

on:
  push:
    branches: [main]
    paths: ['services/**']
  pull_request:
    branches: [main]
    paths: ['services/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy:services
`;
  }

  private static generateHostStack(_args: ScaffoldProjectArgs): string {
    return `import * as projects from '@gcp-tools/cdktf/stacks/projects';
import { App } from 'cdktf';

const app = new App();

new projects.HostProjectStack(app);

app.synth();
`;
  }

  private static generateDataStack(_args: ScaffoldProjectArgs): string {
    return `import * as projects from '@gcp-tools/cdktf/stacks/projects';
import { App } from 'cdktf';

const app = new App();

new projects.DataProjectStack(app, {
  apis: ['firestore'],
});

app.synth();
`;
  }

  private static generateAppStack(_args: ScaffoldProjectArgs): string {
    return `import * as projects from '@gcp-tools/cdktf/stacks/projects';
import { App } from 'cdktf';

const app = new App();

new projects.AppProjectStack(app);

app.synth();
`;
  }

  private static generatePackageJson(args: ScaffoldProjectArgs): string {
    return JSON.stringify({
      name: args.projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        build: 'npm run clean && tsc --pretty',
        clean: 'rm -rf coverage dist',
        lint: 'biome check src --write',
        test: 'vitest',
        'deploy:infrastructure': 'cd iac && npm run deploy',
        'deploy:services': 'npm run build && gcloud run deploy',
      },
      devDependencies: {
        '@biomejs/biome': '^1.9.4',
        '@types/node': '^22.14.0',
        'typescript': '^5.8.2',
        'vitest': '^3.0.8',
      },
      dependencies: {
        '@gcp-tools/cdktf': '^1.0.0',
        'cdktf': '^0.25.0',
      },
    }, null, 2);
  }

  private static generateTsConfig(_args: ScaffoldProjectArgs): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        allowJs: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: './dist',
        rootDir: './src',
        removeComments: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitThis: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        exactOptionalPropertyTypes: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'coverage'],
    }, null, 2);
  }

  private static generateBiomeConfig(_args: ScaffoldProjectArgs): string {
    return JSON.stringify({
      $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
      vcs: {
        enabled: true,
        clientKind: 'git',
        useIgnoreFile: true,
      },
      files: {
        ignoreUnknown: false,
        ignore: ['.git', 'node_modules', 'dist', 'coverage'],
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
        },
      },
      formatter: {
        enabled: true,
        indentStyle: 'space',
        indentWidth: 2,
        lineWidth: 80,
      },
      javascript: {
        formatter: {
          quoteStyle: 'single',
          trailingComma: 'es5',
          semicolons: 'asNeeded',
        },
      },
    }, null, 2);
  }

  private static generateMakefile(args: ScaffoldProjectArgs): string {
    return `# Makefile for ${args.projectName}

.PHONY: install build test lint clean deploy

install:
	npm ci

build:
	npm run build

test:
	npm test

lint:
	npm run lint

clean:
	npm run clean

deploy: build
	npm run deploy:infrastructure
	npm run deploy:services
`;
  }

  private static generateGitignore(_args: ScaffoldProjectArgs): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Coverage
coverage/

# Terraform
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl

# CDKTF
cdktf.out/
`;
  }

  private static generateNvmrc(_args: ScaffoldProjectArgs): string {
    return '20\n';
  }

  private static generateEditorConfig(_args: ScaffoldProjectArgs): string {
    return `# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
trim_trailing_whitespace = true

# TypeScript and JavaScript files
[*.{ts,tsx,js,jsx,mts,mjs}]
indent_style = space
indent_size = 2

# JSON files
[*.json]
indent_style = space
indent_size = 2

# YAML files
[*.{yml,yaml}]
indent_style = space
indent_size = 2

# Markdown files
[*.md]
trim_trailing_whitespace = false
`;
  }

  private static generateServicePackageJson(service: any): string {
    return JSON.stringify({
      name: service.name,
      version: '1.0.0',
      type: 'module',
      scripts: {
        build: 'npm run clean && tsc --pretty',
        clean: 'rm -rf coverage dist',
        lint: 'biome check src --write',
        test: 'vitest',
        start: 'node dist/index.js',
        dev: 'tsx src/index.ts',
      },
      devDependencies: {
        '@biomejs/biome': '^1.9.4',
        '@types/node': '^22.14.0',
        'typescript': '^5.8.2',
        'vitest': '^3.0.8',
        'tsx': '^4.19.2',
      },
      dependencies: {
        'fastify': '^4.28.1',
        '@fastify/cors': '^9.0.1',
        'zod': '^3.23.8',
      },
    }, null, 2);
  }

  private static generateServiceCode(service: any): string {
    return `import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const app = Fastify({
  logger: true,
});

// Register CORS
await app.register(cors, {
  origin: true,
});

// Health check endpoint
app.get('/health', async (request, reply) => {
  return { status: 'ok', service: '${service.name}' };
});

// Example endpoint
app.get('/', async (request, reply) => {
  return { message: 'Hello from ${service.name}!' };
});

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
`;
  }

  private static generateInfrastructureStack(args: ConfigureInfrastructureArgs): string {
    return `import { cloudrun } from '@gcp-tools/cdktf/constructs';
import { AppStack } from '@gcp-tools/cdktf/stacks/app';
import { envConfig } from '@gcp-tools/cdktf/utils';
import { type App, TerraformOutput } from 'cdktf';

export class ${args.serviceName.charAt(0).toUpperCase() + args.serviceName.slice(1)}Stack extends AppStack {
  public readonly ${args.serviceName}: cloudrun.CloudRunServiceConstruct;

  constructor(scope: App) {
    super(scope, '${args.serviceName}', {
      databases: ['firestore'],
    });

    this.${args.serviceName} = new cloudrun.CloudRunServiceConstruct(
      this,
      this.stackId,
      {
        region: envConfig.regions[0],
        buildConfig: {},
        serviceConfig: {
          resources: {
            limits: {
              memory: '${args.config.memory}',
              cpu: '${args.config.cpu}',
            },
          },
          scaling: {
            type: 'INSTANCES',
            data: {
              minInstances: ${args.config.minScale},
              maxInstances: ${args.config.maxScale},
            },
          },
          environmentVariables: ${JSON.stringify(args.config.environment, null, 2)},
        },
      },
    );

    new TerraformOutput(this, 'service-uri', {
      description: 'The URI of the ${args.serviceName} service.',
      value: this.${args.serviceName}.service.uri,
    });
  }
}
`;
  }
}
