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
