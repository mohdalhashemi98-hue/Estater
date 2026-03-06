import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { CalendarStatus, Webhook, WebhookLog, WebhookEventType } from '../types';
import {
  Calendar, CheckCircle2, XCircle, RefreshCw, Loader2, Unlink,
  BarChart3, Key, Database, ExternalLink, Trash2,
  Webhook as WebhookIcon, Plus, Send, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Copy
} from 'lucide-react';

interface DldConfig {
  api_key: string | null;
  api_url: string;
  data_source: string;
  last_sync: string | null;
}

export default function CalendarSettings() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const justConnected = searchParams.get('connected') === 'true';

  // Calendar state
  const { data: status, isLoading } = useQuery<CalendarStatus>({
    queryKey: ['calendar-status'],
    queryFn: () => api.get('/calendar/status'),
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get<{ url: string }>('/calendar/auth-url');
      window.location.href = res.url;
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: () => api.post('/calendar/sync/all', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-status'] }),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post('/calendar/disconnect', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-status'] }),
  });

  // DLD state
  const [dldApiKey, setDldApiKey] = useState('');
  const [dldApiUrl, setDldApiUrl] = useState('https://api.dubaipulse.gov.ae');
  const [dldDataSource, setDldDataSource] = useState('sample');

  const { data: dldConfig } = useQuery<DldConfig>({
    queryKey: ['dld-config'],
    queryFn: () => api.get('/config/dld'),
  });

  const saveDldMutation = useMutation({
    mutationFn: (data: any) => api.put('/config/dld', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dld-config'] }),
  });

  const testDldMutation = useMutation({
    mutationFn: () => api.post('/config/dld/test', {}),
  });

  const removeDldMutation = useMutation({
    mutationFn: () => api.del('/config/dld'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dld-config'] });
      setDldApiKey('');
    },
  });

  // Webhook state
  const ALL_EVENTS: WebhookEventType[] = [
    'payment.paid', 'payment.overdue',
    'contract.created', 'contract.renewed', 'contract.terminated', 'contract.created_from_ai',
  ];

  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whSecret, setWhSecret] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [whAllEvents, setWhAllEvents] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);
  const [showN8nGuide, setShowN8nGuide] = useState(false);

  const { data: webhooks = [] } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks'),
  });

  const webhookLogQueries = useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs', expandedLogs],
    queryFn: () => api.get(`/webhooks/${expandedLogs}/logs`),
    enabled: expandedLogs !== null,
  });

  const createWebhookMutation = useMutation({
    mutationFn: (data: any) => api.post('/webhooks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setWhName(''); setWhUrl(''); setWhSecret(''); setWhEvents([]); setWhAllEvents(true);
    },
  });

  const updateWebhookMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/webhooks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => api.del(`/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: number) => api.post(`/webhooks/${id}/test`, {}),
    onSuccess: () => {
      if (expandedLogs !== null) queryClient.invalidateQueries({ queryKey: ['webhook-logs', expandedLogs] });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-accent-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage integrations and data sources</p>
      </div>

      {justConnected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">Google Calendar connected successfully!</p>
        </div>
      )}

      {/* ===== GOOGLE CALENDAR SECTION ===== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Google Calendar</h3>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${status?.connected ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <Calendar className={`w-6 h-6 ${status?.connected ? 'text-emerald-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {status?.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Connected</span>
                      {status.events_synced !== undefined && (
                        <span className="text-sm text-gray-500">&middot; {status.events_synced} events synced</span>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-500">Not connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {status?.connected ? (
              <button
                onClick={() => { if (confirm('Disconnect Google Calendar? Synced events will remain in your calendar.')) disconnectMutation.mutate(); }}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Unlink className="w-4 h-4" /> Disconnect
              </button>
            ) : (
              <button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors"
              >
                {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Sync Actions */}
        {status?.connected && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mt-3 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Sync All Active Contracts</p>
                <p className="text-sm text-gray-500">Creates events for contract end dates, renewal deadlines, and AI milestones.</p>
              </div>
              <button
                onClick={() => syncAllMutation.mutate()}
                disabled={syncAllMutation.isPending}
                className="flex items-center gap-1.5 bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors shrink-0 ml-4"
              >
                {syncAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync All
              </button>
            </div>

            {syncAllMutation.isSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                Synced {(syncAllMutation.data as any)?.synced || 0} event(s) across {(syncAllMutation.data as any)?.contracts || 0} contract(s).
              </div>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        {!status?.connected && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mt-3">
            <h4 className="font-semibold text-gray-900 mb-3">Setup Instructions</h4>
            <ol className="space-y-2 text-sm text-gray-500 list-decimal ml-4">
              <li>Create a project in Google Cloud Console</li>
              <li>Enable the Google Calendar API</li>
              <li>Create OAuth 2.0 credentials (Web application type)</li>
              <li>Add <code className="bg-white px-1 rounded border border-gray-200 text-xs">http://localhost:3000/api/calendar/callback</code> as redirect URI</li>
              <li>Set <code className="bg-white px-1 rounded border border-gray-200 text-xs">GOOGLE_CLIENT_ID</code> and <code className="bg-white px-1 rounded border border-gray-200 text-xs">GOOGLE_CLIENT_SECRET</code> in .env</li>
              <li>Click "Connect" above</li>
            </ol>
          </div>
        )}
      </div>

      {/* ===== DLD MARKET DATA SECTION ===== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Market Data</h3>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${dldConfig?.api_key ? 'bg-accent-50' : 'bg-gray-50'}`}>
              <BarChart3 className={`w-6 h-6 ${dldConfig?.api_key ? 'text-accent-600' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dubai Land Department Data</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {dldConfig?.api_key ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm text-emerald-700">API Key configured</span>
                    <span className="text-sm text-gray-500">&middot; Key: {dldConfig.api_key}</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm text-amber-600">Using sample data</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Data source toggle */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Data Source</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setDldDataSource('sample'); saveDldMutation.mutate({ data_source: 'sample' }); }}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                    (dldConfig?.data_source || 'sample') === 'sample'
                      ? 'border-accent-300 bg-accent-50 text-accent-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Database className="w-4 h-4 mb-1" />
                  <p>Sample Data</p>
                  <p className="text-xs font-normal text-gray-400 mt-0.5">~500 seeded transactions for demo</p>
                </button>
                <button
                  onClick={() => { setDldDataSource('live'); saveDldMutation.mutate({ data_source: 'live' }); }}
                  className={`flex-1 p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                    dldConfig?.data_source === 'live'
                      ? 'border-accent-300 bg-accent-50 text-accent-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 mb-1" />
                  <p>Dubai Pulse API</p>
                  <p className="text-xs font-normal text-gray-400 mt-0.5">Live DLD transaction data</p>
                </button>
              </div>
            </div>

            {/* API Key input */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                <Key className="w-3.5 h-3.5 inline mr-1" />
                Dubai Pulse API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
                  placeholder={dldConfig?.api_key ? dldConfig.api_key : 'Enter your Dubai Pulse API key'}
                  value={dldApiKey}
                  onChange={e => setDldApiKey(e.target.value)}
                />
                <button
                  onClick={() => {
                    saveDldMutation.mutate({ api_key: dldApiKey, api_url: dldApiUrl });
                    setDldApiKey('');
                  }}
                  disabled={!dldApiKey || saveDldMutation.isPending}
                  className="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">API Endpoint</label>
              <input
                type="url"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
                value={dldApiUrl}
                onChange={e => setDldApiUrl(e.target.value)}
                onBlur={() => saveDldMutation.mutate({ api_url: dldApiUrl })}
              />
            </div>

            {/* Test connection */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => testDldMutation.mutate()}
                disabled={testDldMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testDldMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Test Connection
              </button>

              {dldConfig?.api_key && (
                <button
                  onClick={() => { if (confirm('Remove DLD API configuration?')) removeDldMutation.mutate(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {testDldMutation.isSuccess && (
              <div className={`rounded-lg p-3 text-sm ${
                (testDldMutation.data as any)?.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {(testDldMutation.data as any)?.message || (testDldMutation.data as any)?.error}
              </div>
            )}
          </div>
        </div>

        {/* DLD info box */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mt-3">
          <h4 className="font-semibold text-gray-900 mb-3">About DLD Market Data</h4>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Dubai Land Department data powers the Market Data page with real transaction records for properties across the UAE.</p>
            <p><strong className="text-gray-700">Sample mode:</strong> Uses ~500 seeded transactions across 10 major Dubai areas with realistic pricing.</p>
            <p><strong className="text-gray-700">Live mode:</strong> Fetches real-time data from the Dubai Pulse API (requires API key from <a href="https://www.dubaipulse.gov.ae" target="_blank" rel="noopener" className="text-accent-600 hover:underline">dubaipulse.gov.ae</a>).</p>
          </div>
        </div>
      </div>

      {/* ===== WEBHOOKS SECTION ===== */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Webhooks (n8n Integration)</h3>

        {/* Add Webhook Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-50">
              <WebhookIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Register Webhook</h3>
              <p className="text-sm text-gray-500">Send event notifications to n8n or any HTTP endpoint</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
                  placeholder="e.g. n8n Payment Alerts"
                  value={whName}
                  onChange={e => setWhName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Secret (optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
                  placeholder="HMAC signing secret"
                  value={whSecret}
                  onChange={e => setWhSecret(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Webhook URL</label>
              <input
                type="url"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500/20 outline-none"
                placeholder="https://your-n8n-instance.com/webhook/..."
                value={whUrl}
                onChange={e => setWhUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Events</label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whAllEvents}
                  onChange={e => { setWhAllEvents(e.target.checked); if (e.target.checked) setWhEvents([]); }}
                  className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <span className="text-sm text-gray-700">All events</span>
              </label>
              {!whAllEvents && (
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_EVENTS.map(evt => (
                    <label key={evt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whEvents.includes(evt)}
                        onChange={e => {
                          if (e.target.checked) setWhEvents([...whEvents, evt]);
                          else setWhEvents(whEvents.filter(x => x !== evt));
                        }}
                        className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="text-sm text-gray-600 font-mono">{evt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => createWebhookMutation.mutate({
                name: whName,
                url: whUrl,
                secret: whSecret || undefined,
                events: whAllEvents ? '*' : whEvents.join(','),
              })}
              disabled={!whName || !whUrl || createWebhookMutation.isPending || (!whAllEvents && whEvents.length === 0)}
              className="flex items-center gap-2 bg-accent-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow hover:bg-accent-700 disabled:opacity-50 transition-colors"
            >
              {createWebhookMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Webhook
            </button>

            {createWebhookMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {(createWebhookMutation.error as Error).message}
              </div>
            )}
          </div>
        </div>

        {/* Webhook List */}
        {webhooks.length > 0 && (
          <div className="space-y-3 mt-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => updateWebhookMutation.mutate({ id: wh.id, active: !wh.active })}
                        className="shrink-0"
                        title={wh.active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {wh.active ? (
                          <ToggleRight className="w-8 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${wh.active ? 'text-gray-900' : 'text-gray-400'}`}>{wh.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{wh.url}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Events: {wh.events === '*' ? 'All' : wh.events.split(',').length + ' selected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => testWebhookMutation.mutate(wh.id)}
                        disabled={testWebhookMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {testWebhookMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Test
                      </button>
                      <button
                        onClick={() => setExpandedLogs(expandedLogs === wh.id ? null : wh.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {expandedLogs === wh.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Logs
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete webhook "${wh.name}"?`)) deleteWebhookMutation.mutate(wh.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {testWebhookMutation.isSuccess && testWebhookMutation.variables === wh.id && (
                    <div className={`mt-3 rounded-lg p-2.5 text-xs ${
                      (testWebhookMutation.data as any)?.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {(testWebhookMutation.data as any)?.success ? 'Ping successful' : 'Ping failed'} — Status: {(testWebhookMutation.data as any)?.statusCode || 0}
                    </div>
                  )}
                </div>

                {/* Expanded Logs */}
                {expandedLogs === wh.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 max-h-64 overflow-y-auto">
                    {webhookLogQueries.isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    ) : (webhookLogQueries.data?.length || 0) === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No delivery logs yet</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="pb-1.5 font-medium">Event</th>
                            <th className="pb-1.5 font-medium">Status</th>
                            <th className="pb-1.5 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {webhookLogQueries.data?.map(log => (
                            <tr key={log.id}>
                              <td className="py-1.5 font-mono text-gray-600">{log.event}</td>
                              <td className="py-1.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                                  log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {log.success ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                  {log.status_code || 'ERR'}
                                </span>
                              </td>
                              <td className="py-1.5 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* n8n Quick Start Guide */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mt-3">
          <button
            onClick={() => setShowN8nGuide(!showN8nGuide)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="font-semibold text-gray-900">n8n Quick Start Guide</h4>
            {showN8nGuide ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {showN8nGuide && (
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-2">1. Payload Format</p>
                <p className="text-gray-500 mb-1.5">Every webhook POST contains:</p>
                <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto">{`{
  "event": "payment.paid",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": 42,
    "contract_id": 7,
    "amount": 5000,
    "status": "paid",
    "paid_date": "2024-01-15",
    ...
  }
}`}</pre>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">2. HMAC Signature Verification</p>
                <p className="text-gray-500 mb-1.5">If you set a secret, verify the <code className="bg-white px-1 rounded border border-gray-200 text-xs">X-Estater-Signature</code> header:</p>
                <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto">{`// Node.js / n8n Function Node
const crypto = require('crypto');
const secret = 'your-webhook-secret';
const signature = $input.first().headers['x-estater-signature'];
const expected = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify($input.first().body))
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid signature');
}`}</pre>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">3. Inbound API (n8n &rarr; Estater)</p>
                <p className="text-gray-500 mb-1.5">Push data back to Estater using these endpoints. Set <code className="bg-white px-1 rounded border border-gray-200 text-xs">INBOUND_WEBHOOK_SECRET</code> in your .env file.</p>
                <div className="space-y-2">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="font-mono text-xs font-medium text-purple-700 mb-1">POST /api/webhooks/inbound/mark-paid</p>
                    <p className="text-xs text-gray-500">Mark a payment as paid. Header: <code>X-Estater-Secret: your-secret</code></p>
                    <pre className="text-xs font-mono mt-1 text-gray-600">{`{ "payment_id": 42, "payment_method": "bank_transfer", "reference": "TXN-123" }`}</pre>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="font-mono text-xs font-medium text-purple-700 mb-1">POST /api/webhooks/inbound/add-note</p>
                    <p className="text-xs text-gray-500">Append a note to a contract. Header: <code>X-Estater-Secret: your-secret</code></p>
                    <pre className="text-xs font-mono mt-1 text-gray-600">{`{ "contract_id": 7, "note": "Tenant confirmed renewal via WhatsApp" }`}</pre>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">4. Available Event Types</p>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_EVENTS.map(evt => (
                    <div key={evt} className="flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <code className="font-mono">{evt}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
