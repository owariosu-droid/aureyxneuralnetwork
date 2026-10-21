const routes = { '/': { id: 'sanctuary', title: 'Sanctuary' }, '/listen': { id: 'listen', title: 'Listen' }, '/protect': { id: 'protect', title: 'Protect your sound' }, '/vault': { id: 'library', title: 'Your vault' } };
const legacy = { '#protect': '/protect', '#listen': '/listen', '#library': '/vault', '#sanctuary': '/' };
export function navigate(path) {
  if (!routes[path]) path = '/';
  if (location.pathname !== path || location.hash) history.pushState({}, '', path);
  render(true);
}
function render(focus = false) {
  const path = routes[location.pathname] ? location.pathname : '/';
  const route = routes[path];
  document.querySelectorAll('main > section').forEach(section => { section.hidden = section.id !== route.id && !(path === '/' && section.classList.contains('closing')); });
  document.querySelectorAll('nav a[data-route]').forEach(link => {
    const current = link.getAttribute('href') === path;
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.body.dataset.page = route.id;
  document.title = `Nox — ${route.title}`;
  const section = document.getElementById(route.id);
  section.setAttribute('aria-label', route.title);
  const heading = section.querySelector('h1,h2');
  heading.tabIndex = -1;
  if (focus) { window.scrollTo({top:0,behavior:'instant'}); heading.focus({preventScroll:true}); }
  document.querySelector('#now-playing').hidden = path === '/listen' || !document.querySelector('#audio').getAttribute('src');
}
if (legacy[location.hash]) history.replaceState({}, '', legacy[location.hash]);
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]');
  if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); navigate(link.getAttribute('href'));
});
window.addEventListener('popstate', () => render(true));
window.addEventListener('hashchange', () => { if (legacy[location.hash]) navigate(legacy[location.hash]); });
const audio = document.querySelector('#audio');
const toggle = document.querySelector('#dock-toggle');
function updatePlayer() {
  document.querySelector('#now-playing').hidden = location.pathname === '/listen' || !audio.getAttribute('src');
  document.querySelector('#dock-title').textContent = document.querySelector('#song-title').textContent;
  toggle.textContent = audio.paused ? 'Play' : 'Pause';
}
audio.addEventListener('play', updatePlayer); audio.addEventListener('pause', updatePlayer); audio.addEventListener('loadedmetadata', updatePlayer);
toggle.onclick = () => document.querySelector('#play').click();
render();
