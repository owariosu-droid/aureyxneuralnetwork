// Dwell and element-aware cooldowns prevent a sweep across controls becoming a sound loop.
export function installHoverSounds({isEnabled,play}) {
 const finePointer=matchMedia('(any-hover: hover) and (any-pointer: fine)');
 const history=new WeakMap();let timer=0,target=null,lastPlayed=-Infinity,keyboard=false;
 const eligible=node=>{
  const control=node instanceof Element?node.closest('button,a[href],summary'):null;
  if(!control||control.disabled||control.getAttribute('aria-disabled')==='true'||control.closest('#sound-dialog,[hidden]'))return null;
  return control;
 };
 function cancel(){clearTimeout(timer);timer=0;target=null;}
 function schedule(control,viaKeyboard=false){
  cancel();if(!control||!isEnabled())return;target=control;
  timer=setTimeout(()=>{
   timer=0;const now=performance.now();
   if(!isEnabled()||control.disabled||control.getAttribute('aria-disabled')==='true'||target!==control||!control.isConnected||!control.getClientRects().length||now-lastPlayed<180||now-(history.get(control)??-Infinity)<650)return;
   if(viaKeyboard?document.activeElement!==control:!control.matches(':hover'))return;
   lastPlayed=now;history.set(control,now);void play('hover');
  },75);
 }
 document.addEventListener('pointerover',event=>{
  if(!event.isTrusted||event.pointerType==='touch'||event.buttons||!finePointer.matches)return;
  const control=eligible(event.target);if(!control||control.contains(event.relatedTarget))return;schedule(control);
 });
 document.addEventListener('pointerout',event=>{const control=eligible(event.target);if(control&&control===target&&!control.contains(event.relatedTarget))cancel()});
 document.addEventListener('pointerdown',()=>{keyboard=false;cancel()},true);
 document.addEventListener('keydown',event=>{if(event.isTrusted&&event.key==='Tab')keyboard=true},true);
 document.addEventListener('focusin',event=>{if(event.isTrusted&&keyboard)schedule(eligible(event.target),true)});
 document.addEventListener('focusout',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 return cancel;
}
