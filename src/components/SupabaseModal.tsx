import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  Terminal, 
  Save, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA 
} from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlTab, setShowSqlTab] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in both Supabase Project URL and Anon Key.' });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Testing Supabase connection...' });

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in both Supabase Project URL and Anon Key.' });
      return;
    }

    saveSupabaseConfig(url.trim(), anonKey.trim());
    setStatusMessage({ type: 'success', text: 'Supabase credentials saved successfully!' });
    onConfigUpdated();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setStatusMessage({ type: 'info', text: 'Supabase disconnected. Switched to Local storage.' });
    onConfigUpdated();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white border border-[#DDD7CD] shadow-elevated p-6 relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1A1815] tracking-tight">
              Supabase Cloud Sync
            </h2>
            <p className="text-xs text-[#8C8476]">
              Real-time cross-device sync & cloud file storage for images & PDFs.
            </p>
          </div>
        </div>

        {/* Nav Tabs: Credentials vs SQL Setup */}
        <div className="flex items-center gap-2 border-b border-[#EBE7E0] pb-2 mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowSqlTab(false)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              !showSqlTab
                ? 'bg-[#1A1815] text-[#FAF9F7]'
                : 'text-[#8C8476] hover:text-[#1A1815]'
            }`}
          >
            Connection Credentials
          </button>
          <button
            type="button"
            onClick={() => setShowSqlTab(true)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              showSqlTab
                ? 'bg-[#1A1815] text-[#FAF9F7]'
                : 'text-[#8C8476] hover:text-[#1A1815]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Database SQL Script</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {!showSqlTab ? (
            <>
              {currentConfig.isFromEnv && (
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Detected credentials from environment variables (.env)</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are loaded. You can override them below if needed.
                    </p>
                  </div>
                </div>
              )}

              {/* URL Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1815] flex items-center justify-between">
                  <span>Supabase Project URL</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-normal text-[#B45309] hover:underline flex items-center gap-0.5"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD7CD] text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono focus:border-[#8C8476]"
                />
              </div>

              {/* Anon Key Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1A1815]">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD7CD] text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono focus:border-[#8C8476]"
                />
                <p className="text-[11px] text-[#8C8476]">
                  Found under Project Settings &rarr; API &rarr; Project API keys (`anon` / `public`).
                </p>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : statusMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* How it works info */}
              <div className="p-3 rounded-lg bg-[#FAF9F7] border border-[#EBE7E0] text-xs text-[#4D473E] space-y-1.5">
                <p className="font-semibold text-[#1A1815]">Why Supabase?</p>
                <p className="text-[11px] leading-relaxed">
                  Supabase provides PostgreSQL database, real-time sync across distant networks, and permanent cloud bucket storage for uploaded images and PDFs.
                </p>
                <p className="text-[11px] leading-relaxed text-[#8C8476]">
                  For deployment on Netlify or Vercel, simply set <code className="bg-white px-1 py-0.5 rounded border border-[#DDD7CD] font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-white px-1 py-0.5 rounded border border-[#DDD7CD] font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in environment variables.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#4D473E]">
                  Run this SQL in your Supabase SQL Editor to initialize the database:
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-xs font-medium text-[#B45309] hover:text-[#92400E] px-2 py-1 rounded bg-amber-50 border border-amber-200"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#1A1815] text-[#FAF9F7] font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-4 pt-3 border-t border-[#EBE7E0] flex items-center justify-between gap-2">
          <div>
            {currentConfig.isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 px-2 py-1.5 rounded hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTesting || !url.trim()}
              onClick={handleTest}
              className="px-3 py-1.5 rounded-lg border border-[#DDD7CD] hover:border-[#1A1815] text-xs font-medium text-[#1A1815] disabled:opacity-40 transition-colors"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1A1815] text-white text-xs font-medium hover:bg-[#2F2B26] transition-colors shadow-paper active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Credentials</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
