// setup_foundation_project.ts
// TypeScript port of setup_foundation_project.sh with improved error handling and user messages.
// Usage: Set required env vars or pass as CLI args: projectName, orgId, billingAccount, region, githubIdentity, developerIdentity
// This script creates a GCP project, links billing, enables APIs, creates a service account, assigns IAM roles, sets up Workload Identity, and creates a GCS bucket.

import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'

const exec = promisify(execCb)

function getEnvOrArg(name: string, index: number): string {
  return process.env[name] || process.argv[index] || ''
}

function fail(msg: string, err?: unknown) {
  console.error(`\n[error] ❌ ERROR: ${msg}`)
  if (err) console.error('[error]', err)
  process.exit(1)
}

async function run(cmd: string, step: string): Promise<string> {
  try {
    const { stdout, stderr } = await exec(cmd)
    if (stderr) console.error(stderr)
    const result = stdout.trim()
    if (!result) {
      fail(`Step failed: ${step}\nCommand: ${cmd}\nNo output received`)
    }
    return result
  } catch (err) {
    fail(`Step failed: ${step}\nCommand: ${cmd}`, err)
    throw err
  }
}

// Zod schema for required inputs
const InputSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  orgId: z.string().min(1, 'Org ID is required'),
  billingAccount: z.string().min(1, 'Billing account is required'),
  regions: z
    .string()
    .min(1, 'At least one region is required')
    .refine(
      (val) =>
        val
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean).length > 0,
      'At least one region must be specified',
    ),
  githubIdentity: z.string().min(1, 'GitHub identity is required'),
  developerIdentity: z.string().min(1, 'Developer identity is required'),
  ownerEmails: z.string().min(1, 'Owner emails are required'),
})

// Add types for arguments and result
export type FoundationSetupArgs = {
  projectName: string
  orgId: string
  billingAccount: string
  regions: string // comma-separated
  githubIdentity: string
  developerIdentity: string
  ownerEmails: string
}

export type FoundationSetupResult = {
  projectId: string
  serviceAccount: string
  projectNumber: string
  workloadIdentityProviders: {
    dev?: string
    test?: string
    sbx?: string
    prod?: string
  }
  terraformStateBucket: string
  region: string
  regions: string
  orgId: string
  billingAccount: string
  githubIdentity: string
  developerIdentity: string
  ownerEmails: string
}

