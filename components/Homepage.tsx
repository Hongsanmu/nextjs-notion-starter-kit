'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { HomepageDatabase } from '@/lib/homepage'

import styles from './Homepage.module.css'

export function Homepage({
  databases,
  title,
  description
}: {
  databases: HomepageDatabase[]
  title: string
  description?: string
}) {
  const [activeId, setActiveId] = React.useState(databases[0]?.id)
  const activeDatabase =
    databases.find(({ id }) => id === activeId) || databases[0]

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.avatar} aria-hidden='true'>
          {title.slice(0, 1)}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </section>

      <nav className={styles.tabs} aria-label='Content categories'>
        {databases.map((database, index) => (
          <button
            className={
              database.id === activeDatabase?.id ? styles.activeTab : ''
            }
            key={database.id}
            type='button'
            onClick={() => setActiveId(database.id)}
            aria-selected={database.id === activeDatabase?.id}
            role='tab'
          >
            <span aria-hidden='true'>{index === 0 ? '✎' : '●'}</span>
            {database.title}
          </button>
        ))}
      </nav>

      {databases.length === 0 ? (
        <p className={styles.empty}>
          No databases found on the root Notion page. Add database views
          directly to the page or inside its columns.
        </p>
      ) : activeDatabase ? (
        <section className={styles.timeline} role='tabpanel'>
          <h2>{activeDatabase.title}</h2>
          {activeDatabase.articles.length ? (
            <div className={styles.articles}>
              {activeDatabase.articles.map((article) => (
                <Link
                  className={styles.article}
                  href={article.href}
                  key={article.id}
                >
                  <span className={styles.articleTitle}>
                    {article.icon?.startsWith('http') ? (
                      <Image src={article.icon} alt='' width={24} height={24} />
                    ) : (
                      <span className={styles.fallbackIcon}>
                        {article.icon || '•'}
                      </span>
                    )}
                    {article.title}
                  </span>
                  {article.date && (
                    <time dateTime={article.date}>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(article.date))}
                    </time>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No published pages in this database.</p>
          )}
        </section>
      ) : null}
    </main>
  )
}
