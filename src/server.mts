import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { toolRegistry } from './tools/index.mjs';
import { resourceRegistry } from './resources/index.mjs';
import { ToolHandlers } from './handlers/tool-handlers.mjs';
import { ResourceHandlers } from './handlers/resource-handlers.mjs';
import type { MCPServerConfig } from './types.mjs';

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
      case 'install_prerequisites':
        return await ToolHandlers.installPrerequisites(args);
      case 'create_github_repo':
        return await ToolHandlers.createGitHubRepo(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('GCP Tools MCP Server started');
    } catch (error) {
      console.error('Error starting GCP Tools MCP Server:', error);
      process.exit(1);
    }
  }
}
