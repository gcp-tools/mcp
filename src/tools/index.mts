import type { Tool } from '../types.mjs';

export const tools: Tool[] = [
  {
    name: 'setup_foundation_project',
    description: 'Execute the setup_foundation_project.sh script in GCP',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        orgId: { type: 'string' },
        billingAccount: { type: 'string' },
        region: { type: 'string' },
        githubIdentity: { type: 'string' },
        developerIdentity: { type: 'string' },
      },
      required: ['projectName', 'orgId', 'billingAccount', 'region', 'githubIdentity', 'developerIdentity'],
    },
  },
];

export const toolRegistry = new Map<string, Tool>();
tools.forEach(tool => {
  toolRegistry.set(tool.name, tool);
});
