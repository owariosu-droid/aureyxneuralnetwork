const encoder = new TextEncoder(), decoder = new TextDecoder();
const LIMIT = 150 * 1024 * 1024, ITERATIONS = 310000;
export async function sha256(blob) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join('');
}
async function key(password, salt, usage) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, usage);
}
export function validRecord(record) {
  return record && ['nox-local-fingerprint-v1','dystofuture-local-fingerprint-v1'].includes(record.schema) && /^[a-f0-9]{64}$/.test(record.sha256) && typeof record.file==='string' && record.file.length>0 && record.file.length<=1000 && typeof record.artist==='string' && record.artist.length<=150 && Number.isSafeInteger(record.bytes) && record.bytes>=0 && record.bytes<=500*1024*1024 && typeof record.deviceTime==='string' && Number.isFinite(Date.parse(record.deviceTime)) && (record.title===undefined || (typeof record.title==='string' && record.title.length<=1000)) && (record.notes===undefined || (typeof record.notes==='string' && record.notes.length<=5000));
}
export async function encryptBackup(works, password) {
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  if (!works.length) throw new Error('Your vault is empty. Save a work first.');
  const records = [], audioParts = []; let total = 0;
  for (const work of works) {
    const { audio, ...record } = work;
    if (!validRecord(record)) throw new Error('A vault record is invalid. Export its original separately.');
    if (audio) {
      total += audio.size; if (total > LIMIT) throw new Error('This archive exceeds 150 MB. Download originals separately.');
      if (audio.size!==record.bytes || await sha256(audio)!==record.sha256) throw new Error(`Stored audio failed integrity verification: ${record.file}`);
      audioParts.push(audio);
    }
    records.push({ ...record, audioLength: audio?.size ?? null });
  }
  const header = encoder.encode(JSON.stringify({schema:'nox-archive-v1', records}));
  if (header.length>4*1024*1024 || header.length+total+4>LIMIT) throw new Error('Archive is too large. Download originals separately.');
  const length = new Uint8Array(4); new DataView(length.buffer).setUint32(0, header.length);
  const plaintext = await new Blob([length, header, ...audioParts]).arrayBuffer();
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt,['encrypt']),plaintext);
  return new Blob([encoder.encode('NOX1'),salt,iv,encrypted],{type:'application/octet-stream'});
}
export async function decryptBackup(file, password) {
  if (file.size>LIMIT+48 || file.size<52) throw new Error('Invalid backup size.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (decoder.decode(bytes.slice(0,4))!=='NOX1') throw new Error('Choose a Nox encrypted .nox backup.');
  let plain;
  try { plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(20,32)},await key(password,bytes.slice(4,20),['decrypt']),bytes.slice(32)); }
  catch { throw new Error('Wrong password or damaged backup. Nothing was imported.'); }
  const headerLength=new DataView(plain).getUint32(0);
  if (headerLength>4*1024*1024 || headerLength+4>plain.byteLength) throw new Error('Invalid archive header.');
  const header=JSON.parse(decoder.decode(new Uint8Array(plain,4,headerLength)));
  if (header.schema!=='nox-archive-v1' || !Array.isArray(header.records) || header.records.length>10000) throw new Error('Unsupported archive.');
  let offset=4+headerLength; const works=[], hashes=new Set();
  for (const entry of header.records) {
    const {audioLength, ...record}=entry;
    if (!validRecord(record) || hashes.has(record.sha256)) throw new Error('Invalid or duplicate record in backup.');
    hashes.add(record.sha256);
    if (audioLength!==null) {
      if (!Number.isSafeInteger(audioLength)||audioLength<0||audioLength!==record.bytes||offset+audioLength>plain.byteLength) throw new Error('Invalid audio length.');
      record.audio=new Blob([new Uint8Array(plain,offset,audioLength)]);offset+=audioLength;
      if (await sha256(record.audio)!==record.sha256) throw new Error('Audio fingerprint mismatch. Nothing was imported.');
    }
    works.push(record);
  }
  if (offset!==plain.byteLength) throw new Error('Unexpected data in archive.');
  return works;
}
