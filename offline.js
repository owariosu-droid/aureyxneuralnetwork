const status=document.querySelector('#offline-status');
function show(){status.textContent=navigator.onLine?'Preparing offline access…':'Offline · saved originals remain on this device.';}
show();
async function register(){
 if(!('serviceWorker' in navigator)||!import.meta.env.PROD){status.textContent=import.meta.env.DEV?'Offline app cache is enabled in production builds. Saved files already survive normal browser closure.':'Offline app cache is unavailable in this browser. Keep exported backups.';return}
 try{await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;status.textContent=navigator.onLine?'Offline app ready · reopen Nox on this device without internet.':'Offline · opening from the saved app cache.';}
 catch{status.textContent='Offline app cache could not be prepared. Saved vault files remain local; connect and revisit to retry.';}
}
window.addEventListener('online',register);window.addEventListener('offline',()=>{status.textContent='Offline · use saved originals, verification, and backups on this device.'});register();
