import { navigate } from './navigation.js';
import { encryptBackup, decryptBackup } from './secure-backup.js';
const $ = s => document.querySelector(s);
const notice = 'Self-declared file record. Does not establish authorship, copyright registration, or a trusted timestamp. Device clock only.';
let db;
const ready = new Promise((resolve, reject) => {
  const request = indexedDB.open('nox-vault', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('works', { keyPath: 'sha256' });
  request.onsuccess = () => { db = request.result; resolve(db); };
  request.onerror = () => reject(request.error);
});
async function store(mode, operation) {
  await ready;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('works', mode);
    const request = operation(tx.objectStore('works'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Storage aborted'));
  });
}
async function digest(file) {
  if (file.size > 500 * 1024 * 1024) throw new Error('Choose a file smaller than 500 MB.');
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join('');
}
function metadata(work) { const { audio, ...record } = work; return record; }
function download(data, name) {
  const url = URL.createObjectURL(data), link = document.createElement('a');
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function json(data, name) { download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), name); }
function element(tag, text, cls) { const node = document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; }
function button(text, action) { const node = element('button', text, 'secondary'); node.type = 'button'; node.onclick = async () => { node.disabled = true; try { await action(); } catch (e) { $('#vault-feedback').textContent = e.message; } finally { node.disabled = false; } }; return node; }
async function render() {
  const works = await store('readonly', s => s.getAll()), list = $('#vault-list'); list.replaceChildren();
  $('#vault-count').textContent = `${works.length} ${works.length===1?'work':'works'}`;
  $('#vault-size').textContent = `${(works.reduce((sum,w)=>sum+(w.audio?.size||0),0)/1048576).toFixed(1)} MB`;
  const query=$('#vault-search').value.trim().toLowerCase();
  const filtered=works.filter(w=>[w.title,w.artist,w.file].some(v=>v?.toLowerCase().includes(query)));
  if (works.length && !filtered.length) list.append(element('p','No originals match your search.','empty-vault'));
  if (!works.length) list.append(element('p', 'Your vault is quiet. Save your first original above.', 'empty-vault'));
  works.sort((a,b) => b.deviceTime.localeCompare(a.deviceTime));
  for (const work of filtered) {
    const card = element('article', '', 'work-card');
    card.append(element('span', work.audio ? 'RECORD + ORIGINAL · LOCAL' : 'FINGERPRINT RECORD · LOCAL', 'eyebrow'), element('h3', work.title || work.file), element('p', `${work.artist} · ${work.file} · ${(work.bytes / 1048576).toFixed(2)} MB`), element('p', `Device date: ${new Date(work.deviceTime).toLocaleString()}`), element('code', work.sha256));
    if (work.notes) card.append(element('p', work.notes));
    const actions = element('div', '', 'vault-actions');
    actions.append(button('Export record ↗', () => json(metadata(work), `${work.file}.nox.json`)));
    if (work.audio) {
      actions.append(button('Play offline original',()=>{navigate('/listen');window.dispatchEvent(new CustomEvent('nox-play-original',{detail:new File([work.audio],work.file,{type:work.audio.type||'audio/wav'})}))}));
      actions.append(button('Download original ↓', () => download(work.audio, work.file)));
      actions.append(button('Check stored original', async () => {
        const matches=await digest(work.audio)===work.sha256;
        $('#vault-feedback').textContent=matches?`Integrity verified: ${work.file} matches its fingerprint.`:`Integrity check failed for ${work.file}. Restore an independent backup.`;
      }));
    }
    actions.append(button('Copy fingerprint',async()=>{await navigator.clipboard.writeText(work.sha256);$('#vault-feedback').textContent='Fingerprint copied.'}));
    const remove = button('Delete', () => { const confirm = element('div', '', 'delete-confirm'); confirm.append(element('p', 'Remove this record and its stored audio from this browser? Keep a backup first.'), button('Keep it', () => { confirm.remove(); remove.disabled=false; }), button('Delete permanently', async () => { await store('readwrite', s => s.delete(work.sha256)); await render(); })); card.append(confirm); remove.disabled = true; });
    actions.append(remove); card.append(actions); list.append(card);
  }
}
const saveFields=['#artist','#work-title','#notes','#proof-file','#keep-audio'];
let pendingSave=null, receiptRecord=null, saving=false;
const saveStatus=text=>{$('#proof-status').textContent=text};
function lockFields(lock){for(const selector of saveFields)$(selector).disabled=lock;}
function resetReview(){pendingSave=null;$('#save-review').hidden=true;$('#create-proof').hidden=false;$('#save-receipt').hidden=true;}
for(const selector of saveFields)$(selector).addEventListener('input',resetReview);
$('#edit-save').onclick=()=>{resetReview();$('#artist').focus();saveStatus('Edit your details, then review again. Nothing has been saved yet.')};
$('#create-proof').onclick=async()=>{
 if(saving)return;
 resetReview();const artist=$('#artist').value.trim(),file=$('#proof-file').files[0];
 if(!artist){saveStatus('Enter the artist or rights holder first.');$('#artist').focus();return}
 if(!file){saveStatus('Choose an audio file first.');$('#proof-file').click();return}
 if(!file.size){saveStatus('This file is empty. Choose an original audio file.');return}
 if(file.size>500*1024*1024){saveStatus('Choose a file smaller than 500 MB.');return}
 if(!file.type.startsWith('audio/')&&!/\.(wav|mp3|flac|aiff?|m4a|aac|ogg|opus|weba|webm)$/i.test(file.name)){saveStatus('Choose an audio file such as WAV, MP3, FLAC, or M4A.');return}
 saving=true;lockFields(true);$('#create-proof').disabled=true;saveStatus('1 / 3 · Reading your file and creating its fingerprint…');
 try{
   const hash=await digest(file),existing=await store('readonly',s=>s.get(hash));
   const keepAudio=$('#keep-audio').checked;
   if(existing&&(existing.audio||!keepAudio)){saveStatus('This exact file is already saved. Open your vault to export or back it up. Your existing record is unchanged.');return}
   const estimate=await navigator.storage?.estimate?.().catch(()=>null);
   const available=estimate?.quota!=null&&estimate?.usage!=null?Math.max(0,estimate.quota-estimate.usage):null;
   if(keepAudio&&available!==null&&file.size>available){saveStatus('There may not be enough browser storage for this original. Choose fingerprint-only or free space after backing up.');return}
   const record=existing?{...existing,audio:file}:{schema:'nox-local-fingerprint-v1',title:$('#work-title').value.trim()||file.name,artist,notes:$('#notes').value.trim(),file:file.name,bytes:file.size,sha256:hash,deviceTime:new Date().toISOString(),notice,...(keepAudio?{audio:file}:{})};
   pendingSave={record,upgrade:!!existing};
   $('#review-title').textContent=record.title||record.file;$('#review-details').replaceChildren();
   for(const [label,value] of [['Artist',record.artist],['File',`${record.file} · ${(file.size/1048576).toFixed(2)} MB`],['Saving',keepAudio?'Fingerprint + original audio':'Fingerprint record only — no audio copy'],['Destination','This browser on this device'],['SHA-256',hash]])$('#review-details').append(element('dt',label),element('dd',value));
   $('#review-storage').textContent=(existing?'The fingerprint already exists. This will add its original audio and keep your saved credits and date. ': 'Nothing is saved until you confirm. ')+(available!==null?`Estimated browser space available: ${(available/1048576).toFixed(0)} MB. `:'')+'This is not cloud storage or copyright registration.';
   $('#save-review').hidden=false;$('#create-proof').hidden=true;saveStatus('2 / 3 · Review your file and storage choice, then confirm.');$('#confirm-save').focus();
 }catch(e){saveStatus(`Could not prepare the save: ${e.message}. Your original file is unchanged.`)}
 finally{saving=false;lockFields(false);$('#create-proof').disabled=false}
};
$('#confirm-save').onclick=async()=>{
 if(saving||!pendingSave)return;
 saving=true;lockFields(true);$('#confirm-save').disabled=true;$('#edit-save').disabled=true;
 const {record,upgrade}=pendingSave;let committed=false;
 try{
  await requestDurability();
  saveStatus('3 / 3 · Saving locally and checking the stored copy…');
  if(upgrade){
   await ready;
   await new Promise((resolve,reject)=>{const tx=db.transaction('works','readwrite'),s=tx.objectStore('works');const request=s.get(record.sha256);request.onsuccess=()=>{if(!request.result){tx.abort();return}s.put({...request.result,audio:record.audio})};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('The existing record changed. Review the file again.'))});
  }else await store('readwrite',s=>s.add(record));
  committed=true;
  const stored=await store('readonly',s=>s.get(record.sha256));
  if(!stored||stored.sha256!==record.sha256||(record.audio&&(!stored.audio||await digest(stored.audio)!==record.sha256)))throw new Error('Could not verify the stored copy. Check your vault before retrying.');
  receiptRecord=metadata(stored);pendingSave=null;$('#save-review').hidden=true;$('#save-receipt').hidden=false;
  $('#receipt-title').textContent=stored.title||stored.file;
  $('#receipt-detail').textContent=stored.audio?'Saved and read back successfully: fingerprint + original audio. The stored audio matches your file. Make an encrypted backup in Vault; clearing browser data can erase this copy.':'Saved and read back successfully: fingerprint record only. Your audio has NOT been copied into the vault. Keep your original audio and download this record.';
  saveStatus('Saved and verified on this device. No file was uploaded.');
  await render();$('#receipt-export').focus();
 }catch(e){saveStatus(committed?`The save completed, but verification could not finish: ${e.message}`:`Save did not complete: ${e.name==='QuotaExceededError'?'Browser storage is full. Try fingerprint-only after reviewing.':e.name==='ConstraintError'?'This file was saved in another tab. Open Vault to check it.':e.message}`)}
 finally{saving=false;lockFields(false);$('#confirm-save').disabled=false;$('#edit-save').disabled=false}
};
$('#receipt-export').onclick=()=>{if(receiptRecord)json(receiptRecord,`${receiptRecord.file}.nox.json`)};
$('#save-another').onclick=()=>{resetReview();receiptRecord=null;$('#work-title').value='';$('#notes').value='';$('#proof-file').value='';$('#proof-name').textContent='Choose your original file';saveStatus('Ready for your next original. Your previous record is saved.');$('#work-title').focus()};
$('#backup-vault').onclick = async () => { try { const works = await store('readonly', s => s.getAll()); if (!works.length) { $('#vault-feedback').textContent = 'Save a work before exporting your records.'; return; } json({ schema: 'nox-records-backup-v1', records: works.map(metadata), notice: 'Metadata only. Download original audio separately.' }, 'nox-vault-records.json'); } catch { $('#vault-feedback').textContent = 'Could not read the vault. Browser storage may be unavailable.'; } };
$('#verify').onclick = async () => {
  const status = $('#verify-status'), recordFile = $('#verify-record').files[0], audio = $('#verify-audio').files[0], button = $('#verify');
  if (!recordFile || !audio) { status.textContent = 'Choose both a fingerprint record and an audio file.'; return; }
  button.disabled = true; status.textContent = 'Comparing…';
  try {
    if (recordFile.size > 1048576) throw new Error('The record is too large. Select an individual exported JSON record.');
    const record = JSON.parse(await recordFile.text());
    if (!['nox-local-fingerprint-v1', 'dystofuture-local-fingerprint-v1'].includes(record.schema) || !/^[a-f0-9]{64}$/i.test(record.sha256)) throw new Error('Choose a valid individual fingerprint record.');
    const matches = await digest(audio) === record.sha256.toLowerCase();
    status.textContent = matches ? 'Exact match. This file has the same bytes as the recorded original. This does not verify the identity or authorship claimed in the record.' : 'No match. The file differs from this record. Re-encoding or editing also changes its fingerprint.';
  } catch (e) { status.textContent = `Unable to verify: ${e.message}`; } finally { button.disabled = false; }
};
render().catch(() => { $('#vault-list').textContent = 'Local storage is unavailable. Allow site storage or use a regular browser window to save works.'; });

