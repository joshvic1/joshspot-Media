export async function inboxApi(path, options = {}) {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('crmToken');
  const response = await fetch(`/api/inbox${path}`, { signal: AbortSignal.timeout(30000), ...options, headers: { Authorization: `Bearer ${token || ''}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {}) });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw Object.assign(new Error(result.message || 'Something went wrong. Please try again.'), { status: response.status });
  }
  return options.blob ? response.blob() : response.json();
}
export const initials = (name) => (name || '?').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
export const shortTime = (date) => date ? new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(date)) : '';
export const fullDate = (date) => date ? new Date(date).toLocaleString() : '—';
export const isReplyWindowOpen = (date) => Boolean(date && Date.now() - new Date(date).getTime() < 86400000);
export const relativeTime = (date) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  return minutes < 1 ? 'Now' : minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.floor(minutes / 60)}h` : new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
export const dayLabel = (date) => {
  const day = new Date(date); const today = new Date(); const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  return day.toDateString() === today.toDateString() ? 'Today' : day.toDateString() === yesterday.toDateString() ? 'Yesterday' : day.toLocaleDateString(undefined, { month: 'long', day: 'numeric', ...(day.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
};
