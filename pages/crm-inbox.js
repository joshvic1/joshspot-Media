import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CrmLayout from '../components/crm/CrmLayout';
import InboxWorkspace from '../components/inbox/InboxWorkspace';
import { inboxApi } from '../components/inbox/api';

export default function InboxPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    inboxApi('/session').then((result) => { if (active) setSession(result); }).catch((err) => {
      if (!active) return;
      if (err.status === 401) router.replace('/crm-login?next=/crm-inbox');
      else setError(err.message);
    });
    return () => { active = false; };
  }, [router]);
  const logout = () => { localStorage.removeItem('crmToken'); localStorage.removeItem('adminToken'); router.push('/crm-login'); };
  return <CrmLayout active="inbox" compact staff={session?.actor} onLogout={logout}>
    {session ? <InboxWorkspace session={session} /> : <div role="status" style={{ padding: 32 }}>{error || 'Opening Joshspot Inbox…'}{error && <p><button onClick={() => window.location.reload()}>Try again</button></p>}</div>}
  </CrmLayout>;
}