// Helper to list all GCP projects
async function listProjects(): Promise<string[]> {
  try {
    const { stdout } = await exec(
      'gcloud projects list --format="value(projectId)"',
    )
    return stdout
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch (err) {
    console.error('[error] Failed to list GCP projects:', err)
    return []
  }
}

// Helper to check if billing is already linked
async function isBillingLinked(
  projectId: string,
  billingAccount: string,
): Promise<boolean> {
  try {
    const { stdout } = await exec(
      `gcloud beta billing projects describe ${projectId} --format="value(billingAccountName)"`,
    )
    return stdout.trim().endsWith(billingAccount)
  } catch (err) {
    console.error('[error] Failed to check billing linkage:', err)
    return false
  }
}

// Helper to check if a service account exists
async function serviceAccountExists(
  projectId: string,
  email: string,
): Promise<boolean> {
  try {
    const { stdout } = await exec(
      `gcloud iam service-accounts list --project=${projectId} --format="value(email)"`,
    )
    return stdout
      .split('\n')
      .map((s) => s.trim())
      .includes(email)
  } catch {
    return false
  }
}

// Helper to check if a GCS bucket exists
async function bucketExists(bucketName: string): Promise<boolean> {
  try {
    await exec(`gcloud storage buckets describe gs://${bucketName}`)
    return true
  } catch {
    return false
  }
}

// Helper to check if a Workload Identity Pool exists
async function workloadIdentityPoolExists(
  projectId: string,
  poolId: string,
): Promise<boolean> {
  try {
    const { stdout } = await exec(
      `gcloud iam workload-identity-pools describe ${poolId} --project=${projectId} --location=global --format="value(name)"`,
    )
    return stdout.trim() !== ''
  } catch {
    return false
  }
}

// Helper to check if a Workload Identity Provider exists
async function workloadIdentityProviderExists(
  projectId: string,
  poolId: string,
  providerId: string,
): Promise<boolean> {
  try {
    const { stdout } = await exec(
      `gcloud iam workload-identity-pools providers describe ${providerId} --project=${projectId} --workload-identity-pool=${poolId} --location=global --format="value(name)"`,
    )
    return stdout.trim() !== ''
  } catch {
    return false
  }
}

// Refactor main logic into an exported async function
export async function runFoundationProject(
  args: FoundationSetupArgs,
): Promise<FoundationSetupResult> {
  const {
    projectName,
    orgId,
    billingAccount,
    regions,
    githubIdentity,
    developerIdentity,
    ownerEmails,
  } = args
  const regionList = regions
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  const defaultRegion = regionList[0]
  const timestamp = Math.floor(Date.now() / 1000)
  let projectId = `${projectName}-fdn-${timestamp}`
  const serviceAccountName = `${projectName}-sa`
  let serviceAccountEmail = ''
  let bucketName = ''

  // Check for existing project
  const projects = await listProjects()
  const projectRegex = new RegExp(`^${projectName}-fdn(-\\d+)?$`)
  const existing = projects.find((id) => projectRegex.test(id))
  if (existing) {
    projectId = existing
    serviceAccountEmail = `${serviceAccountName}@${projectId}.iam.gserviceaccount.com`
    bucketName = `${projectId}-terraform-state`
    console.error(
      `[info] Project ${projectId} already exists. Skipping creation.`,
    )
  } else {
    // 2. Create GCP Project
    console.error(`[info] === Step 1: Creating GCP Project: ${projectId} ===`)
    await run(
      `gcloud projects create ${projectId} --name="${projectName}-fdn" --organization=${orgId} --set-as-default`,
      'Create GCP Project',
    )
    serviceAccountEmail = `${serviceAccountName}@${projectId}.iam.gserviceaccount.com`
    bucketName = `${projectId}-terraform-state`
  }

  // 3. Link Billing
  const billingLinked = await isBillingLinked(projectId, billingAccount)
  if (billingLinked) {
    console.error(
      `[info] Billing account ${billingAccount} already linked to project ${projectId}. Skipping link step.`,
    )
  } else {
    console.error(
      `[info] === Step 2: Linking Billing Account: ${billingAccount} ===`,
    )
    await run(
      `gcloud billing projects link ${projectId} --billing-account=${billingAccount}`,
      'Link Billing',
    )
  }

  // 4. Get Project Number
  const projectNumber = await run(
    `gcloud projects describe ${projectId} --format="value(projectNumber)"`,
    'Get Project Number',
  )
  if (!projectNumber) {
    fail('Failed to get project number')
  }

  // 5. Enable APIs
  console.error('[info] === Step 3: Enabling Required APIs ===')
  const apis = [
    'cloudresourcemanager.googleapis.com',
    'cloudbilling.googleapis.com',
    'iam.googleapis.com',
    'compute.googleapis.com',
    'sts.googleapis.com',
    'iamcredentials.googleapis.com',
  ]
  for (const api of apis) {
    await run(
      `gcloud services enable ${api} --project=${projectId}`,
      `Enable API: ${api}`,
    )
  }

  // 6. Create Service Account
  const saExists = await serviceAccountExists(projectId, serviceAccountEmail)
  if (saExists) {
    console.error(
      `[info] Service account ${serviceAccountEmail} already exists. Skipping creation.`,
    )
  } else {
    console.error(
      `[info] === Step 4: Creating Service Account: ${serviceAccountName} ===`,
    )
    await run(
      `gcloud iam service-accounts create ${serviceAccountName} --project=${projectId} --display-name="${serviceAccountName}"`,
      'Create Service Account',
    )
  }

  // 7. Assign IAM Roles (Project)
  console.error('[info] === Step 5: Assigning Project-Level IAM Roles ===')
  const projectRoles = ['roles/viewer', 'roles/iam.serviceAccountAdmin']
  for (const role of projectRoles) {
    await run(
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccountEmail}" --role="${role}"`,
      `Assign Project Role: ${role}`,
    )
  }

  // 8. Assign IAM Roles (Org)
  console.error('[info] === Step 6: Assigning Organization-Level IAM Roles ===')
  const orgRoles = [
    'roles/resourcemanager.projectCreator',
    'roles/resourcemanager.projectDeleter',
    'roles/iam.serviceAccountAdmin',
    'roles/serviceusage.serviceUsageAdmin',
    'roles/resourcemanager.projectIamAdmin',
    'roles/storage.admin',
    'roles/compute.admin',
    'roles/compute.networkAdmin',
    'roles/vpcaccess.admin',
    'roles/compute.xpnAdmin',
    'roles/secretmanager.admin',
    'roles/cloudsql.admin',
    'roles/pubsub.admin',
    'roles/run.admin',
    'roles/cloudfunctions.admin',
    'roles/apigateway.admin',
    'roles/spanner.admin',
    'roles/datastore.owner',
    'roles/artifactregistry.admin',
  ]
  for (const role of orgRoles) {
    await run(
      `gcloud organizations add-iam-policy-binding ${orgId} --member="serviceAccount:${serviceAccountEmail}" --role="${role}"`,
      `Assign Org Role: ${role}`,
    )
  }
  await run(
    `gcloud billing accounts add-iam-policy-binding ${billingAccount} --member="serviceAccount:${serviceAccountEmail}" --role="roles/billing.user"`,
    'Assign Billing Role',
  )

  // 9. Workload Identity Pools & Providers
  console.error(
    '[info] === Step 7: Creating Workload Identity Pools and Providers ===',
  )
  const pools = ['dev', 'test', 'sbx', 'prod']
  const poolIds = pools.map((env) => `${projectName}-${env}-pool`)
  const githubProviderId = 'github-actions-provider'
  const localDevProviderId = 'local-developer-provider'

  function githubAttributeCondition() {
    if (githubIdentity.includes('/')) {
      return `assertion.repository == '${githubIdentity}'`
    }
    return `assertion.repository_owner == '${githubIdentity}'`
  }
  function githubPrincipalAttributePart() {
    if (githubIdentity.includes('/')) {
      return `attribute.repository/${githubIdentity}`
    }
    return `attribute.repository_owner/${githubIdentity}`
  }

  for (const [i, poolId] of poolIds.entries()) {
    const poolExists = await workloadIdentityPoolExists(projectId, poolId)
    if (poolExists) {
      console.error(
        `[info] Workload Identity Pool ${poolId} already exists. Skipping creation.`,
      )
    } else {
      await run(
        `gcloud iam workload-identity-pools create ${poolId} --project=${projectId} --location=global --display-name="${projectName}-${pools[i]}-pool" --description="Pool for ${projectName}-${pools[i]} environment"`,
        `Create Pool: ${poolId}`,
      )
    }
    // Provider: GitHub Actions
    const githubProviderExists = await workloadIdentityProviderExists(
      projectId,
      poolId,
      githubProviderId,
    )
    if (githubProviderExists) {
      console.error(
        `[info] Workload Identity Provider ${githubProviderId} in pool ${poolId} already exists. Skipping creation.`,
      )
    } else {
      await run(
        `gcloud iam workload-identity-pools providers create-oidc ${githubProviderId} --project=${projectId} --workload-identity-pool=${poolId} --location=global --issuer-uri="https://token.actions.githubusercontent.com" --allowed-audiences="https://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${githubProviderId}" --display-name="GitHub Actions Provider" --description="Provider for GitHub Actions" --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" --attribute-condition="${githubAttributeCondition()}"`,
        `Create GitHub Provider for Pool: ${poolId}`,
      )
    }
    // Provider: Local Developer (only for dev)
    if (pools[i] === 'dev') {
      const localDevProviderExists = await workloadIdentityProviderExists(
        projectId,
        poolId,
        localDevProviderId,
      )
      if (localDevProviderExists) {
        console.error(
          `[info] Workload Identity Provider ${localDevProviderId} in pool ${poolId} already exists. Skipping creation.`,
        )
      } else {
        await run(
          `gcloud iam workload-identity-pools providers create-oidc ${localDevProviderId} --project=${projectId} --workload-identity-pool=${poolId} --location=global --issuer-uri="https://accounts.google.com" --allowed-audiences="https://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${localDevProviderId}" --display-name="Local Developer Provider" --description="Provider for Local Developers" --attribute-mapping="google.subject=assertion.sub" --attribute-condition="true"`,
          `Create Local Developer Provider for Pool: ${poolId}`,
        )
      }
    }
  }

  // 10. Grant Impersonation Rights
  console.error('[info] === Step 8: Granting Impersonation Rights ===')
  for (const [i, poolId] of poolIds.entries()) {
    const principal = `principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/${githubPrincipalAttributePart()}`
    await run(
      `gcloud iam service-accounts add-iam-policy-binding ${serviceAccountEmail} --project=${projectId} --role="roles/iam.workloadIdentityUser" --member="${principal}"`,
      `Grant Impersonation for Pool: ${poolId}`,
    )
    if (pools[i] === 'dev') {
      const devPrincipal = `principalSet://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/attribute.email/${developerIdentity}`
      await run(
        `gcloud iam service-accounts add-iam-policy-binding ${serviceAccountEmail} --project=${projectId} --role="roles/iam.workloadIdentityUser" --member="${devPrincipal}"`,
        'Grant Impersonation for Local Developer',
      )
    }
  }

  // 11. Create GCS Bucket
  const bucketAlreadyExists = await bucketExists(bucketName)
  if (bucketAlreadyExists) {
    console.error(
      `[info] GCS bucket gs://${bucketName} already exists. Skipping creation.`,
    )
  } else {
    console.error(
      `[info] === Step 9: Creating GCS Bucket: gs://${bucketName} in ${defaultRegion} ===`,
    )
    await run(
      `gcloud storage buckets create gs://${bucketName} --project=${projectId} --location=${defaultRegion}`,
      'Create GCS Bucket',
    )
  }

  // After all steps, collect workload identity providers
  const workloadIdentityProviders: Record<string, string> = {}
  for (const [i, poolId] of poolIds.entries()) {
    workloadIdentityProviders[pools[i]] =
      `projects/${projectId}/locations/global/workloadIdentityPools/${poolId}/providers/${githubProviderId}`
  }

  // Return structured result
  return {
    projectId,
    serviceAccount: serviceAccountEmail,
    projectNumber: projectNumber,
    workloadIdentityProviders,
    terraformStateBucket: bucketName,
    region: defaultRegion,
    regions,
    orgId,
    billingAccount,
    githubIdentity,
    developerIdentity,
    ownerEmails,
  }
}

