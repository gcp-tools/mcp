import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { toolRegistry } from './tools/index.js';
import { resourceRegistry } from './resources/index.js';
import { ToolHandlers } from './handlers/tool-handlers.js';
import { ResourceHandlers } from './handlers/resource-handlers.js';
import type { MCPServerConfig } from './types.js';

export class GcpToolsMCPServer {
  private server: Server;

  constructor(config: MCPServerConfig) {
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: config.capabilities,
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(resourceRegistry.values()),
      };
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = resourceRegistry.get(request.params.uri);
      if (!resource) {
        throw new Error(`Resource ${request.params.uri} not found`);
      }

      const content = await ResourceHandlers.getResourceContent(resource.uri);
      return {
        contents: [{
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: content,
        }],
      };
    });

    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(toolRegistry.values()),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = toolRegistry.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`);
      }

      const result = await this.executeTool(request.params.name, request.params.arguments);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    });
  }

  private async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'setup_foundation_project':
        return await ToolHandlers.setupFoundationProject(args);
      case 'scaffold_project':
        return await ToolHandlers.scaffoldProject(args);
      case 'create_github_repository':
        return await ToolHandlers.createGitHubRepository(args);
      case 'setup_github_secrets':
        return await ToolHandlers.setupGitHubSecrets(args);
      case 'push_to_github':
        return await ToolHandlers.pushToGitHub(args);
      case 'create_service':
        return await ToolHandlers.createService(args);
      case 'configure_infrastructure':
        return await ToolHandlers.configureInfrastructure(args);
      case 'deploy_services':
        return await ToolHandlers.deployServices(args);
      case 'monitor_deployment':
        return await ToolHandlers.monitorDeployment(args);
      case 'fix_deployment_issues':
        return await ToolHandlers.fixDeploymentIssues(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GCP Tools MCP Server started');
  }
}
