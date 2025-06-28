import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import type { FoundationSetupResult } from '../../lib/setup-foundation-project.mjs'
import type { SetupGitHubSecretsResult } from '../../types.mjs'

const execAsync = promisify(execCb)

export async function setupGitHubSecrets(
  input:
    | FoundationSetupResult
    | {
        repoName: string
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
        regions: string
        orgId?: string
        billingAccount?: string
        ownerEmails?: string
      },
): Promise<SetupGitHubSecretsResult> {
  // Type guard: is this a FoundationSetupResult?
  const isFoundationResult = (obj: unknown): obj is FoundationSetupResult => {
    if (!obj || typeof obj !== 'object') return false
    return (
      'projectId' in obj &&
      'serviceAccount' in obj &&
      'workloadIdentityProviders' in obj
    )
  }

  const args = isFoundationResult(input)
    ? {
        repoName: input.githubIdentity?.includes('/')
          ? input.githubIdentity
          : `${input.githubIdentity}/${input.projectId.replace(/-fdn-.*/, '')}`,
        projectId: input.projectId,
        serviceAccount: input.serviceAccount,
        workloadIdentityPool: input.workloadIdentityProviders?.dev || '',
        projectNumber: input.projectNumber,
        workloadIdentityProviders: input.workloadIdentityProviders,
        regions: input.regions,
        orgId: input.orgId,
        billingAccount: input.billingAccount,
        ownerEmails: input.ownerEmails,
      }
    : input

  try {
    // Check if GitHub CLI is available and authenticated
    try {
      await execAsync('gh auth status')
    } catch {
      return {
        status: 'failed',
        message: 'Not authenticated with GitHub. Please run: gh auth login',
        error: 'GitHub authentication required',
        repoName: args.repoName,
        results: [],
        summary: {
          secretsCreated: 0,
          variablesCreated: 0,
          workflowsCreated: 0,
          totalItems: 0,
        },
      }
    }

    const results = []
    // --- Environment-specific secrets/variables ---
    const environments: Array<'dev' | 'test' | 'sbx' | 'prod'> = [
      'dev',
      'test',
      'sbx',
      'prod',
    ]
    for (const env of environments) {
      // Set GCP_TOOLS_ENVIRONMENT variable
      try {
        const cmd = `gh variable set GCP_TOOLS_ENVIRONMENT --repo ${args.repoName} --env ${env} --body "${env}"`
        await execAsync(cmd)
        results.push({
          name: 'GCP_TOOLS_ENVIRONMENT',
          env,
          type: 'variable',
          status: 'created',
        })
      } catch (error) {
        results.push({
          name: 'GCP_TOOLS_ENVIRONMENT',
          env,
          type: 'variable',
          status: 'failed',
          error: String(error),
        })
      }
      // Set GCP_TOOLS_WORKLOAD_IDENTITY_PROVIDER secret
      const provider = args.workloadIdentityProviders?.[env]
      if (provider) {
        try {
          const cmd = `gh secret set GCP_TOOLS_WORKLOAD_IDENTITY_PROVIDER --repo ${args.repoName} --env ${env} --body "${provider}"`
          await execAsync(cmd)
          results.push({
            name: 'GCP_TOOLS_WORKLOAD_IDENTITY_PROVIDER',
            env,
            type: 'secret',
            status: 'created',
          })
        } catch (error) {
          results.push({
            name: 'GCP_TOOLS_WORKLOAD_IDENTITY_PROVIDER',
            env,
            type: 'secret',
            status: 'failed',
            error: String(error),
          })
        }
      }
    }

    // --- Global secrets ---
    const secrets = [
      { name: 'GCP_TOOLS_BILLING_ACCOUNT', value: args.billingAccount },
      { name: 'GCP_TOOLS_FOUNDATION_PROJECT_ID', value: args.projectId },
      { name: 'GCP_TOOLS_ORG_ID', value: args.orgId },
      { name: 'GCP_TOOLS_SERVICE_ACCOUNT_EMAIL', value: args.serviceAccount },
      {
        name: 'GCP_TOOLS_FOUNDATION_PROJECT_NUMBER',
        value: args.projectNumber,
      },
      {
        name: 'GCP_TOOLS_TERRAFORM_REMOTE_STATE_BUCKET_ID',
        value: `${args.projectId}-terraform-state`,
      },
    ]
    for (const secret of secrets) {
      if (secret.value) {
        try {
          const cmd = `gh secret set ${secret.name} --repo ${args.repoName} --body "${secret.value}"`
          await execAsync(cmd)
          results.push({
            name: secret.name,
            type: 'secret',
            status: 'created',
          })
        } catch (error) {
          results.push({
            name: secret.name,
            type: 'secret',
            status: 'failed',
            error: String(error),
          })
        }
      }
    }

    // Extract githubIdentity and projectName for correct variable mapping
    let githubIdentity = ''
    let projectName = ''
    if (isFoundationResult(input)) {
      githubIdentity = input.githubIdentity || ''
      projectName = input.projectId.replace(/-fdn-.*/, '')
    } else {
      // Try to parse from repoName if possible
      if (args.repoName?.includes('/')) {
        githubIdentity = args.repoName.split('/')[0]
        projectName = args.repoName.split('/')[1]
      }
    }
    // Use the full regions string if present
    const fullRegions =
      isFoundationResult(input) && input.regions ? input.regions : args.regions
    const variables = [
      {
        name: 'GCP_TOOLS_DEVELOPER_IDENTITY_SPECIFIER',
        value: args.ownerEmails,
      },
      { name: 'GCP_TOOLS_GITHUB_IDENTITY_SPECIFIER', value: githubIdentity },
      { name: 'GCP_TOOLS_PROJECT_NAME', value: projectName },
      { name: 'GCP_TOOLS_OWNER_EMAILS', value: args.ownerEmails },
      { name: 'GCP_TOOLS_REGIONS', value: fullRegions },
    ]
    for (const variable of variables) {
      if (variable.value) {
        try {
          const cmd = `gh variable set ${variable.name} --repo ${args.repoName} --body "${variable.value}"`
          await execAsync(cmd)
          results.push({
            name: variable.name,
            type: 'variable',
            status: 'created',
          })
        } catch (error) {
          results.push({
            name: variable.name,
            type: 'variable',
            status: 'failed',
            error: String(error),
          })
        }
      }
    }

    // --- GCP_REGION variable ---
    // try {
    //   const cmd = `gh secret set GCP_TOOLS_REGIONS --repo ${args.repoName} --body "${fullRegions}"`
    //   await execAsync(cmd)
    //   results.push({
    //     name: 'GCP_TOOLS_REGIONS',
    //     type: 'secret',
    //     status: 'created',
    //   })
    // } catch (error) {
    //   results.push({
    //     name: 'GCP_TOOLS_REGIONS',
    //     type: 'secret',
    //     status: 'failed',
    //     error: String(error),
    //   })
    // }
    try {
      const cmd = `gh variable set GCP_TOOLS_REGIONS --repo ${args.repoName} --body "${fullRegions}"`
      await execAsync(cmd)
      results.push({
        name: 'GCP_TOOLS_REGIONS',
        type: 'variable',
        status: 'created',
      })
    } catch (error) {
      results.push({
        name: 'GCP_TOOLS_REGIONS',
        type: 'variable',
        status: 'failed',
        error: String(error),
      })
    }

    return {
      status: 'success',
      message: 'GitHub secrets and environment variables setup completed',
      repoName: args.repoName,
      results: results,
      summary: {
        secretsCreated: results.filter(
          (r) => r.type === 'secret' && r.status === 'created',
        ).length,
        variablesCreated: results.filter(
          (r) => r.type === 'variable' && r.status === 'created',
        ).length,
        workflowsCreated: 0,
        totalItems: results.length,
      },
    }
  } catch (error) {
    console.error('GitHub secrets setup failed:', error)
    return {
      status: 'failed',
      message: `GitHub secrets setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      repoName: args.repoName,
      results: [],
      summary: {
        secretsCreated: 0,
        variablesCreated: 0,
        workflowsCreated: 0,
        totalItems: 0,
      },
    }
  }
}
