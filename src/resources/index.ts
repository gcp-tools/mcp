import type { Resource } from '../types.js';

export const resources: Resource[] = [
  {
    uri: 'gcp-tools-cdktf:library',
    name: 'GCP Tools CDKTF Library',
    description: 'Access to gcp-tools-cdktf library structure and documentation',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp-tools-cdktf:example-app',
    name: 'Example Application',
    description: 'Complete example application structure and patterns',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp-tools-cdktf:templates',
    name: 'Project Templates',
    description: 'Access to project templates and scaffolding patterns',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp:projects',
    name: 'GCP Projects',
    description: 'GCP project information and configuration',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp:deployments',
    name: 'GCP Deployments',
    description: 'Access to deployment status and logs',
    mimeType: 'application/json',
  },
  {
    uri: 'github:gcp-tools',
    name: 'GCP Tools GitHub',
    description: 'Access to gcp-tools-cdktf GitHub repository',
    mimeType: 'application/json',
  },
  {
    uri: 'github:user-repo',
    name: 'User Repository',
    description: 'Access to user\'s application repository',
    mimeType: 'application/json',
  },
];

export const resourceRegistry = new Map<string, Resource>();
resources.forEach(resource => {
  resourceRegistry.set(resource.uri, resource);
});
