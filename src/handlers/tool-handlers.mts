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
}
