const enc=new TextEncoder(),dec=new TextDecoder();
export class PrivateVault {
 constructor(){this.db=null;this.key=null;this.name=null;this.generation=0;}
 lock(){this.generation++;this.db?.close();this.db=null;this.key=null;this.name=null;}
 async open(name,password,create=false){
  this.lock();const generation=this.generation;
  name=name.trim().toLowerCase();
  if(!/^[a-z0-9_-]{3,50}$/.test(name))throw new Error('Use a space name with 3–50 letters, numbers, hyphens or underscores.');
  if(password.length<12)throw new Error('Use a passphrase with at least 12 characters.');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(name))),x=>x.toString(16).padStart(2,'0')).join('');
  let missing=false;
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(`nox-private-${hash}`,1);r.onupgradeneeded=()=>{if(!create){missing=true;r.transaction.abort();return}r.result.createObjectStore('settings');r.result.createObjectStore('works',{keyPath:'sha256'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error(missing?'Space not found on this device. Choose Create private space to start a new one.':'Could not open this space.'));});
  try{
   const request=(store,mode,action)=>new Promise((resolve,reject)=>{const tx=db.transaction(store,mode),r=action(tx.objectStore(store));tx.oncomplete=()=>resolve(r?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage operation cancelled.'));});
   let config=await request('settings','readonly',s=>s.get('config'));
   if(config&&create)throw new Error('This space already exists. Choose Unlock instead.');
   if(!config&&!create)throw new Error('Space setup is incomplete.');
   const salt=config?config.salt:crypto.getRandomValues(new Uint8Array(16));
   const material=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
   const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
   if(config){try{const check=await crypto.subtle.decrypt({name:'AES-GCM',iv:config.iv},key,config.seal);if(dec.decode(check)!=='nox-private-space-v1')throw Error();}catch{throw new Error('Space name or passphrase is incorrect.');}}
   else{const iv=crypto.getRandomValues(new Uint8Array(12)),seal=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode('nox-private-space-v1'));await request('settings','readwrite',s=>s.add({salt,iv,seal},'config'));}
   if(generation!==this.generation)throw new Error('Unlock cancelled.');
   this.db=db;this.key=key;this.name=name;this.request=request;
  }catch(e){db.close();throw e;}
 }
 ensure(){if(!this.db||!this.key)throw new Error('Unlock your private space first.');}
 async encode(record){
  this.ensure();const {audio,...metadata}=record;const header=enc.encode(JSON.stringify({metadata,hasAudio:!!audio,audioType:audio?.type||''}));const length=new Uint8Array(4);new DataView(length.buffer).setUint32(0,header.length);
  const bytes=await new Blob([length,header,...(audio?[audio]:[])]).arrayBuffer();const iv=crypto.getRandomValues(new Uint8Array(12));
  return {sha256:record.sha256,iv,payload:await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(record.sha256)},this.key,bytes)};
 }
 async decode(item){
  if(!item)return undefined;this.ensure();const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:item.iv,additionalData:enc.encode(item.sha256)},this.key,item.payload);const length=new DataView(bytes).getUint32(0);const header=JSON.parse(dec.decode(new Uint8Array(bytes,4,length))),record=header.metadata;
  if(record.sha256!==item.sha256)throw new Error('Stored record identity mismatch.');
  if(header.hasAudio)record.audio=new Blob([new Uint8Array(bytes,4+length)],{type:header.audioType});return record;
 }
 async operation(mode,action){
  this.ensure();const generation=this.generation;
  const command=action(Object.fromEntries(['get','getAll','add','put','delete'].map(kind=>[kind,value=>({kind,value})])));
  if(command.kind==='get'||command.kind==='getAll'){
   const result=await this.request('works','readonly',s=>s[command.kind](...(command.kind==='get'?[command.value]:[])));
   const decoded=command.kind==='getAll'?await Promise.all(result.map(r=>this.decode(r))):await this.decode(result);
   if(generation!==this.generation)throw new Error('Space locked.');return decoded;
  }
  const value=command.kind==='delete'?command.value:await this.encode(command.value);
  if(generation!==this.generation)throw new Error('Space locked.');
  return this.request('works','readwrite',s=>s[command.kind](value));
 }
 async addMany(records){this.ensure();const generation=this.generation;const encrypted=await Promise.all(records.map(r=>this.encode(r)));if(generation!==this.generation)throw new Error('Space locked.');await this.request('works','readwrite',s=>{for(const value of encrypted)s.add(value)});}
}
export const privateVault=new PrivateVault();
