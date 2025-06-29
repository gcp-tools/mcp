import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execCb)

export type PollGithubDeploymentParams = {
  repo: string
  workflow: string
  ref?: string
  interval?: number // seconds
  timeout?: number // seconds
}

export type PollGithubDeploymentResult = {
  status: 'success' | 'failure' | 'cancelled' | 'timeout' | 'error'
  conclusion?: string
  runId?: number
  message?: string
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function pollGithubDeployment({
  repo,
  workflow,
  ref,
  interval = 30,
  timeout = 600,
}: PollGithubDeploymentParams): Promise<PollGithubDeploymentResult> {
  const start = Date.now()
  const deadline = start + timeout * 1000
  let lastConclusion = ''
  let lastRunId = 0
  while (Date.now() < deadline) {
    try {
      let cmd = `gh run list --repo ${repo} --workflow ${workflow} --limit 1 --json status,conclusion,databaseId,headBranch`
      const { stdout } = await exec(cmd)
      const runs = JSON.parse(stdout)
      if (!runs.length) {
        await sleep(interval * 1000)
        continue
      }
      const run = runs[0]
      if (ref && run.headBranch !== ref) {
        await sleep(interval * 1000)
        continue
      }
      lastConclusion = run.conclusion
      lastRunId = run.databaseId
      if (['completed'].includes(run.status)) {
        return {
          status: run.conclusion || 'success',
          conclusion: run.conclusion,
          runId: run.databaseId,
          message: `Workflow completed with status: ${run.conclusion}`,
        }
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Polling failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
    await sleep(interval * 1000)
  }
  return {
    status: 'timeout',
    conclusion: lastConclusion,
    runId: lastRunId,
    message: 'Polling timed out before workflow completed',
  }
}
