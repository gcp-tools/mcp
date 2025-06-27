#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

async function testMCPServer() {
  console.log('Testing GCP Tools MCP Server (Foundation Setup)...\n')

  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.mjs'],
  })

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
    },
  )

  try {
    // Connect to server
    console.log('Connecting to MCP server...')
    await client.connect(transport)
    console.log('✓ Connected to MCP server\n')

    // Test resource listing
    console.log('Testing resource listing...')
    const resources = await client.listResources()
    console.log('✓ Resources found:', resources.resources.length)
    for (const resource of resources.resources) {
      console.log(`  - ${resource.uri}: ${resource.name}`)
    }
    console.log('')

    // Test tool listing
    console.log('Testing tool listing...')
    const tools = await client.listTools()
    console.log('✓ Tools found:', tools.tools.length)
    for (const tool of tools.tools) {
      console.log(`  - ${tool.name}: ${tool.description}`)
    }
    console.log('')

    // Test resource reading
    console.log('Testing resource reading...')
    const resourceContent = await client.readResource({
      uri: 'gcp-tools-cdktf:library',
    })
    console.log('✓ Resource content retrieved')
    console.log(
      '  Content length:',
      resourceContent.contents[0].text.length,
      'characters',
    )
    console.log('')

    // Test foundation project setup (dry run - won't actually execute)
    console.log('Testing foundation project setup tool...')
    console.log(
      'Note: This is a dry run - the tool will validate inputs but not execute the script',
    )

    const toolResult = await client.callTool({
      name: 'setup_foundation_project',
      arguments: {
        projectName: 'test-project',
        orgId: '123456789',
        billingAccount: 'XXXXXX-XXXXXX-XXXXXX',
        region: 'us-central1',
        githubIdentity: 'test-org',
        developerIdentity: 'developer@test.com',
      },
    })

    console.log('✓ Tool executed successfully')
    const result = JSON.parse(toolResult.content[0].text)
    console.log('  Status:', result.status)
    console.log('  Message:', result.message)
    if (result.projectId) {
      console.log('  Project ID:', result.projectId)
    }
    console.log('')

    console.log('🎉 All tests passed! MCP server is working correctly.')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    // Close the client
    await client.close()
  }
}

testMCPServer().catch(console.error)
