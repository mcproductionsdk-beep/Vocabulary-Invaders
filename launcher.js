const frame = document.getElementById('engine');
const status = document.getElementById('status');
const pairs = [['cat','gato'], ['dog','perro'], ['bird','pájaro'], ['horse','caballo'], ['cow','vaca']];
const protocol = 'bt-vocabulary-engine/1';
const engineId = 'vocabulary-invaders';
const sessionId = crypto.randomUUID();
function send(type, requestId, payload = {}) {
  frame.contentWindow.postMessage({protocol,engineId,sessionId,type,requestId,payload},location.origin);
}
window.addEventListener('message', ({origin, source, data}) => {
  if (origin !== location.origin || source !== frame.contentWindow ||
      data?.protocol !== protocol || data.engineId !== engineId) return;
  if (data.type === 'READY') {
    send('INIT','1',{vocabulary:{family:'vocabulary',schemaVersion:1,title:'Isolated fixture',promptLanguage:'en-US',language:'es-ES',pairs},soundOn:true});
  } else if (data.sessionId === sessionId) {
    if (data.type === 'INITIALIZED') send('START','2');
    if (data.type === 'ACK' && data.requestId === '2') {status.textContent = 'Fixture running';frame.focus();}
    if (data.type === 'ERROR') status.textContent = 'Fixture rejected';
    if (data.type === 'SPEAK') status.textContent = 'Pronunciation requested: ' + data.payload.text;
    if (data.type === 'REQUEST_MENU') location.reload();
  }
});
frame.src = './invaders-game.html';
