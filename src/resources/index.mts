import type { Resource } from '../types.mjs'

export const resources: Resource[] = [
  {
    uri: 'gcp-tools-cdktf:library',
    name: 'GCP Tools CDKTF Library',
    description:
      'Access to gcp-tools-cdktf library structure and documentation',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp-tools-cdktf:example-app',
    name: 'Example Application',
    description: 'Complete example application structure and patterns',
    mimeType: 'application/json',
  },
  {
    uri: 'gcp:projects',
    name: 'GCP Projects',
    description: 'GCP project information and configuration',
    mimeType: 'application/json',
  },
]

export const resourceRegistry = new Map<string, Resource>()
for (const resource of resources) {
  resourceRegistry.set(resource.uri, resource)
}
