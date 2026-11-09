import type { Metadata } from 'next'

import { Homepage } from '@/components/Homepage'
import { getPageData } from '@/lib/get-page-data'
import { getHomepageDatabases } from '@/lib/homepage'
import { createPageMetadata } from '@/lib/page-metadata'

export const revalidate = 10

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata(await getPageData())
}

export default async function HomePage() {
  const pageProps = await getPageData()
  const databases =
    pageProps.recordMap && pageProps.site
      ? getHomepageDatabases(
          pageProps.recordMap,
          pageProps.site.rootNotionPageId
        )
      : []

  return (
    <Homepage
      databases={databases}
      title={pageProps.site?.name || 'Welcome'}
      description={pageProps.site?.description}
    />
  )
}
