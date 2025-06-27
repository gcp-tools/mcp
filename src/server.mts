import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { getResourceContent } from './handlers/resource-handlers.mjs'
import {
  completeProjectSetup,
  createGitHubRepo,
  installPrerequisites,
  setupFoundationProject,
  setupGitHubSecrets,
} from './handlers/tool-handlers.mjs'
import { resourceRegistry } from './resources/index.mjs'
import { toolRegistry } from './tools/index.mjs'
import type {
  CompleteProjectSetupResult,
  CreateGitHubRepoResult,
  InstallPrerequisitesResult,
  MCPServerConfig,
  SetupFoundationProjectResult,
  SetupGitHubSecretsResult,
} from './types.mjs'

export class GcpToolsMCPServer {
  private server: Server

  constructor(config: MCPServerConfig) {
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: config.capabilities,
      },
    )

    this.setupHandlers()
  }

  private setupHandlers() {
    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(resourceRegistry.values()),
      }
    })

    // Handle resource reading
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const resource = resourceRegistry.get(request.params.uri)
        if (!resource) {
          throw new Error(`Resource ${request.params.uri} not found`)
        }

        const content = await getResourceContent(resource.uri)
        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType,
              text: content,
            },
          ],
        }
      },
    )

    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(toolRegistry.values()),
      }
    })

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = toolRegistry.get(request.params.name)
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`)
      }

      const result = await this.executeTool(
        request.params.name,
        request.params.arguments,
      )
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    })
  }

  private async executeTool(
    name: string,
    args: unknown,
  ): Promise<
    | InstallPrerequisitesResult
    | CreateGitHubRepoResult
    | SetupGitHubSecretsResult
    | CompleteProjectSetupResult
    | SetupFoundationProjectResult
  > {
    switch (name) {
      case 'setup_foundation_project':
        return await setupFoundationProject(
          args as {
            projectName: string
            orgId: string
            billingAccount: string
            region: string
            githubIdentity: string
            developerIdentity: string
          },
        )
      case 'install_prerequisites':
        return await installPrerequisites(
          args as {
            checkOnly?: boolean
            includeOptional?: boolean
          },
        )
      case 'create_github_repo':
        return await createGitHubRepo(
          args as {
            repoName: string
            description?: string
            isPrivate?: boolean
            addReadme?: boolean
            addGitignore?: boolean
            addLicense?: string
            topics?: string[]
          },
        )
      case 'setup_github_secrets':
        return await setupGitHubSecrets(
          args as {
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
            region: string
            orgId?: string
            billingAccount?: string
            ownerEmails?: string
            regions?: string
          },
        )
      case 'complete_project_setup':
        return await completeProjectSetup(
          args as {
            projectName: string
            orgId: string
            billingAccount: string
            region: string
            githubIdentity: string
            developerIdentity: string
            repoDescription?: string
            isPrivate?: boolean
            addLicense?: string
            topics?: string[]
            includeOptionalDeps?: boolean
          },
        )
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport()
      await this.server.connect(transport)
      console.log('GCP Tools MCP Server started')
    } catch (error) {
      console.error('Error starting GCP Tools MCP Server:', error)
      process.exit(1)
    }
  }
}
