import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'os'

const exec = promisify(execCb)

export type CreateSkeletonAppResult = {
  status: 'success' | 'failed'
  message: string
  path?: string
  error?: string
}

function replaceInFile(filePath: string, replacements: [string, string][]) {
  let content = readFileSync(filePath, 'utf8')
  let changed = false
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to)
      changed = true
    }
  }
  if (changed) {
    writeFileSync(filePath, content, 'utf8')
  }
}

function walkDir(dir: string, callback: (file: string) => void) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback)
    } else {
      callback(fullPath)
    }
  }
}

export async function createSkeletonApp(args: {
  githubIdentity: string
  projectName: string
  codePath: string
}): Promise<CreateSkeletonAppResult> {
  try {
    const { codePath, githubIdentity, projectName } = args
    const targetPath = join(homedir(), codePath, githubIdentity, projectName)

    if (existsSync(targetPath)) {
      return {
        status: 'failed',
        message: `Target path already exists: ${targetPath}`,
        path: targetPath,
      }
    }

    // Clone the example app
    await exec(`git clone https://github.com/gcp-tools/example-app.git "${targetPath}"`)

    // Run make install in the cloned directory
    await exec('make install', { cwd: targetPath })

    // Replace references in all files
    const replacements: [string, string][] = [
      ['gcp-tools/example-app', `${githubIdentity}/${projectName}`],
      ['gcp-tools-example-app', `${githubIdentity}-${projectName}`],
    ]
    walkDir(targetPath, (file) => {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        replaceInFile(file, replacements)
      }
    })

    // Set new git remote
    await exec(`git remote set-url origin https://github.com/${githubIdentity}/${projectName}.git`, { cwd: targetPath })

    // Commit and push
    await exec('git add .', { cwd: targetPath })
    await exec(`git commit -m "chore: initialize skeleton app for ${githubIdentity}/${projectName}"`, { cwd: targetPath })
    await exec('git push origin main -f', { cwd: targetPath })

    return {
      status: 'success',
      message: `Skeleton app created, rebranded, and pushed to ${githubIdentity}/${projectName}`,
      path: targetPath,
    }
  } catch (error) {
    return {
      status: 'failed',
      message: 'Failed to create skeleton app',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
