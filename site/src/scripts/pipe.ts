// First-party ingest pipe — records copy events to Tinybird.
// Naming deliberately avoids ad-blocker filter-list keywords
// (track, analytics, telemetry, metrics, beacon, pixel, collect, stat, signal).

// const PIPE_URL = 'https://api.eu-west-1.aws.tinybird.co/v0/events?name=';
const PIPE_URL = 'https://tb.samber.dev/?name=';
const PIPE_KEY = 'p.eyJ1IjogIjQ1MzY3NjRjLTNiY2MtNDU0My04M2ZjLWM0MDUxZGFhMGM5ZiIsICJpZCI6ICJmOWZjOGQ3Yi05ZGE1LTRiZjEtYjg4YS1mNGFlNTRkNTU3YWUiLCAiaG9zdCI6ICJhd3MtZXUtd2VzdC0xIn0.-zLRexgT8W2-derRM6jVCXzUkz54sMsiOy45WO6GglM';

function uid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

function getUserId(): string {
  try {
    let id = localStorage.getItem('apa_uid');
    if (!id) { id = uid(); localStorage.setItem('apa_uid', id); }
    return id;
  } catch { return 'anon'; }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('apa_sid');
    if (!id) { id = uid(); sessionStorage.setItem('apa_sid', id); }
    return id;
  } catch { return 'anon'; }
}

function bumpSessionCount(): number {
  try {
    const n = parseInt(sessionStorage.getItem('apa_sc') ?? '0', 10);
    sessionStorage.setItem('apa_sc', String(n + 1));
    return n + 1;
  } catch { return 0; }
}

function bumpLifetimeCount(): number {
  try {
    const n = parseInt(localStorage.getItem('apa_lc') ?? '0', 10);
    localStorage.setItem('apa_lc', String(n + 1));
    return n + 1;
  } catch { return 0; }
}

function getPageContext() {
  const path = location.pathname;
  let page_type: 'service' | 'home' | 'guide' | 'other' = 'other';
  if (path.includes('/rules/') && path.split('/').filter(Boolean).length >= 4) {
    page_type = 'service';
  } else if (path.split('/').filter(Boolean).length <= 1) {
    page_type = 'home';
  } else if (['alertmanager', 'blackbox-exporter', 'sleep-peacefully'].some((g) => path.includes(g))) {
    page_type = 'guide';
  }
  return {
    page_path: path,
    page_type,
    referrer: document.referrer || undefined,
    anchor_hash: location.hash || undefined,
  };
}

// Eagerly init IDs on module load so they exist before first copy
getUserId();
getSessionId();

export function record(name: string, data: Record<string, unknown>): void {
  const payload = {
    timestamp: new Date().toISOString(),
    transaction_id: uid(),
    name: "awesome_prometheus_alerts_"+name,
    user_id: getUserId(),
    session_id: getSessionId(),
    session_copy_count: bumpSessionCount(),
    lifetime_copy_count: bumpLifetimeCount(),
    ...data,
    ...getPageContext(),
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    color_scheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    user_agent: navigator.userAgent,
    is_bot: /bot|crawl|spider/i.test(navigator.userAgent),
  };

    fetch(PIPE_URL+"awesome_prometheus_alerts_"+name, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { Authorization: `Bearer ${PIPE_KEY}` },
        keepalive: true,
    }).catch(console.error);
}
