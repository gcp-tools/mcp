#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testRealSetup() {
  console.log('🚀 Testing GCP Foundation Project Setup with Real Parameters...\n');

  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.mjs'],
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

    // Test foundation project setup with real parameters
    console.log('Setting up GCP foundation project...');
    console.log('⚠️  WARNING: This will create a real GCP project and may incur costs!\n');

    const toolResult = await client.callTool({
      name: 'setup_foundation_project',
      arguments: {
        projectName: 'riskrails',
        orgId: '940074033193',
        billingAccount: '01BDC5-8E63DF-92CA58',
        regions: 'europe-west1',
        githubIdentity: 'ibrokethat',
        developerIdentity: 'ibrokethat.com',
        ownerEmails: 'si@ibrokethat.com',
      },
    });

    console.log('✓ Tool executed successfully');
    const result = JSON.parse(toolResult.content[0].text);
    console.log('\n📋 Results:');
    console.log('  Status:', result.status);
    console.log('  Message:', result.message);
    if (result.projectId) {
      console.log('  Project ID:', result.projectId);
    }
    if (result.serviceAccount) {
      console.log('  Service Account:', result.serviceAccount);
    }
    if (result.workloadIdentityPool) {
      console.log('  Workload Identity Pool:', result.workloadIdentityPool);
    }
    console.log('');

    console.log('🎉 Foundation project setup completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Close the client
    await client.close();
  }
}

testRealSetup().catch(console.error);
