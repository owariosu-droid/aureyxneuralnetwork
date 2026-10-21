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
function button(text, action) { const node = element('button', text, 'secondary'); node.type = 'button'; node.onclick = async () => { node.disabled = true; try { await action(); } catch (e) { $('#proof-status').textContent = e.message; } finally { node.disabled = false; } }; return node; }
async function render() {
  const works = await store('readonly', s => s.getAll()), list = $('#vault-list'); list.replaceChildren();
  if (!works.length) list.append(element('p', 'Your vault is quiet. Save your first original above.', 'empty-vault'));
  works.sort((a,b) => b.deviceTime.localeCompare(a.deviceTime));
  for (const work of works) {
    const card = element('article', '', 'work-card');
    card.append(element('span', work.audio ? 'RECORD + ORIGINAL · LOCAL' : 'FINGERPRINT RECORD · LOCAL', 'eyebrow'), element('h3', work.title || work.file), element('p', `${work.artist} · ${work.file} · ${(work.bytes / 1048576).toFixed(2)} MB`), element('p', `Device date: ${new Date(work.deviceTime).toLocaleString()}`), element('code', work.sha256));
    if (work.notes) card.append(element('p', work.notes));
    const actions = element('div', '', 'vault-actions');
    actions.append(button('Export record ↗', () => json(metadata(work), `${work.file}.nox.json`)));
    if (work.audio) actions.append(button('Download original ↓', () => download(work.audio, work.file)));
    const remove = button('Delete', () => { const confirm = element('div', '', 'delete-confirm'); confirm.append(element('p', 'Remove this record and its stored audio from this browser? Keep a backup first.'), button('Keep it', () => confirm.remove()), button('Delete permanently', async () => { await store('readwrite', s => s.delete(work.sha256)); await render(); })); card.append(confirm); remove.disabled = true; });
    actions.append(remove); card.append(actions); list.append(card);
  }
}
$('#create-proof').onclick = async () => {
  const status = $('#proof-status'), artist = $('#artist').value.trim(), file = $('#proof-file').files[0], button = $('#create-proof');
  if (!artist || !file) { status.textContent = 'Enter a rights holder and select an audio file first.'; return; }
  button.disabled = true; status.textContent = 'Fingerprinting and saving locally…';
  try {
    const sha256 = await digest(file), existing = await store('readonly', s => s.get(sha256));
    if (existing) { status.textContent = 'This exact file is already in your vault. Your existing record has been preserved.'; return; }
    const record = { schema: 'nox-local-fingerprint-v1', title: $('#work-title').value.trim() || file.name, artist, notes: $('#notes').value.trim(), file: file.name, bytes: file.size, sha256, deviceTime: new Date().toISOString(), notice };
    if ($('#keep-audio').checked) record.audio = file;
    await store('readwrite', s => s.add(record)); await render();
    status.textContent = 'Saved in this browser. Export your record and any stored audio for an independent backup.';
  } catch (e) { status.textContent = `Could not save: ${e.name === 'QuotaExceededError' ? 'Browser storage is full. Export backups or save the fingerprint without audio.' : e.message}`; }
  finally { button.disabled = false; }
};
$('#backup-vault').onclick = async () => { try { const works = await store('readonly', s => s.getAll()); if (!works.length) { $('#proof-status').textContent = 'Save a work before exporting your records.'; return; } json({ schema: 'nox-records-backup-v1', records: works.map(metadata), notice: 'Metadata only. Download original audio separately.' }, 'nox-vault-records.json'); } catch { $('#proof-status').textContent = 'Could not read the vault. Browser storage may be unavailable.'; } };
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
