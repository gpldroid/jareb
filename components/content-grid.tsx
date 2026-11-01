'use client';

import { useMemo, useState } from 'react';
import type { ContentItem, ContentType } from '@/lib/content';

export function ContentGrid({ items }: { items: ContentItem[] }) {
  const [typeFilter, setTypeFilter] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [items, searchQuery, typeFilter]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">Jareb</p>
              <h1 className="mt-2 text-3xl font-bold md:text-5xl">Content Hub</h1>
            </div>
            <div className="rounded-full border border-sky-500/50 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
              {items.length} sources collected
            </div>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'news', 'video', 'github'] as ContentType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  typeFilter === type
                    ? 'bg-sky-500 text-slate-950'
                    : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <input
            aria-label="Search content"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by title, source, or keyword..."
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500"
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-10 text-center text-slate-300">
            No content matches your filter. Try another search.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:-translate-y-1 hover:border-sky-500/60 hover:shadow-glow"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-300">
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>

                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{item.description}</p>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <span>{item.source}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sky-400 transition hover:text-sky-300"
                  >
                    Open ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
