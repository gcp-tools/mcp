#!/usr/bin/env node

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('Testing GCP Tools MCP Server...\n');

  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  // Create client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  try {
    // Connect to server
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('✓ Connected to MCP server\n');

    // Test resource listing
    console.log('Testing resource listing...');
    const resources = await client.listResources();
    console.log('✓ Resources found:', resources.resources.length);
    resources.resources.forEach(resource => {
      console.log(`  - ${resource.uri}: ${resource.name}`);
    });
    console.log('');

    // Test tool listing
    console.log('Testing tool listing...');
    const tools = await client.listTools();
    console.log('✓ Tools found:', tools.tools.length);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test resource reading
    console.log('Testing resource reading...');
    const resourceContent = await client.readResource({
      uri: 'gcp-tools-cdktf:library',
    });
    console.log('✓ Resource content retrieved');
    console.log('  Content length:', resourceContent.contents[0].text.length, 'characters');
    console.log('');

    // Test tool execution
    console.log('Testing tool execution...');
    const toolResult = await client.callTool({
      name: 'scaffold_project',
      arguments: {
        projectName: 'test-project',
        description: 'A test project',
        template: 'basic',
        languages: ['typescript'],
      },
    });
    console.log('✓ Tool executed successfully');
    console.log('  Result:', toolResult.content[0].text.substring(0, 200) + '...');
    console.log('');

    console.log('🎉 All tests passed! MCP server is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close the client
    await client.close();
  }
}

testMCPServer().catch(console.error);
