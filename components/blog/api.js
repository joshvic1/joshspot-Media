export async function blogApi(path,options={}){
  const response=await fetch(`/api/blog/admin/${path}`,{...options,headers:{'Content-Type':'application/json',authorization:localStorage.getItem('adminToken')||'',...options.headers},...(options.body?{body:JSON.stringify(options.body)}:{})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'Unable to complete this request.');return data;
}
export async function uploadImage(file){
  if(!file||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024)throw new Error('Choose a JPEG, PNG, WebP or GIF smaller than 5 MB.');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the image.'));reader.readAsDataURL(file);});
  return (await blogApi('images',{method:'POST',body:{data}})).url;
}
