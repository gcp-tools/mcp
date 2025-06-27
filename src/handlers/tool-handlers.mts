import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  SetupFoundationProjectArgs,
  SetupFoundationProjectResult,
} from '../types.mjs';

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

      console.error(`Executing script: ${scriptPath}`);
      console.error(`Project Name: ${args.projectName}`);
      console.error(`Organization ID: ${args.orgId}`);
      console.error(`Region: ${args.region}`);
      console.error('This may take several minutes to complete...');

      const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
        env: process.env,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 300000, // 5 minutes timeout
      });

      if (stderr) {
        console.error('Script stderr:', stderr);
      }

      console.error('Script stdout:', stdout);

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
      console.error('Foundation project setup failed:', error);
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
   * Check for and optionally install required and optional dependencies
   */
  static async installPrerequisites(args: { checkOnly?: boolean, includeOptional?: boolean }): Promise<any> {
    const required = [
      { name: 'terraform', check: 'terraform --version', install: 'brew install terraform' },
      { name: 'cdktf', check: 'cdktf --version', install: 'npm install -g cdktf-cli' },
      { name: 'cdktf-cli', check: 'cdktf --version', install: 'npm install -g cdktf-cli' },
      { name: 'gcloud', check: 'gcloud --version', install: 'brew install --cask google-cloud-sdk' },
      { name: 'gh', check: 'gh --version', install: 'brew install gh' },
    ];
    const optional = [
      { name: 'python', check: 'python3 --version', install: 'brew install python' },
      { name: 'rust', check: 'rustc --version', install: 'brew install rust' },
    ];
    const toCheck = args.includeOptional ? required.concat(optional) : required;
    const results = [];
    for (const dep of toCheck) {
      try {
        await execAsync(dep.check);
        results.push({ name: dep.name, present: true });
      } catch {
        results.push({ name: dep.name, present: false });
        if (!args.checkOnly) {
          try {
            await execAsync(dep.install);
            results.push({ name: dep.name, installed: true });
          } catch (err) {
            results.push({ name: dep.name, installed: false, error: String(err) });
          }
        }
      }
    }
    return {
      summary: results,
      message: args.checkOnly
        ? 'Dependency check complete.'
        : 'Dependency check and install complete.',
    };
  }

  /**
   * Create a new GitHub repository with proper configuration
   */
  static async createGitHubRepo(args: {
    repoName: string;
    description?: string;
    isPrivate?: boolean;
    addReadme?: boolean;
    addGitignore?: boolean;
    addLicense?: string;
    topics?: string[];
  }): Promise<any> {
    try {
      // Check if GitHub CLI is available
      try {
        await execAsync('gh --version');
      } catch {
        return {
          status: 'failed',
          message: 'GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com/',
          error: 'GitHub CLI not found'
        };
      }

      // Check if user is authenticated with GitHub
      try {
        await execAsync('gh auth status');
      } catch {
        return {
          status: 'failed',
          message: 'Not authenticated with GitHub. Please run: gh auth login',
          error: 'GitHub authentication required'
        };
      }

      // Build the gh repo create command
      const cmd = [
        'gh repo create',
        args.repoName,
        args.isPrivate !== false ? '--private' : '--public',
        args.description ? `--description "${args.description}"` : '',
        args.addReadme !== false ? '--add-readme' : '',
        args.addGitignore !== false ? '--gitignore Node' : '',
        args.addLicense ? `--license ${args.addLicense}` : '',
        '--source .',
        '--remote origin',
        '--push'
      ].filter(Boolean).join(' ');

      console.error(`Creating GitHub repository: ${args.repoName}`);
      const { stdout, stderr } = await execAsync(cmd, {
        env: process.env,
        maxBuffer: 1024 * 1024, // 1MB buffer
        timeout: 60000, // 1 minute timeout
      });

      if (stderr) {
        console.error('GitHub CLI stderr:', stderr);
      }

      console.error('GitHub CLI stdout:', stdout);

      // Add topics if specified
      if (args.topics && args.topics.length > 0) {
        const topicsCmd = `gh repo edit ${args.repoName} --add-topic ${args.topics.join(',')}`;
        try {
          await execAsync(topicsCmd);
          console.error(`Added topics: ${args.topics.join(', ')}`);
        } catch (error) {
          console.error('Failed to add topics:', error);
        }
      }

      // Extract repository URL from output
      const repoUrlMatch = stdout.match(/https:\/\/github\.com\/[^\/]+\/[^\/\s]+/);
      const repoUrl = repoUrlMatch ? repoUrlMatch[0] : `https://github.com/${args.repoName}`;

      return {
        status: 'success',
        message: 'GitHub repository created successfully',
        repoName: args.repoName,
        repoUrl: repoUrl,
        isPrivate: args.isPrivate !== false,
        topics: args.topics || []
      };
    } catch (error) {
      console.error('GitHub repository creation failed:', error);
      return {
        status: 'failed',
        message: `GitHub repository creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create GitHub repository secrets and environment variables based on GCP foundation setup
   */
  static async setupGitHubSecrets(args: {
    repoName: string;
    projectId: string;
    serviceAccount: string;
    workloadIdentityPool: string;
    region: string;
    orgId?: string;
    billingAccount?: string;
  }): Promise<any> {
    try {
      // Check if GitHub CLI is available and authenticated
      try {
        await execAsync('gh auth status');
      } catch {
        return {
          status: 'failed',
          message: 'Not authenticated with GitHub. Please run: gh auth login',
          error: 'GitHub authentication required'
        };
      }

      const results = [];
      const secrets = [
        { name: 'GCP_PROJECT_ID', value: args.projectId },
        { name: 'GCP_SERVICE_ACCOUNT', value: args.serviceAccount },
        { name: 'GCP_WORKLOAD_IDENTITY_POOL', value: args.workloadIdentityPool },
        { name: 'GCP_REGION', value: args.region },
      ];

      // Add optional secrets if provided
      if (args.orgId) {
        secrets.push({ name: 'GCP_ORG_ID', value: args.orgId });
      }
      if (args.billingAccount) {
        secrets.push({ name: 'GCP_BILLING_ACCOUNT', value: args.billingAccount });
      }

      // Create repository secrets
      for (const secret of secrets) {
        try {
          const cmd = `gh secret set ${secret.name} --repo ${args.repoName} --body "${secret.value}"`;
          await execAsync(cmd);
          results.push({ name: secret.name, type: 'secret', status: 'created' });
          console.error(`Created secret: ${secret.name}`);
        } catch (error) {
          results.push({ name: secret.name, type: 'secret', status: 'failed', error: String(error) });
          console.error(`Failed to create secret ${secret.name}:`, error);
        }
      }

      // Create environment variables (these are public, so only non-sensitive data)
      const envVars = [
        { name: 'GCP_PROJECT_ID', value: args.projectId },
        { name: 'GCP_REGION', value: args.region },
      ];

      for (const envVar of envVars) {
        try {
          const cmd = `gh variable set ${envVar.name} --repo ${args.repoName} --body "${envVar.value}"`;
          await execAsync(cmd);
          results.push({ name: envVar.name, type: 'variable', status: 'created' });
          console.error(`Created variable: ${envVar.name}`);
        } catch (error) {
          results.push({ name: envVar.name, type: 'variable', status: 'failed', error: String(error) });
          console.error(`Failed to create variable ${envVar.name}:`, error);
        }
      }

      // Create a GitHub Actions workflow file for GCP authentication
      const workflowContent = `name: GCP Authentication Setup

on:
  workflow_dispatch:
  push:
    branches: [ main ]

env:
  GCP_PROJECT_ID: \${{ vars.GCP_PROJECT_ID }}
  GCP_REGION: \${{ vars.GCP_REGION }}

jobs:
  setup-gcp-auth:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Google Auth
      id: auth
      uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: \${{ secrets.GCP_WORKLOAD_IDENTITY_POOL }}
        service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Configure gcloud
      run: |
        gcloud config set project \${{ vars.GCP_PROJECT_ID }}
        gcloud config set compute/region \${{ vars.GCP_REGION }}

    - name: Verify Authentication
      run: |
        gcloud auth list
        gcloud config list
`;

      try {
        // Create .github/workflows directory if it doesn't exist
        await execAsync('mkdir -p .github/workflows');

        // Write the workflow file
        const fs = await import('fs/promises');
        await fs.writeFile('.github/workflows/gcp-auth.yml', workflowContent);

        // Add and commit the workflow file
        await execAsync('git add .github/workflows/gcp-auth.yml');
        await execAsync('git commit -m "Add GCP authentication workflow"');
        await execAsync('git push origin main');

        results.push({ name: 'gcp-auth.yml', type: 'workflow', status: 'created' });
        console.error('Created GCP authentication workflow');
      } catch (error) {
        results.push({ name: 'gcp-auth.yml', type: 'workflow', status: 'failed', error: String(error) });
        console.error('Failed to create workflow file:', error);
      }

      return {
        status: 'success',
        message: 'GitHub secrets and environment variables setup completed',
        repoName: args.repoName,
        results: results,
        summary: {
          secretsCreated: results.filter(r => r.type === 'secret' && r.status === 'created').length,
          variablesCreated: results.filter(r => r.type === 'variable' && r.status === 'created').length,
          workflowsCreated: results.filter(r => r.type === 'workflow' && r.status === 'created').length,
          totalItems: results.length
        }
      };
    } catch (error) {
      console.error('GitHub secrets setup failed:', error);
      return {
        status: 'failed',
        message: `GitHub secrets setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete end-to-end project setup workflow
   */
  static async completeProjectSetup(args: {
    projectName: string;
    orgId: string;
    billingAccount: string;
    region: string;
    githubIdentity: string;
    developerIdentity: string;
    repoDescription?: string;
    isPrivate?: boolean;
    addLicense?: string;
    topics?: string[];
    includeOptionalDeps?: boolean;
  }): Promise<any> {
    const results: {
      step1: { status: string; message: string; details?: any };
      step2: { status: string; message: string; details?: any };
      step3: { status: string; message: string; details?: any };
      step4: { status: string; message: string; details?: any };
    } = {
      step1: { status: 'pending', message: 'Installing prerequisites...' },
      step2: { status: 'pending', message: 'Creating GitHub repository...' },
      step3: { status: 'pending', message: 'Setting up GCP foundation project...' },
      step4: { status: 'pending', message: 'Configuring GitHub secrets...' },
    };

    try {
      // Step 1: Install prerequisites
      console.error('Step 1: Installing prerequisites...');
      const prereqResult = await ToolHandlers.installPrerequisites({
        checkOnly: false,
        includeOptional: args.includeOptionalDeps || false
      });

      if (prereqResult.summary?.some((r: any) => r.installed === false)) {
        results.step1 = { status: 'failed', message: 'Some prerequisites failed to install', details: prereqResult };
        return { status: 'failed', message: 'Prerequisites installation failed', results };
      }
      results.step1 = { status: 'success', message: 'Prerequisites installed successfully', details: prereqResult };

      // Step 2: Create GitHub repository
      console.error('Step 2: Creating GitHub repository...');
      const repoResult = await ToolHandlers.createGitHubRepo({
        repoName: args.projectName,
        description: args.repoDescription || `GCP infrastructure for ${args.projectName}`,
        isPrivate: args.isPrivate !== false,
        addReadme: true,
        addGitignore: true,
        addLicense: args.addLicense,
        topics: args.topics || ['gcp', 'cdktf', 'terraform', 'infrastructure']
      });

      if (repoResult.status === 'failed') {
        results.step2 = { status: 'failed', message: 'GitHub repository creation failed', details: repoResult };
        return { status: 'failed', message: 'GitHub repository creation failed', results };
      }
      results.step2 = { status: 'success', message: 'GitHub repository created successfully', details: repoResult };

      // Step 3: Setup GCP foundation project
      console.error('Step 3: Setting up GCP foundation project...');
      const foundationResult = await ToolHandlers.setupFoundationProject({
        projectName: args.projectName,
        orgId: args.orgId,
        billingAccount: args.billingAccount,
        region: args.region,
        githubIdentity: args.githubIdentity,
        developerIdentity: args.developerIdentity
      });

      if (foundationResult.status === 'failed') {
        results.step3 = { status: 'failed', message: 'GCP foundation project setup failed', details: foundationResult };
        return { status: 'failed', message: 'GCP foundation project setup failed', results };
      }
      results.step3 = { status: 'success', message: 'GCP foundation project setup completed', details: foundationResult };

      // Step 4: Setup GitHub secrets
      console.error('Step 4: Setting up GitHub secrets...');
      const secretsResult = await ToolHandlers.setupGitHubSecrets({
        repoName: args.projectName,
        projectId: foundationResult.projectId,
        serviceAccount: foundationResult.serviceAccount,
        workloadIdentityPool: foundationResult.workloadIdentityPool,
        region: args.region,
        orgId: args.orgId,
        billingAccount: args.billingAccount
      });

      if (secretsResult.status === 'failed') {
        results.step4 = { status: 'failed', message: 'GitHub secrets setup failed', details: secretsResult };
        return { status: 'failed', message: 'GitHub secrets setup failed', results };
      }
      results.step4 = { status: 'success', message: 'GitHub secrets configured successfully', details: secretsResult };

      // All steps completed successfully
      return {
        status: 'success',
        message: 'Complete project setup finished successfully!',
        results,
        summary: {
          githubRepo: repoResult.repoUrl,
          gcpProject: foundationResult.projectId,
          serviceAccount: foundationResult.serviceAccount,
          secretsCreated: secretsResult.summary?.secretsCreated || 0,
          variablesCreated: secretsResult.summary?.variablesCreated || 0,
          workflowCreated: secretsResult.summary?.workflowsCreated || 0
        }
      };

    } catch (error) {
      console.error('Complete project setup failed:', error);
      return {
        status: 'failed',
        message: `Complete project setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        results
      };
    }
  }
}
