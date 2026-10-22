import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateVault} from '../private-vault.js';
import {sha256} from '../secure-backup.js';
const audio=new Blob(['a private song'],{type:'audio/wav'});
async function work(){return {schema:'nox-local-fingerprint-v1',title:'Private music',artist:'Alice',file:'private.wav',bytes:audio.size,sha256:await sha256(audio),deviceTime:new Date().toISOString(),audio}}
test('different spaces cannot read each other; closing requires a correct passphrase',async()=>{
 const vault=new PrivateVault(),record=await work();await vault.open('alice-test','alice long password',true);await vault.operation('readwrite',s=>s.add(record));vault.lock();
 await assert.rejects(vault.operation('readonly',s=>s.getAll()),/Unlock/);
 await assert.rejects(vault.open('alice-test','wrong long password'),/incorrect/);
 await vault.open('bob-test','bob long password',true);assert.deepEqual(await vault.operation('readonly',s=>s.getAll()),[]);vault.lock();
 await vault.open('alice-test','alice long password');const restored=await vault.operation('readonly',s=>s.get(record.sha256));assert.equal(restored.artist,'Alice');assert.equal(await restored.audio.text(),'a private song');vault.lock();
});
test('stored records contain encrypted payloads; altered ciphertext cannot decrypt',async()=>{
 const vault=new PrivateVault();await vault.open('tamper-test','a long test password',true);const record=await work();await vault.operation('readwrite',s=>s.add(record));const raw=await vault.request('works','readonly',s=>s.get(record.sha256));assert.equal(raw.artist,undefined);assert.equal(raw.audio,undefined);assert.equal(new TextDecoder().decode(raw.payload).includes('Private music'),false);
 const bytes=new Uint8Array(raw.payload);bytes[bytes.length-1]^=1;raw.payload=bytes.buffer;await vault.request('works','readwrite',s=>s.put(raw));await assert.rejects(vault.operation('readonly',s=>s.getAll()));vault.lock();
});
test('bulk restore aborts atomically when a duplicate conflicts',async()=>{
 const vault=new PrivateVault();await vault.open('atomic-test','a long test password',true);const record=await work();await vault.operation('readwrite',s=>s.add(record));await assert.rejects(vault.addMany([{...record,sha256:'b'.repeat(64)},record]));assert.equal((await vault.operation('readonly',s=>s.getAll())).length,1);vault.lock();
});
