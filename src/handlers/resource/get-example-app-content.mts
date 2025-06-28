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
