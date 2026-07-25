'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Header from '@/components/common/Header';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKeyRow {
  id: string;
  name: string | null;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const MCP_URL = 'https://www.easynanobanana.com/api/mcp';

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function ApiKeysPage() {
  const { user, loading } = useAuth();
  const t = useTranslations('apiKeys');
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newName, setNewName] = useState('');
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const headers = await authHeader();
    if (!headers.Authorization) return;
    const res = await fetch('/api/keys', { headers });
    const json = await res.json();
    if (json.success) setKeys(json.data);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const createKey = async () => {
    setBusy(true);
    setError(null);
    setPlaintext(null);
    try {
      const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newName || 'Default' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t('createFailed'));
      setPlaintext(json.data.plaintext);
      setNewName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('createFailed'));
    } finally {
      setBusy(false);
    }
  };

  const revokeKey = async (id: string) => {
    const headers = await authHeader();
    await fetch(`/api/keys/${id}`, { method: 'DELETE', headers });
    await load();
  };

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">{t('signInRequired')}</h1>
          <p className="text-gray-600">{t('signInDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mb-8 text-gray-600">{t('intro')}</p>

        {/* Connect hint */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-2 text-sm font-medium text-gray-900">{t('mcpUrlLabel')}</p>
          <code className="block rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">{MCP_URL}</code>
        </div>

        {/* Create */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
            />
            <button
              onClick={createKey}
              disabled={busy}
              className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
            >
              {busy ? t('creating') : t('createBtn')}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {plaintext && (
            <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
              <p className="mb-2 text-sm font-medium text-yellow-800">{t('copyOnce')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-3 py-2 font-mono text-sm text-gray-800">
                  {plaintext}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(plaintext)}
                  className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  {t('copy')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="rounded-xl border border-gray-200 bg-white">
          {keys.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">{t('noKeys')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {k.name || t('untitled')}
                      {k.revoked_at && <span className="ml-2 text-xs text-red-500">{t('revoked')}</span>}
                    </p>
                    <p className="font-mono text-sm text-gray-500">{k.key_prefix}…</p>
                    <p className="text-xs text-gray-400">
                      {k.last_used_at ? t('lastUsed', { date: new Date(k.last_used_at).toLocaleDateString() }) : t('neverUsed')}
                    </p>
                  </div>
                  {!k.revoked_at && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      {t('revoke')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
