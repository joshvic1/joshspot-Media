self.addEventListener('push', event => {
  let data;try{data=event.data.json()}catch{return}
  const url = new URL(data.url || '/crm-inbox',self.location.origin);
  if(url.origin!==self.location.origin||url.pathname!=='/crm-inbox')return;
  event.waitUntil(self.registration.showNotification(String(data.title||'Joshspot Inbox').slice(0,100),{body:data.body||'You have an inbox update.',tag:data.tag,data:{url:url.href}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const url=new URL(event.notification.data?.url||'/crm-inbox',self.location.origin);
  if(url.origin!==self.location.origin||url.pathname!=='/crm-inbox')return;
  for(const client of await clients.matchAll({type:'window',includeUncontrolled:true})){
   if(new URL(client.url).pathname==='/crm-inbox'){await client.navigate(url.href);return client.focus()}
  }
  return clients.openWindow(url.href);
 })());
});
