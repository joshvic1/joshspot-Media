import { useEffect, useRef } from 'react';
import { inboxApi } from './api';

let connected = false;
export function useInboxConnection() {
  useEffect(() => {
    let source; let timer; let stopped = false; let failures = 0; let generation = 0;
    const emit = () => window.dispatchEvent(new Event('inbox-update'));
    const connect = async () => {
      if (stopped || document.hidden) return;
      const version = ++generation;
      try {
        const result = await inboxApi('/events-ticket', { method: 'POST', body: {} });
        if (stopped || document.hidden || version !== generation) return;
        source = new EventSource(result.url);
        source.onmessage = () => { if (stopped || version !== generation) return; connected = true; failures = 0; emit(); };
        source.onerror = () => { if (stopped || version !== generation) return; connected = false; source.close(); timer = setTimeout(connect, Math.min(60000, 2000 * 2 ** failures++)); };
      } catch { if (stopped || version !== generation) return; connected = false; timer = setTimeout(connect, Math.min(60000, 2000 * 2 ** failures++)); }
    };
    const visibility = () => { generation++; clearTimeout(timer); source?.close(); connected = false; if (!document.hidden) connect(); };
    connect(); document.addEventListener('visibilitychange', visibility);
    return () => { stopped = true; generation++; connected = false; clearTimeout(timer); source?.close(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
}

// Serialize refreshes, coalesce bursts and back off failures. SSE is a hint;
// reconciliation also covers reconnect gaps and database change-stream outages.
export function useInboxRefresh(callback, key = '', enabled = true) {
  const latest = useRef(callback); latest.current = callback;
  useEffect(() => {
    if (!enabled) return;
    let stopped = false; let busy = false; let timer; let failures = 0; let last = 0; let dirty = false;
    const run = async () => {
      if (stopped || document.hidden || busy) return;
      busy = true; dirty = false; last = Date.now();
      try { const result = await latest.current(); if (result === false) throw new Error('Refresh failed'); failures = 0; } catch { failures++; }
      finally { busy = false; if (!stopped) { clearTimeout(timer); timer = setTimeout(run, dirty && !failures ? 2000 : Math.min(300000, (connected ? 120000 : 30000) * 2 ** failures)); } }
    };
    const request = () => { if (busy) { dirty = true; return; } if (!busy) { clearTimeout(timer); timer = setTimeout(run, Math.max(0, 2000 - (Date.now() - last))); } };
    run(); window.addEventListener('inbox-update', request); document.addEventListener('visibilitychange', request);
    return () => { stopped = true; clearTimeout(timer); window.removeEventListener('inbox-update', request); document.removeEventListener('visibilitychange', request); };
  }, [key, enabled]);
}
