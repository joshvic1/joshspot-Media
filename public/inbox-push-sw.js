const targetCache='inbox-notification-target-v1';
const targetKey='/crm-inbox-notification-target';
function target(value){try{const u=new URL(value,self.location.origin);return u.origin===self.location.origin&&u.pathname==='/crm-inbox'?u.href:null;}catch{return null;}}
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{let data;try{data=event.data.json()}catch{return}const url=target(data.url||'/crm-inbox');if(!url)return;event.waitUntil(self.registration.showNotification(String(data.title||'Joshspot Inbox').slice(0,100),{body:data.body||'You have an inbox update.',tag:data.tag,data:{url}}));});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=target(event.notification.data?.url||'/crm-inbox');if(!url)return;
 event.waitUntil((async()=>{const cache=await caches.open(targetCache);await cache.put(targetKey,new Response(JSON.stringify({url,at:Date.now()})));
 for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){if(new URL(client.url).pathname==='/crm-inbox'){try{await client.focus();client.postMessage({type:'INBOX_NOTIFICATION_OPEN',url});return;}catch{}}}
 const client=await self.clients.openWindow(url);client?.postMessage({type:'INBOX_NOTIFICATION_OPEN',url});
 })());
});
self.addEventListener('message',event=>{if(!event.source?.url||new URL(event.source.url).origin!==self.location.origin)return;
 if(event.data?.type==='INBOX_NOTIFICATION_READY')event.waitUntil((async()=>{const cache=await caches.open(targetCache),r=await cache.match(targetKey);if(!r)return;const data=await r.json();if(Date.now()-data.at<600000)event.source.postMessage({type:'INBOX_NOTIFICATION_OPEN',url:data.url});else await cache.delete(targetKey);})());
 if(event.data?.type==='INBOX_NOTIFICATION_ACK')event.waitUntil((async()=>{const cache=await caches.open(targetCache),r=await cache.match(targetKey);if(r&&(await r.json()).url===event.data.url)await cache.delete(targetKey);})());
});