// CLI entrypoint
if (import.meta.url && process.argv[1] === new URL(import.meta.url).pathname) {
  // 1. Gather raw inputs from env/args
  const rawInputs = {
    projectName: getEnvOrArg('GCP_TOOLS_PROJECT_NAME', 2),
    orgId: getEnvOrArg('GCP_TOOLS_ORG_ID', 3),
    billingAccount: getEnvOrArg('GCP_TOOLS_BILLING_ACCOUNT', 4),
    regions: getEnvOrArg('GCP_TOOLS_REGIONS', 5),
    githubIdentity: getEnvOrArg('GCP_TOOLS_GITHUB_IDENTITY_SPECIFIER', 6),
    developerIdentity: getEnvOrArg('GCP_TOOLS_DEVELOPER_IDENTITY_SPECIFIER', 7),
    ownerEmails: getEnvOrArg('GCP_TOOLS_OWNER_EMAILS', 8),
  }
  // Validate with Zod as before
  const parsed = InputSchema.safeParse(rawInputs)
  if (!parsed.success) {
    console.error('\n❌ ERROR: Invalid input:')
    console.error(parsed.error.format())
    process.exit(1)
  }
  const {
    projectName,
    orgId,
    billingAccount,
    regions,
    githubIdentity,
    developerIdentity,
    ownerEmails,
  } = parsed.data
  const regionList = regions
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  runFoundationProject({
    projectName,
    orgId,
    billingAccount,
    regions: regionList.join(','),
    githubIdentity,
    developerIdentity,
    ownerEmails,
  })
    .then((result) => {
      console.error(JSON.stringify(result, null, 2))
    })
    .catch((err) => fail('Unexpected error in setup script', err))
}
