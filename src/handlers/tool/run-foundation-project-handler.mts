import { runFoundationProject } from '../../lib/setup-foundation-project.mjs'
import type { SetupFoundationProjectResult } from '../../types.mts'

export type RunFoundationProjectHandlerResult = SetupFoundationProjectResult

export async function runFoundationProjectHandler(args: {
  projectName: string
  orgId: string
  billingAccount: string
  regions: string
  githubIdentity: string
  developerIdentity: string
  ownerEmails: string
}): Promise<RunFoundationProjectHandlerResult> {
  try {
    // Call the TypeScript implementation directly
    const result = await runFoundationProject({
      projectName: args.projectName,
      orgId: args.orgId,
      billingAccount: args.billingAccount,
      regions: args.regions,
      githubIdentity: args.githubIdentity,
      developerIdentity: args.developerIdentity,
      ownerEmails: args.ownerEmails,
    })
    return {
      ...result,
      workloadIdentityPool: '',
      status: 'success',
      message: 'GCP foundation project setup completed',
    }
  } catch (error) {
    return {
      projectId: '',
      serviceAccount: '',
      workloadIdentityPool: '',
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
