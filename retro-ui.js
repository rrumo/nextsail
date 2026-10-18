'use strict';
let effects = false, speaker = null, lastBeep = 0, loadGeneration = 0;
const fxToggle = document.querySelector('#fx-toggle');
function terminalBeep(frequency = 880) {
  if (!effects || performance.now() - lastBeep < 70) return;
  const AudioContextType = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextType) return;
  speaker ||= new AudioContextType();
  if (speaker.state === 'suspended') speaker.resume().catch(() => {});
  if (speaker.state !== 'running') return;
  lastBeep = performance.now();
  const tone = speaker.createOscillator(), gain = speaker.createGain(), now = speaker.currentTime;
  tone.type = 'square'; tone.frequency.value = frequency; gain.gain.setValueAtTime(0.008,now); gain.gain.exponentialRampToValueAtTime(0.0001,now + 0.025);
  tone.connect(gain); gain.connect(speaker.destination); tone.start(now); tone.stop(now + 0.03);
  tone.addEventListener('ended',() => { tone.disconnect(); gain.disconnect(); },{once:true});
}
fxToggle.addEventListener('click',() => { effects = !effects; fxToggle.setAttribute('aria-pressed',String(effects)); fxToggle.textContent = effects ? '[효과음 켬]' : '[효과음 끔]'; terminalBeep(1200); });
document.addEventListener('click',event => { if (event.target.closest('button,a,select')) terminalBeep(660); });
document.addEventListener('pointerover',event => {
  const target = event.target.closest('button,a,select');
  if (target && !target.contains(event.relatedTarget)) terminalBeep(1050);
});
async function showLoadState() {
  const generation = ++loadGeneration, pictures = document.body.classList.contains('music-only') ? [] : [...document.querySelectorAll('.gallery-item img')];
  let complete = 0;
  const status = document.querySelector('#load-status');
  status.textContent = '화면 읽는 중... 0/' + pictures.length;
  await Promise.all(pictures.map(picture => new Promise(resolve => {
    const ready = () => { complete++; if (generation === loadGeneration) status.textContent = '화면 읽는 중... ' + complete + '/' + pictures.length; resolve(); };
    if (picture.complete) ready(); else { picture.addEventListener('load',ready,{once:true}); picture.addEventListener('error',ready,{once:true}); }
  })));
  if (document.fonts) await document.fonts.ready;
  if (generation === loadGeneration) status.textContent = 'READY · 그림 ' + (window.VOYAGE_GALLERY?.length || 0) + '장 / 음악 ' + (window.VOYAGE_MUSIC?.length || 0) + '곡';
}
document.addEventListener('gallery-rendered',showLoadState); showLoadState();
