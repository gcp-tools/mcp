import { runFoundationProject } from '../../lib/setup-foundation-project.mjs'

export async function runFoundationProjectHandler(args: {
  projectName: string
  orgId: string
  billingAccount: string
  regions: string
  githubIdentity: string
  developerIdentity: string
  ownerEmails: string
}): Promise<any> {
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
      status: 'success',
      ...result,
    }
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
