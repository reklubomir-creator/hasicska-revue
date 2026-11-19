// Hasičská revue GPS receiver v2.0.0
// Traccar Client: OsmAnd HTTP protocol, e.g. https://<worker>/gps?token=<secret>
// Device ID is taken from 'id' query parameter. Never expose token in public UI.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/health")return json({ok:true,version:"2.0.0"});
  if(url.pathname!=="/gps")return json({error:"Not found"},404);
  if(request.method!=="GET"&&request.method!=="POST")return json({error:"Method not allowed"},405);
  // Traccar OsmAnd sends coordinates in URL query parameters.
  const p=url.searchParams;
  const token=p.get("token")||request.headers.get("x-gps-token");
  const id=p.get("id");
  const lat=Number(p.get("lat")),lon=Number(p.get("lon"));
  if(!token||!id||!p.has("lat")||!p.has("lon")||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return json({error:"Invalid GPS request"},400);
  const device=await env.DB.prepare("SELECT device_id FROM gps_devices WHERE device_id=? AND token_hash=? AND enabled=1").bind(id,await hash(token)).first();
  if(!device)return json({error:"Unauthorized"},401);
  const numeric=k=>p.has(k)&&Number.isFinite(Number(p.get(k)))?Number(p.get(k)):null;
  const now=new Date().toISOString();
  const epoch=numeric("timestamp");
  const recorded=epoch!==null&&epoch>946684800&&epoch<4102444800?new Date(epoch*1000).toISOString():now;
  await env.DB.prepare("INSERT INTO gps_latest (device_id,latitude,longitude,accuracy,speed,recorded_at,received_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(device_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,speed=excluded.speed,recorded_at=excluded.recorded_at,received_at=excluded.received_at").bind(id,lat,lon,numeric("accuracy"),numeric("speed"),recorded,now).run();
  return json({ok:true});
 }
};
