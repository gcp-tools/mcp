import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(execCb)

export async function createGitHubEnvironments({
  repoName,
}: { repoName: string }) {
  const environments = ['dev', 'test', 'sbx', 'prod']
  const results: Array<{ env: string; status: string; error?: string }> = []

  for (const env of environments) {
    try {
      // Check if environment exists
      const { stdout } = await execAsync(
        `gh api repos/${repoName}/environments --jq '.environments[].name'`,
      )
      const existing = stdout
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      if (existing.includes(env)) {
        console.error(
          `[info] Environment '${env}' already exists in ${repoName}. Skipping.`,
        )
        results.push({ env, status: 'exists' })
        continue
      }
      // Create environment
      await execAsync(`gh api -X PUT repos/${repoName}/environments/${env}`)
      console.error(`[info] Created environment '${env}' in ${repoName}.`)
      results.push({ env, status: 'created' })
    } catch (error) {
      console.error(
        `[error] Failed to create environment '${env}' in ${repoName}:`,
        error,
      )
      results.push({ env, status: 'failed', error: String(error) })
    }
  }

  const allCreated = results.every(
    (r) => r.status === 'created' || r.status === 'exists',
  )
  return {
    status: allCreated ? 'success' : 'partial',
    message: allCreated
      ? 'All environments created or already exist.'
      : 'Some environments failed to create.',
    results,
  }
}
