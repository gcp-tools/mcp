import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  DependencyCheckResult,
  InstallPrerequisitesResult,
} from '../../types.mjs'

const execAsync = promisify(execCb)

const prerequisites = [
  {
    name: 'terraform',
    check: 'terraform --version',
    install: 'npm install -g terraform',
  },
  {
    name: 'cdktf-cli',
    check: 'cdktf --version',
    install: 'npm install -g cdktf-cli',
  },
  {
    name: 'gcloud',
    check: 'gcloud --version',
    install: 'npm install -g google-cloud-sdk',
  },
  { name: 'gh', check: 'gh --version', install: 'npm install -g gh' },
]

export async function installPrerequisites(): Promise<InstallPrerequisitesResult> {
  const summary: DependencyCheckResult[] = []
  for (const dep of prerequisites) {
    try {
      console.error(`[info] Checking for ${dep.name}...`)
      await execAsync(dep.check)
      console.error(`[info] ${dep.name} is already installed.`)
      summary.push({ name: dep.name, installed: true })
    } catch {
      // Not installed, try to install
      try {
        console.error(`[info] Installing ${dep.name}...`)
        await execAsync(dep.install)
        console.error(`[info] Successfully installed ${dep.name}.`)
        summary.push({ name: dep.name, installed: true })
      } catch (error) {
        console.error(`[error] Failed to install ${dep.name}: ${String(error)}`)
        summary.push({ name: dep.name, installed: false, error: String(error) })
      }
    }
  }
  return {
    summary,
    message: summary.some((d) => !d.installed)
      ? 'Some dependencies failed to install'
      : 'All dependencies installed',
  }
}
