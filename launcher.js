const frame = document.getElementById('engine');
const status = document.getElementById('status');
const pairs = [['cat','gato'], ['dog','perro'], ['bird','pájaro'], ['horse','caballo'], ['cow','vaca']];
let sent = false;
window.addEventListener('message', ({origin, source, data}) => {
  if (origin !== location.origin || source !== frame.contentWindow) return;
  if (data?.type === 'BT_INVADERS_READY' && !sent) {
    sent = true;
    source.postMessage({type:'BT_INVADERS_START', pairs:pairs.map(([prompt,target])=>[target,prompt]), language:'es-ES'}, origin);
    status.textContent = 'Fixture sent';
    frame.focus();
  }
  if (data?.type === 'BT_INVADERS_ERROR') status.textContent = 'Fixture rejected';
  if (data?.type === 'BT_INVADERS_SPEAK') status.textContent = 'Pronunciation requested: ' + data.text;
  if (data?.type === 'BT_INVADERS_MENU') location.reload();
});
frame.src = './invaders-game.html';
