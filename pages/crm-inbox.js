import {disableInboxPush} from '../components/inbox/NotificationSettings';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CrmLayout from '../components/crm/CrmLayout';
import InboxSkeleton from '../components/inbox/Skeleton';
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
  const logout = async () => { await disableInboxPush().catch(() => {}); localStorage.removeItem('crmToken'); localStorage.removeItem('adminToken'); router.push('/crm-login'); };
  return <CrmLayout active="inbox" compact staff={session?.actor} onLogout={logout}>
    <Head><link rel="manifest" href="/inbox.webmanifest" /><meta name="theme-color" content="#244c9f" /></Head>
    {session ? <InboxWorkspace session={session} /> : error ? <div role="alert" style={{ padding: 32 }}>{error}<p><button onClick={() => window.location.reload()}>Try again</button></p></div> : <InboxSkeleton />}
  </CrmLayout>;
}
