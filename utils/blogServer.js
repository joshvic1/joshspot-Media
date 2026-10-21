export { siteUrl } from '../config/seo';
export async function blogFetch(path){
  const base=(process.env.BACKEND_API_URL||'https://joshspot-media-backend-production.up.railway.app/api').replace(/\/$/,'');
  const response=await fetch(`${base}/blog/${path}`,{signal:AbortSignal.timeout(12000)});
  if(response.status===404)return null;
  if(!response.ok)throw new Error('Blog unavailable');
  return response.json();
}
