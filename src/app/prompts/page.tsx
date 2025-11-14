'use client';

import React, { useState, useEffect } from 'react';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { usePrompts } from '@/hooks/usePrompts';
import { usePromptFolders } from '@/hooks/usePromptFolders';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/common/Header';
import Pagination from '@/components/common/Pagination';

interface OrganizeResult {
  totalPrompts: number;
  foldersCreated: number;
  promptsSaved: number;
  uncategorized: number;
}

interface CreatedFolder {
  id: string;
  name: string;
  icon: string;
  promptCount: number;
}

export default function PromptHistoryPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'history';

  const [activeTab, setActiveTab] = useState<'history' | 'saved'>(initialTab as 'history' | 'saved');

  // History tab hooks
  const {
    prompts: historyPrompts,
    loading: historyLoading,
    searchQuery: historySearchQuery,
    setSearchQuery: setHistorySearchQuery,
    selectedPrompt: historySelectedPrompt,
    setSelectedPrompt: setHistorySelectedPrompt,
    currentPage: historyCurrentPage,
    totalPages: historyTotalPages,
    total: historyTotal,
    goToPage: historyGoToPage
  } = usePromptHistory();

  // Saved tab hooks
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { folders, loading: foldersLoading, deleteFolder } = usePromptFolders();
  const {
    prompts: savedPrompts,
    loading: savedLoading,
    searchQuery: savedSearchQuery,
    setSearchQuery: setSavedSearchQuery,
    selectedPrompt: savedSelectedPrompt,
    setSelectedPrompt: setSavedSelectedPrompt,
    deletePrompt,
    updatePrompt,
    currentPage: savedCurrentPage,
    totalPages: savedTotalPages,
    total: savedTotal,
    goToPage: savedGoToPage
  } = usePrompts({ folderId: selectedFolderId });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [organizeStatus, setOrganizeStatus] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [organizeResult, setOrganizeResult] = useState<{
    summary: OrganizeResult;
    folders: CreatedFolder[];
  } | null>(null);

  // Update tab from URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'saved') {
      setActiveTab('saved');
    }
  }, [searchParams]);

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUsePrompt = (prompt: string) => {
    // Navigate to home page with prompt in URL params
    const encodedPrompt = encodeURIComponent(prompt);
    window.location.href = `/?prompt=${encodedPrompt}`;
  };

  const handleAiOrganize = async () => {
    if (historyPrompts.length === 0) {
      toast.error('No prompts to organize');
      return;
    }

    setOrganizing(true);
    setOrganizeStatus('Analyzing your prompts...');

    try {
      const { supabase } = await import('@/lib/supabase');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        toast.error('Please sign in first');
        return;
      }

      setOrganizeStatus('AI is categorizing prompts...');

      const response = await fetch('/api/prompts/ai-organize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Organization failed');
      }

      setOrganizeStatus('Saving results...');

      // Show success
      setOrganizeResult(data);
      setShowResult(true);
      toast.success('Organization complete!');

    } catch (error) {
      console.error('AI organize error:', error);
      toast.error(error instanceof Error ? error.message : 'Organization failed, please try again');
    } finally {
      setOrganizing(false);
      setOrganizeStatus('');
    }
  };

  return (
    <React.Fragment>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Prompt History</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Browse and reuse your previous prompts
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAiOrganize}
                  disabled={organizing || historyPrompts.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  {organizing ? 'Organizing...' : '✨ AI Organize'}
                </button>
              </div>
            </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📜 History
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'saved'
                  ? 'text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⭐ Saved ({savedPrompts.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <input
              type="text"
              value={activeTab === 'history' ? historySearchQuery : savedSearchQuery}
              onChange={(e) => activeTab === 'history' ? setHistorySearchQuery(e.target.value) : setSavedSearchQuery(e.target.value)}
              placeholder={activeTab === 'history' ? 'Search your prompt history...' : 'Search saved prompts...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-base text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'history' ? (
          /* History Tab Content */
          <>
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <p className="mt-4 text-gray-600">Loading your prompt history...</p>
              </div>
            ) : historyPrompts.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {historySearchQuery ? 'No prompts found' : 'No prompts yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {historySearchQuery
                    ? 'Try a different search term'
                    : 'Generate some images to see your prompts here'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyPrompts.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setHistorySelectedPrompt(item)}
                    >
                      {/* Thumbnail */}
                      {item.thumbnail_url && (
                        <div className="relative h-48 bg-gray-100">
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-sm text-gray-900 line-clamp-3 mb-3">
                          {item.prompt}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          {item.style && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {item.style}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUsePrompt(item.prompt);
                            }}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Use Prompt
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPrompt(item.prompt, item.id);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            {copiedId === item.id ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={historyCurrentPage}
                  totalPages={historyTotalPages}
                  total={historyTotal}
                  onPageChange={historyGoToPage}
                />
              </>
            )}
          </>
        ) : (
          /* Saved Tab Content */
          <div className="flex gap-6">
            {/* Left: Folder Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📁</span>
                  <span>Folders</span>
                </h3>

                {foldersLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    <p>No folders yet</p>
                    <p className="mt-2 text-xs">Use AI organize to create folders</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* All Prompts */}
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedFolderId === null
                          ? 'bg-yellow-50 text-yellow-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>📋</span>
                          <span>All Prompts</span>
                        </span>
                        <span className="text-xs text-gray-500">{savedPrompts.length}</span>
                      </div>
                    </button>

                    {/* Folder List */}
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedFolderId === folder.id
                            ? 'bg-yellow-50 text-yellow-900 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span>{folder.icon}</span>
                            <span className="truncate">{folder.name}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Right: Saved Prompts List */}
            <main className="flex-1">
              {savedLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  <p className="mt-4 text-gray-600">Loading saved prompts...</p>
                </div>
              ) : savedPrompts.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {savedSearchQuery ? 'No prompts found' : 'No saved prompts yet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {savedSearchQuery
                      ? 'Try a different search term'
                      : 'Use the AI organize button to save and organize your prompts'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedPrompts.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSavedSelectedPrompt(item)}
                      >
                        {/* Thumbnail */}
                        {item.thumbnail_url && (
                          <div className="relative h-48 bg-gray-100">
                            <Image
                              src={item.thumbnail_url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {item.prompt_text}
                          </p>

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUsePrompt(item.prompt_text);
                              }}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                            >
                              Use
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrompt(item.prompt_text, item.id);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                            >
                              {copiedId === item.id ? '✓' : 'Copy'}
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete this prompt?')) {
                                  await deletePrompt(item.id);
                                  toast.success('Prompt deleted');
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={savedCurrentPage}
                    totalPages={savedTotalPages}
                    total={savedTotal}
                    onPageChange={savedGoToPage}
                  />
                </>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Loading Modal */}
      {organizing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI is working...</h3>
              <p className="text-gray-600">{organizeStatus}</p>
              <p className="text-sm text-gray-400 mt-3">This may take a moment, please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && organizeResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🎉</span>
              <span>Organization Complete!</span>
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{organizeResult.summary.totalPrompts}</div>
                <div className="text-sm text-gray-600 mt-1">Total Prompts</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{organizeResult.summary.foldersCreated}</div>
                <div className="text-sm text-gray-600 mt-1">Folders Created</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{organizeResult.summary.promptsSaved}</div>
                <div className="text-sm text-gray-600 mt-1">Prompts Saved</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-gray-600">{organizeResult.summary.uncategorized}</div>
                <div className="text-sm text-gray-600 mt-1">Uncategorized</div>
              </div>
            </div>

            {/* Folders List */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3">Created Folders:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {organizeResult.folders.map((folder) => (
                  <div key={folder.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-3xl">{folder.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{folder.name}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {folder.promptCount} items
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResult(false);
                  window.location.href = '/prompts?tab=saved';
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 rounded-lg font-medium transition-all"
              >
                View Results
              </button>
              <button
                onClick={() => setShowResult(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - History Tab */}
      {historySelectedPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setHistorySelectedPrompt(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            {historySelectedPrompt.image_url && (
              <div className="relative h-96 bg-gray-100">
                <Image
                  src={historySelectedPrompt.image_url}
                  alt={historySelectedPrompt.title}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Prompt Details</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Text
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {historySelectedPrompt.prompt}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <span>Created: {new Date(historySelectedPrompt.created_at).toLocaleString()}</span>
                {historySelectedPrompt.style && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                    {historySelectedPrompt.style}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUsePrompt(historySelectedPrompt.prompt)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Use This Prompt
                </button>
                <button
                  onClick={() => handleCopyPrompt(historySelectedPrompt.prompt, historySelectedPrompt.id)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {copiedId === historySelectedPrompt.id ? '✓ Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setHistorySelectedPrompt(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Saved Tab */}
      {savedSelectedPrompt && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSavedSelectedPrompt(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            {savedSelectedPrompt.thumbnail_url && (
              <div className="relative h-96 bg-gray-100">
                <Image
                  src={savedSelectedPrompt.thumbnail_url}
                  alt={savedSelectedPrompt.title}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{savedSelectedPrompt.title}</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Text
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {savedSelectedPrompt.prompt_text}
                </p>
              </div>

              {/* Tags */}
              {savedSelectedPrompt.tags && savedSelectedPrompt.tags.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {savedSelectedPrompt.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 mb-6">
                Created: {new Date(savedSelectedPrompt.created_at).toLocaleString()}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUsePrompt(savedSelectedPrompt.prompt_text)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Use This Prompt
                </button>
                <button
                  onClick={() => handleCopyPrompt(savedSelectedPrompt.prompt_text, savedSelectedPrompt.id)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {copiedId === savedSelectedPrompt.id ? '✓ Copied!' : 'Copy'}
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Delete this saved prompt?')) {
                      await deletePrompt(savedSelectedPrompt.id);
                      setSavedSelectedPrompt(null);
                      toast.success('Prompt deleted');
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSavedSelectedPrompt(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </React.Fragment>
);
}
