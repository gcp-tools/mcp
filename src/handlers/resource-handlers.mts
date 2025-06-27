/**
 * Get content for gcp-tools-cdktf library resource
 */
export async function getGcpToolsLibraryContent(): Promise<string> {
  return JSON.stringify(
    {
      name: 'gcp-tools-cdktf',
      version: '1.0.0',
      description: 'Google Cloud Platform tools for CDKTF',
      structure: {
        src: {
          constructs: 'Reusable infrastructure components',
          stacks: {
            infrastructure: 'Core infrastructure stacks',
            projects: 'Project management stacks',
          },
          utils: 'Shared utilities',
        },
        templates: 'Project templates and scaffolding',
        scripts: 'Setup and utility scripts',
      },
      availableConstructs: [
        'CloudRunServiceConstruct',
        'ApiGatewayConstruct',
        'FirestoreConstruct',
        'SqlConstruct',
      ],
      availableStacks: [
        'NetworkInfraStack',
        'IamInfraStack',
        'FirestoreInfraStack',
        'HostProjectStack',
        'DataProjectStack',
        'AppProjectStack',
      ],
      documentation: {
        patterns: 'Multi-project GCP architecture (host/data/app)',
        security: 'Workload Identity, IAM best practices',
        deployment: 'GitHub Actions CI/CD',
      },
    },
    null,
    2,
  )
}

/**
 * Get content for example app resource
 */
export async function getExampleAppContent(): Promise<string> {
  return JSON.stringify(
    {
      name: 'liplan-example',
      description: 'Complete example application using gcp-tools-cdktf',
      structure: {
        iac: {
          projects: 'Project stacks (host, data, app)',
          infrastructure: 'Core infrastructure',
          app: 'Application services',
          ingress: 'Load balancers and ingress',
        },
        services: 'Application services (TypeScript, Rust)',
        scripts: 'Utility scripts',
        '.github': 'CI/CD workflows',
      },
      services: [
        {
          name: 'api',
          language: 'typescript',
          type: 'api',
          endpoints: ['/health', '/api/v1/*'],
        },
        {
          name: 'worker',
          language: 'rust',
          type: 'worker',
          purpose: 'Background processing',
        },
      ],
      infrastructure: {
        host: 'Shared networking and ingress',
        data: 'Database services (Firestore)',
        app: 'Application services (Cloud Run)',
      },
      workflows: ['deploy-infrastructure.yml', 'deploy-services.yml'],
    },
    null,
    2,
  )
}

/**
 * Get content for GCP projects resource
 */
export async function getGcpProjectsContent(): Promise<string> {
  return JSON.stringify(
    {
      projects: {
        host: {
          purpose: 'Shared networking infrastructure',
          services: ['VPC', 'Load Balancers', 'API Gateway'],
          resources: ['Network', 'IAM', 'Ingress'],
        },
        data: {
          purpose: 'Database and data services',
          services: ['Firestore', 'Cloud SQL', 'BigQuery'],
          resources: ['Databases', 'Backups', 'Monitoring'],
        },
        app: {
          purpose: 'Application services',
          services: ['Cloud Run', 'Cloud Functions', 'Pub/Sub'],
          resources: ['Services', 'Topics', 'Queues'],
        },
      },
      serviceAccounts: {
        deployer: 'Service account for deployment',
        runtime: 'Service account for runtime services',
      },
      workloadIdentity: {
        github: 'GitHub Actions integration',
        local: 'Local development integration',
      },
      regions: ['us-central1', 'europe-west1'],
    },
    null,
    2,
  )
}

/**
 * Get content for any resource by URI
 */
export async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case 'gcp-tools-cdktf:library':
      return await getGcpToolsLibraryContent()
    case 'gcp-tools-cdktf:example-app':
      return await getExampleAppContent()
    case 'gcp:projects':
      return await getGcpProjectsContent()
    default:
      throw new Error(`Unknown resource: ${uri}`)
  }
}