$('#vault-search').oninput=()=>render().catch(()=>{$('#vault-feedback').textContent='Could not read the vault.'});
async function showDurability(){
 try{const granted=await navigator.storage?.persisted?.();$('#durability-status').textContent=granted?'Durable browser storage granted · still keep independent backups.':'Standard browser storage · files survive normal closing, but may be evicted under storage pressure.'}
 catch{$('#durability-status').textContent='Storage durability could not be checked. Keep exported backups.'}
}
async function requestDurability(){
 try{const granted=await navigator.storage?.persist?.();await showDurability();return !!granted}catch{await showDurability();return false}
}
$('#persist-storage').onclick=async()=>{const granted=await requestDurability();$('#vault-feedback').textContent=granted?'Durable storage granted. Closing the browser keeps your files. Clearing site data still deletes them.':'Durable storage was not granted by this browser. Files still survive normal closure; keep backups against eviction.'};
showDurability();
let backupBusy=false;
async function backupTask(action){if(backupBusy)return;backupBusy=true;$('#encrypted-export').disabled=true;$('#encrypted-restore').disabled=true;try{await action()}catch(e){$('#backup-status').textContent=e.message}finally{backupBusy=false;$('#encrypted-export').disabled=false;$('#encrypted-restore').disabled=false;$('#backup-password').value='';$('#backup-confirm').value=''}}
$('#encrypted-export').onclick=()=>backupTask(async()=>{
 const password=$('#backup-password').value;
 if(password!==$('#backup-confirm').value)throw new Error('Passwords do not match.');
 $('#backup-status').textContent='Checking stored originals and encrypting locally…';
 const archive=await encryptBackup(await store('readonly',s=>s.getAll()),password);
 download(archive,'nox-encrypted-backup.nox');$('#backup-status').textContent='Encrypted backup downloaded. Store it in your cloud drive yourself. Your password has been cleared from the form.';
});
$('#encrypted-restore').onclick=()=>backupTask(async()=>{
 const file=$('#restore-file').files[0];if(!file)throw new Error('Choose an encrypted .nox backup first.');
 $('#backup-status').textContent='Decrypting and verifying all stored audio…';
 const restored=await decryptBackup(file,$('#backup-password').value);await ready;
 const existing=await store('readonly',s=>s.getAll());const hashes=new Set(existing.map(w=>w.sha256));const incoming=restored.filter(w=>!hashes.has(w.sha256));
 await new Promise((resolve,reject)=>{const tx=db.transaction('works','readwrite');for(const work of incoming)tx.objectStore('works').add(work);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Restore aborted. No records were imported.'))});
 await render();$('#backup-status').textContent=`Restored ${incoming.length} works; kept ${restored.length-incoming.length} existing records unchanged. All included audio passed fingerprint verification.`;
});
