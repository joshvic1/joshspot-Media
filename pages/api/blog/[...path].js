export const config={api:{bodyParser:{sizeLimit:'8mb'},responseLimit:'8mb'}};
export default async function handler(req,res){
  const path=(req.query.path||[]).join('/');
  if(!/^(posts(?:\/[a-z0-9-]+)?|sitemap|images\/[a-f\d]{24}|admin\/(posts(?:\/[a-f\d]{24})?|images))$/.test(path))return res.status(404).end();
  if(!['GET','POST','PUT','DELETE'].includes(req.method))return res.status(405).end();
  if(path.startsWith('admin/')&&!req.headers.authorization)return res.status(401).json({message:'Please sign in.'});
  const query=new URLSearchParams();for(const key of ['page','q','status'])if(typeof req.query[key]==='string')query.set(key,req.query[key]);
  const base=(process.env.BACKEND_API_URL||'https://joshspot-media-backend-production.up.railway.app/api').replace(/\/$/,'');
  try{
    const response=await fetch(`${base}/blog/${path}?${query}`,{method:req.method,headers:{'Content-Type':'application/json',...(path.startsWith('admin/')?{authorization:req.headers.authorization}:{})},...(['POST','PUT'].includes(req.method)?{body:JSON.stringify(req.body)}:{}),signal:AbortSignal.timeout(30000)});
    res.setHeader('Cache-Control',path.startsWith('images/')&&response.ok?'public, max-age=31536000, immutable':'no-store');
    for(const name of ['content-type','x-content-type-options','x-robots-tag'])if(response.headers.has(name))res.setHeader(name,response.headers.get(name));
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  }catch{res.status(503).json({message:'Unable to reach the blog service. Please try again.'});}
}
