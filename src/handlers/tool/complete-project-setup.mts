import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  CompleteProjectSetupResult,
  CreateGitHubRepoResult,
  DependencyCheckResult,
  SetupGitHubSecretsResult,
} from '../../types.mjs'
import { createGitHubEnvironments } from './create-github-environments.mjs'
import { createGitHubRepo } from './create-github-repo.mjs'
import { installPrerequisites } from './install-prerequisites.mjs'
import { runFoundationProjectHandler } from './run-foundation-project-handler.mjs'
import { setupGitHubSecrets } from './setup-github-secrets.mjs'
import { createSkeletonApp } from './create-skeleton-app.mjs'
const execAsync = promisify(execCb)

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
  codePath: string
}): Promise<CompleteProjectSetupResult> {
  const results: CompleteProjectSetupResult['results'] = {
    step1: { status: 'pending', message: 'Installing prerequisites...' },
    step2: { status: 'pending', message: 'Creating GitHub repository...' },
    step3: {
      status: 'pending',
      message: 'Setting up GCP foundation project...',
    },
    step4: { status: 'pending', message: 'Configuring GitHub secrets...' },
    step5: { status: 'pending', message: 'Creating skeleton app...' },
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
      if (stdout?.includes('Logged in to github.com')) {
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
        message:
          'GitHub CLI is not authenticated. Please run: gh auth login and then re-run the setup.',
        results,
      }
    }

    // Check gcloud authentication
    let gcloudAuthOk = false
    try {
      const { stdout } = await execAsync('gcloud auth list --format=json')
      const accounts = JSON.parse(stdout)
      if (
        Array.isArray(accounts) &&
        accounts.some((a) => a.status === 'ACTIVE')
      ) {
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
        message:
          'gcloud is not authenticated. Please run: gcloud auth login and then re-run the setup.',
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
    const repoFullName = args.githubIdentity?.includes('/')
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
          results: envResult.results.map((r) => ({
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

    // Step 5: Create skeleton app
    console.error('Step 5: Creating skeleton app...')
    const skeletonResult = await createSkeletonApp({
      githubIdentity: args.githubIdentity,
      projectName: args.projectName,
      codePath: args.codePath,
    })
    results.step5 = {
      status: skeletonResult.status,
      message: skeletonResult.message,
      details: skeletonResult,
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
        skeletonAppPath: skeletonResult.path,
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
