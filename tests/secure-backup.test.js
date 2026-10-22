import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup,sha256} from '../secure-backup.js';
const audio=new Blob(['original song bytes']);
const base={schema:'nox-local-fingerprint-v1',title:'Night',artist:'Aureyx',file:'night.wav',bytes:audio.size,deviceTime:new Date().toISOString(),notes:'session one'};
const password='a long test password';
test('encrypted full backup restores exact metadata and audio; metadata-only entries survive',async()=>{
 const work={...base,sha256:await sha256(audio),audio};
 const otherAudio=new Blob(['other']);const other={...base,file:'other.wav',bytes:otherAudio.size,sha256:await sha256(otherAudio)};
 const encrypted=await encryptBackup([work,other],password);
 assert.equal((await encrypted.text()).includes('Aureyx'),false);
 const restored=await decryptBackup(encrypted,password);assert.equal(restored.length,2);assert.equal(restored[0].artist,'Aureyx');assert.equal(await restored[0].audio.text(),await audio.text());assert.equal(restored[1].audio,undefined);
});
test('wrong passwords and modified ciphertext are rejected',async()=>{
 const encrypted=await encryptBackup([{...base,sha256:await sha256(audio),audio}],password);
 await assert.rejects(decryptBackup(encrypted,'wrong password'),/Wrong password/);
 const bytes=new Uint8Array(await encrypted.arrayBuffer());bytes[bytes.length-1]^=1;
 await assert.rejects(decryptBackup(new Blob([bytes]),password),/damaged backup/);
});
test('export rejects bad stored originals and weak passwords',async()=>{
 await assert.rejects(encryptBackup([{...base,sha256:'a'.repeat(64),audio}],password),/integrity/);
 await assert.rejects(encryptBackup([], 'short'),/12 characters/);
});
test('archive encryption interoperates with Node AES-GCM and PBKDF2',async()=>{
 const {pbkdf2Sync,createDecipheriv}=await import('node:crypto');
 const encrypted=Buffer.from(await (await encryptBackup([{...base,sha256:await sha256(audio),audio}],password)).arrayBuffer());
 const derived=pbkdf2Sync(password,encrypted.subarray(4,20),310000,32,'sha256');
 const decipher=createDecipheriv('aes-256-gcm',derived,encrypted.subarray(20,32));
 decipher.setAuthTag(encrypted.subarray(-16));
 const plain=Buffer.concat([decipher.update(encrypted.subarray(32,-16)),decipher.final()]);
 const header=JSON.parse(plain.subarray(4,4+plain.readUInt32BE(0)).toString());
 assert.equal(header.records[0].artist,'Aureyx');assert.equal(plain.subarray(4+plain.readUInt32BE(0)).toString(),'original song bytes');
});
