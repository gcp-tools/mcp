import type { FoundationSetupResult } from '../../lib/setup-foundation-project.mjs'
import type { SetupGitHubSecretsResult, CompleteProjectSetupResult, DependencyCheckResult, CreateGitHubRepoResult } from '../../types.mjs'
import { installPrerequisites } from './install-prerequisites.mjs'
import { createGitHubRepo } from './create-github-repo.mjs'
import { runFoundationProjectHandler } from './run-foundation-project-handler.mjs'
import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'
import { createGitHubEnvironments } from './create-github-environments.mjs'

const execAsync = promisify(execCb)

export async function setupGitHubSecrets(
  input: FoundationSetupResult | {
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
  }
): Promise<SetupGitHubSecretsResult> {
  // Type guard: is this a FoundationSetupResult?
  const isFoundationResult = (obj: any): obj is FoundationSetupResult =>
    obj && typeof obj === 'object' && 'projectId' in obj && 'serviceAccount' in obj && 'workloadIdentityProviders' in obj

  const args = isFoundationResult(input)
    ? {
        repoName: input.githubIdentity && input.githubIdentity.includes('/')
          ? input.githubIdentity
          : `${input.githubIdentity}/${input.projectId.replace(/-fdn-.*/, '')}`,
        projectId: input.projectId,
        serviceAccount: input.serviceAccount,
        workloadIdentityPool: input.workloadIdentityProviders?.dev || '',
        projectNumber: input.projectNumber,
        workloadIdentityProviders: input.workloadIdentityProviders,
        regions: input.region,
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

    // --- Global variables ---
    const variables = [
      {
        name: 'GCP_TOOLS_DEVELOPER_IDENTITY_SPECIFIER',
        value: args.ownerEmails,
      },
      { name: 'GCP_TOOLS_GITHUB_IDENTITY_SPECIFIER', value: args.regions },
      { name: 'GCP_TOOLS_PROJECT_NAME', value: args.repoName },
      { name: 'GCP_TOOLS_OWNER_EMAILS', value: args.ownerEmails },
      { name: 'GCP_TOOLS_REGIONS', value: args.regions },
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

    // --- GCP_REGION as both secret and variable ---
    try {
      const cmd = `gh secret set GCP_TOOLS_REGIONS --repo ${args.repoName} --body "${args.regions}"`
      await execAsync(cmd)
      results.push({
        name: 'GCP_TOOLS_REGIONS',
        type: 'secret',
        status: 'created',
      })
    } catch (error) {
      results.push({
        name: 'GCP_TOOLS_REGIONS',
        type: 'secret',
        status: 'failed',
        error: String(error),
      })
    }
    try {
      const cmd = `gh variable set GCP_TOOLS_REGIONS --repo ${args.repoName} --body "${args.regions}"`
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

export async function completeProjectSetup(args: {
  projectName: string
  orgId: string
  billingAccount: string
  regions: string
  githubIdentity: string
  developerIdentity: string
  ownerEmails: string
  repoDescription?: string
  isPrivate?: boolean
  addLicense?: string
  includeOptionalDeps?: boolean
}): Promise<CompleteProjectSetupResult> {
  const results: CompleteProjectSetupResult['results'] = {
    step1: { status: 'pending', message: 'Installing prerequisites...' },
    step2: { status: 'pending', message: 'Creating GitHub repository...' },
    step3: {
      status: 'pending',
      message: 'Setting up GCP foundation project...',
    },
    step4: { status: 'pending', message: 'Configuring GitHub secrets...' },
  }

  try {
    // Step 1: Install prerequisites
    console.error('Step 1: Installing prerequisites...')
    const prereqResult = await installPrerequisites()

    if (
      (prereqResult.summary as DependencyCheckResult[])?.some(
        (r) => r.installed === false,
      )
    ) {
      results.step1 = {
        status: 'failed',
        message: 'Some prerequisites failed to install',
        details: prereqResult,
      }
      return {
        status: 'failed',
        message: 'Prerequisites installation failed',
        results,
      }
    }
    results.step1 = {
      status: 'success',
      message: 'Prerequisites installed successfully',
      details: prereqResult,
    }

    // Check GitHub CLI authentication
    let ghAuthOk = false
    try {
      const { stdout } = await execAsync('gh auth status')
      if (stdout && stdout.includes('Logged in to github.com')) {
        ghAuthOk = true
      }
    } catch (e) {
      ghAuthOk = false
    }
    if (!ghAuthOk) {
      results.step1 = {
        status: 'failed',
        message: 'GitHub CLI is not authenticated. Please run: gh auth login',
        details: prereqResult,
      }
      return {
        status: 'failed',
        message: 'GitHub CLI is not authenticated. Please run: gh auth login and then re-run the setup.',
        results,
      }
    }

    // Check gcloud authentication
    let gcloudAuthOk = false
    try {
      const { stdout } = await execAsync('gcloud auth list --format=json')
      const accounts = JSON.parse(stdout)
      if (Array.isArray(accounts) && accounts.some(a => a.status === 'ACTIVE')) {
        gcloudAuthOk = true
      }
    } catch (e) {
      gcloudAuthOk = false
    }
    if (!gcloudAuthOk) {
      results.step1 = {
        status: 'failed',
        message: 'gcloud is not authenticated. Please run: gcloud auth login',
        details: prereqResult,
      }
      return {
        status: 'failed',
        message: 'gcloud is not authenticated. Please run: gcloud auth login and then re-run the setup.',
        results,
      }
    }

    // Step 2: Create GitHub repository
    console.error('Step 2: Creating GitHub repository...')
    const repoResult = (await createGitHubRepo({
      repoName: args.projectName,
      githubIdentity: args.githubIdentity,
      description:
        args.repoDescription || `GCP infrastructure for ${args.projectName}`,
      isPrivate: args.isPrivate !== false,
      addReadme: true,
      addGitignore: true,
      addLicense: args.addLicense,
    })) as CreateGitHubRepoResult

    if (repoResult.status === 'failed') {
      results.step2 = {
        status: 'failed',
        message: 'GitHub repository creation failed',
        details: repoResult,
      }
      return {
        status: 'failed',
        message: 'GitHub repository creation failed',
        results,
      }
    }
    results.step2 = {
      status: 'success',
      message: 'GitHub repository created successfully',
      details: repoResult,
    }

    // Step 3: Setup GCP foundation project
    console.error('Step 3: Setting up GCP foundation project...')
    const foundationResult = await runFoundationProjectHandler({
      projectName: args.projectName,
      orgId: args.orgId,
      billingAccount: args.billingAccount,
      regions: args.regions,
      githubIdentity: args.githubIdentity,
      developerIdentity: args.developerIdentity,
      ownerEmails: args.ownerEmails,
    })

    if (foundationResult.status === 'failed') {
      results.step3 = {
        status: 'failed',
        message: 'GCP foundation project setup failed',
        details: foundationResult,
      }
      return {
        status: 'failed',
        message: 'GCP foundation project setup failed',
        results,
      }
    }
    results.step3 = {
      status: 'success',
      message: 'GCP foundation project setup completed',
      details: foundationResult,
    }

    // Step 3.5: Create GitHub environments before secrets
    const repoFullName = args.githubIdentity && args.githubIdentity.includes('/')
      ? args.githubIdentity
      : `${args.githubIdentity}/${args.projectName}`
    const envResult = await createGitHubEnvironments({ repoName: repoFullName })
    if (envResult.status !== 'success') {
      results.step4 = {
        status: 'partial',
        message: 'Some environments failed to create',
        details: {
          status: 'failed',
          message: envResult.message,
          repoName: repoFullName,
          results: envResult.results.map(r => ({
            name: 'GITHUB_ENVIRONMENT',
            type: 'environment',
            env: r.env,
            status: r.status,
            error: r.error,
          })),
          summary: {
            secretsCreated: 0,
            variablesCreated: 0,
            workflowsCreated: 0,
            totalItems: envResult.results.length,
          },
        },
      }
      return {
        status: 'failed',
        message: 'Some environments failed to create',
        results,
        summary: {
          githubRepo: repoFullName,
          gcpProject: foundationResult.projectId,
          serviceAccount: foundationResult.serviceAccount,
          secretsCreated: 0,
          variablesCreated: 0,
          workflowCreated: 0,
        },
      }
    }

    // Step 4: Setup GitHub secrets
    console.error('Step 4: Setting up GitHub secrets...')
    const secretsResult = (await setupGitHubSecrets({
      ...foundationResult,
      repoName: repoFullName,
      regions: args.regions,
      orgId: args.orgId,
      billingAccount: args.billingAccount,
      ownerEmails: args.ownerEmails,
    })) as SetupGitHubSecretsResult

    if (secretsResult.status === 'failed') {
      results.step4 = {
        status: 'failed',
        message: 'GitHub secrets setup failed',
        details: secretsResult,
      }
      return {
        status: 'failed',
        message: 'GitHub secrets setup failed',
        results,
      }
    }
    results.step4 = {
      status: 'success',
      message: 'GitHub secrets configured successfully',
      details: secretsResult,
    }

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
        workflowCreated: secretsResult.summary?.workflowsCreated || 0,
      },
    }
  } catch (error) {
    console.error('Complete project setup failed:', error)
    return {
      status: 'failed',
      message: `Complete project setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }
  }
}
