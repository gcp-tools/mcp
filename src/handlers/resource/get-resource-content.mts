import { getExampleAppContent } from './get-example-app-content.mjs'
import { getGcpProjectsContent } from './get-gcp-projects-content.mjs'
import { getGcpToolsLibraryContent } from './get-gcp-tools-library-content.mjs'

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
