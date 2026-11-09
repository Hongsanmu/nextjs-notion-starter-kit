import 'server-only'

import {
  getBlockCollectionId,
  getBlockTitle,
  getBlockValue,
  getPageProperty,
  getTextContent,
  parsePageId
} from 'notion-utils'

import { mapImageUrl } from './map-image-url'
import { getCanonicalPageId } from './get-canonical-page-id'
import type { ExtendedRecordMap, PageBlock } from './types'

export interface HomepageArticle {
  id: string
  title: string
  date?: string
  icon?: string
  href: string
}

export interface HomepageDatabase {
  id: string
  title: string
  articles: HomepageArticle[]
}

export function getHomepageDatabases(
  recordMap: ExtendedRecordMap,
  rootPageId: string
): HomepageDatabase[] {
  const rootId = parsePageId(rootPageId, { uuid: true })
  const root = rootId ? getBlockValue(recordMap.block[rootId]) : undefined
  const databaseBlocks: import('notion-types').Block[] = []
  const visited = new Set<string>()

  function visit(blockIds: string[] = []) {
    for (const id of blockIds) {
      if (visited.has(id)) continue
      visited.add(id)

      const block = getBlockValue(recordMap.block[id])
      if (!block) continue

      if (
        block.type === 'collection_view' ||
        block.type === 'collection_view_page'
      ) {
        databaseBlocks.push(block)
      } else if (block.type !== 'page') {
        visit(block.content)
      }
    }
  }

  visit(root?.content)

  return databaseBlocks
    .map((databaseBlock): HomepageDatabase | undefined => {
      if (
        databaseBlock.type !== 'collection_view' &&
        databaseBlock.type !== 'collection_view_page'
      ) {
        return undefined
      }

      const collectionId = getBlockCollectionId(databaseBlock, recordMap)
      const viewId = databaseBlock.view_ids?.[0]
      const collection = collectionId
        ? getBlockValue(recordMap.collection?.[collectionId])
        : undefined
      const queries = collectionId
        ? Object.values(recordMap.collection_query?.[collectionId] || {})
        : []
      const query =
        queries.find((result) => result.blockIds?.length) ||
        (viewId
          ? recordMap.collection_query?.[collectionId || '']?.[viewId]
          : undefined)

      if (!collectionId || !query) {
        return undefined
      }

      const blockIds = [
        ...(query.blockIds || []),
        ...(query.collection_group_results?.blockIds || [])
      ]

      const articles = [...new Set(blockIds)]
        .map((id): HomepageArticle | undefined => {
          const block = getBlockValue(recordMap.block[id]) as
            | PageBlock
            | undefined
          if (!block || block.type !== 'page') {
            return undefined
          }

          const title = getBlockTitle(block, recordMap)
          if (!title) {
            return undefined
          }

          const published = getPageProperty<number>(
            'Published',
            block,
            recordMap
          )
          const dateValue =
            typeof published === 'number' ? published : block.last_edited_time
          const date = dateValue ? new Date(dateValue).toISOString() : undefined
          const pageIcon = block.format?.page_icon
          const icon = pageIcon
            ? mapImageUrl(pageIcon, block) || pageIcon
            : undefined
          const pageUuid = parsePageId(id, { uuid: true })
          const canonicalId = pageUuid
            ? getCanonicalPageId(pageUuid, recordMap, { uuid: true })
            : undefined
          if (!canonicalId) {
            return undefined
          }

          return {
            id,
            title,
            date,
            icon,
            href: `/${canonicalId}`
          }
        })
        .filter((article): article is HomepageArticle => !!article)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

      const title = collection ? getTextContent(collection.name) : 'Untitled'

      return { id: collectionId, title, articles }
    })
    .filter((database): database is HomepageDatabase => !!database)
}
