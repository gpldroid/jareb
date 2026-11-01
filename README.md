'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ContentItem, ContentType } from '@/lib/content';
import { getFavorites, saveFavorites, supabase } from '@/lib/supabase';

type FilterValue = 'all' | ContentType | 'favorites';

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'news', label: 'أخبار' },
  { value: 'programming', label: 'برمجة' },
  { value: 'ai', label: 'ذكاء اصطناعي' },
  { value: 'video', label: 'فيديوهات' },
  { value: 'github', label: 'GitHub' },
  { value: 'favorites', label: 'المفضلة' }
];

const STORAGE_KEYS = {
  user: 'jareb-user',
  favorites: 'jareb-favorites',
  accounts: 'jareb-accounts'
};

type AuthMode = 'login' | 'signup';

type AppUser = {
  email: string;
  name?: string;
  id?: string;
};

export function ContentGrid({ initialItems }: { initialItems: ContentItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [user, setUser] = useState<AppUser | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedFavorites = localStorage.getItem(STORAGE_KEYS.favorites);
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);

    if (savedFavorites) {
      try {
        setFavoriteIds(JSON.parse(savedFavorites));
      } catch {
        setFavoriteIds([]);
      }
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as AppUser;
        setUser(parsed);
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favoriteIds));

    if (user?.email && supabase) {
      void saveFavorites(user.email, favoriteIds);
    }
  }, [favoriteIds, user]);

  useEffect(() => {
    if (!user?.email) return;

    const loadSavedFavorites = async () => {
      const saved = await getFavorites(user.email);
      setFavoriteIds(saved);
    };

    void loadSavedFavorites();
  }, [user?.email]);

  const filteredItems = useMemo(() => {
    let nextItems = items;

    if (selectedFilter === 'favorites') {
      nextItems = nextItems.filter((item) => favoriteIds.includes(item.id));
    } else if (selectedFilter !== 'all') {
      nextItems = nextItems.filter((item) => item.type === selectedFilter);
    }

    if (!searchQuery.trim()) {
      return nextItems;
    }

    const query = searchQuery.toLowerCase();
    return nextItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [favoriteIds, items, searchQuery, selectedFilter]);

  async function syncFavoritesToSupabase(ids: string[], emailValue: string) {
    if (!supabase) return;

    try {
      await saveFavorites(emailValue, ids);
    } catch {
      // ignore sync errors; localStorage remains the source of truth
    }
  }

  function handleFavorite(id: string) {
    setFavoriteIds((current) => {
      const exists = current.includes(id);
      const next = exists ? current.filter((itemId) => itemId !== id) : [id, ...current];

      if (user?.email && supabase) {
        void saveFavorites(user.email, next);
      }

      return next;
    });
  }

  function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    if (supabase) {
      void handleSupabaseAuth();
      return;
    }

    const storedAccounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.accounts) ?? '{}') as Record<string, string>;

    if (authMode === 'signup') {
      if (storedAccounts[email]) {
        setMessage('هذا الحساب موجود بالفعل، جرّب تسجيل الدخول');
        return;
      }

      storedAccounts[email] = password;
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(storedAccounts));
      const nextUser: AppUser = { email, name: name || email.split('@')[0] };
      setUser(nextUser);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      setMessage('تم إنشاء الحساب بنجاح');
      return;
    }

    const savedPassword = storedAccounts[email];
    if (!savedPassword || savedPassword !== password) {
      setMessage('بيانات الدخول غير صحيحة');
      return;
    }

    const nextUser: AppUser = { email, name: name || email.split('@')[0] };
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    setMessage('تم تسجيل الدخول بنجاح');
  }

  async function handleSupabaseAuth() {
    try {
      if (!supabase) {
        setMessage('Supabase غير مهيأ بعد. أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY');
        return;
      }

      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0]
            }
          }
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        const nextUser: AppUser = { email, name: name || email.split('@')[0] };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
        setMessage('تم إنشاء الحساب عبر Supabase بنجاح');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return;
      }

      const nextUser: AppUser = {
        email: data.user?.email || email,
        name: data.user?.user_metadata?.full_name || email.split('@')[0],
        id: data.user?.id
      };

      setUser(nextUser);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
      setMessage('تم تسجيل الدخول عبر Supabase بنجاح');

      const saved = await getFavorites(nextUser.email);
      setFavoriteIds(saved);
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(saved));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول');
    }
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.user);
    setMessage('تم تسجيل الخروج بنجاح');
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/60 p-6 shadow-[0_0_40px_rgba(56,189,248,0.12)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">Jareb</p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">Content Hub</h1>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                    {user.name || user.email}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500"
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                  <span>دخول سريع</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mb-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">الحساب</p>
              <h2 className="mt-2 text-2xl font-bold">تسجيل الدخول</h2>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="flex rounded-full border border-slate-700 bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                    authMode === 'login' ? 'bg-sky-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                    authMode === 'signup' ? 'bg-sky-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  إنشاء حساب
                </button>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">الاسم</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none transition focus:border-sky-500"
                    placeholder="اسمك الكامل"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-300">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none transition focus:border-sky-500"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm outline-none transition focus:border-sky-500"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-400"
              >
                {authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </button>
            </form>
          </aside>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">المحتوى</p>
                <h2 className="mt-2 text-2xl font-bold">مصادر البرمجة والذكاء الاصطناعي</h2>
              </div>

              <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                {filteredItems.length} عنصر
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedFilter === filter.value
                        ? 'bg-sky-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <input
                aria-label="Search content"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحث عن عنوان، مصدر أو كلمة..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              />
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center text-slate-300">
                لا توجد عناصر تطابق الفلتر الحالي.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item) => {
                  const isFavorite = favoriteIds.includes(item.id);

                  return (
                    <article
                      key={item.id}
                      className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-4 transition hover:-translate-y-1 hover:border-sky-500/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.12)]"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                          {item.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFavorite(item.id)}
                          aria-label="Toggle favorite"
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            isFavorite
                              ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                              : 'border-slate-700 bg-slate-900 text-slate-300'
                          }`}
                        >
                          {isFavorite ? 'مفضلة' : 'إضافة'}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{item.description}</p>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
                        <span>{item.source}</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sky-400 transition hover:text-sky-300"
                        >
                          فتح ↗
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
