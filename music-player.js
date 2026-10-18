'use strict';
const tracks = window.VOYAGE_MUSIC || [];
const queue = new MusicQueue(tracks.length);
const audio = document.querySelector('#soundtrack');
const seek = document.querySelector('#music-seek');
const musicStatus = document.querySelector('#music-status');
const miniPlayer = document.querySelector('#mini-player');
const trackButtons = [];
const timeLabel = value => { const seconds = Math.max(0, Math.floor(value || 0)); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); };
audio.volume = 0.7;

tracks.forEach((track,index) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'track-row';
  button.setAttribute('aria-label',track.title + ' 재생');
  const number = document.createElement('span'); number.textContent = String(track.id).padStart(2,'0');
  const title = document.createElement('span'); title.textContent = track.title;
  const duration = document.createElement('span'); duration.textContent = timeLabel(track.duration);
  button.append(number,title,duration); button.addEventListener('click',() => { queue.select(index); loadTrack(true); });
  document.querySelector('#track-list').append(button); trackButtons.push(button);
});
function updateTime() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : (tracks[queue.index]?.duration || 0);
  seek.max = String(duration); seek.value = String(audio.currentTime || 0); seek.disabled = !duration || !Number.isFinite(audio.duration);
  seek.setAttribute('aria-valuetext',timeLabel(audio.currentTime) + ' / ' + timeLabel(duration));
  document.querySelector('#elapsed').textContent = timeLabel(audio.currentTime);
  document.querySelector('#duration').textContent = timeLabel(duration);
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration) && audio.duration > 0) {
    try { navigator.mediaSession.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate,position:Math.min(audio.currentTime,audio.duration)}); } catch {}
  }
}
function updatePlayback() {
  document.querySelectorAll('[data-transport="toggle"]').forEach(button => { button.textContent = audio.paused ? '[재생]' : '[일시정지]'; });
  document.body.classList.toggle('music-playing',!audio.paused);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
}
async function playTrack() {
  if (!tracks.length) return;
  try { await audio.play(); }
  catch (error) { if (error.name !== 'AbortError') musicStatus.textContent = '재생을 시작하지 못했습니다. [재생]을 다시 눌러주십시오.'; }
}
function loadTrack(play = false) {
  const track = tracks[queue.index]; if (!track) return;
  audio.src = track.src; audio.loop = queue.repeat === 'one'; audio.load();
  document.querySelector('#track-title').textContent = String(track.id).padStart(2,'0') + '. ' + track.title;
  document.querySelector('#track-description').textContent = track.description;
  const scene = images.find(item => item.filename === track.illustration);
  const artName = scene ? sceneName(scene) : track.title;
  const art = document.querySelector('#music-art'); art.src = track.art; art.alt = track.title + ' · ' + artName;
  document.querySelector('#music-art-caption').textContent = artName;
  document.querySelector('#mini-title').textContent = String(track.id).padStart(2,'0') + '. ' + track.title;
  trackButtons.forEach((button,i) => { button.setAttribute('aria-current',String(i === queue.index)); });
  if ('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') {
    navigator.mediaSession.metadata = new MediaMetadata({title:track.title,artist:'루모 제작',album:'다음 출항은 언제입니까? · 오리지널 사운드트랙',artwork:[{src:new URL(track.art,location.href).href,sizes:'608x416',type:'image/webp'}]});
  }
  updateTime(); updatePlayback(); if (play) playTrack();
}
function nextTrack(automatic = false) {
  if (queue.next(automatic) === null) { audio.pause(); musicStatus.textContent = '마지막 곡까지 들었습니다.'; return; }
  loadTrack(true);
}
function previousTrack() {
  if (queue.previous() !== null) loadTrack(true);
}
document.querySelectorAll('[data-transport]').forEach(button => button.addEventListener('click',() => {
  if (button.dataset.transport === 'previous') previousTrack();
  else if (button.dataset.transport === 'next') nextTrack();
  else if (audio.paused) playTrack(); else audio.pause();
}));
document.querySelector('#repeat-toggle').addEventListener('click',event => {
  const modes = ['all','one','off']; queue.repeat = modes[(modes.indexOf(queue.repeat) + 1) % modes.length];
  audio.loop = queue.repeat === 'one'; event.currentTarget.textContent = '[반복: ' + ({all:'전체',one:'한 곡',off:'끔'}[queue.repeat]) + ']';
});
document.querySelector('#shuffle-toggle').addEventListener('click',event => {
  queue.setShuffle(!queue.shuffle); event.currentTarget.setAttribute('aria-pressed',String(queue.shuffle)); event.currentTarget.textContent = '[셔플: ' + (queue.shuffle ? '켬' : '끔') + ']';
});
document.querySelector('#music-volume').addEventListener('input',event => { audio.volume = Number(event.target.value) / 100; document.querySelector('#volume-value').textContent = event.target.value; });
seek.addEventListener('input',() => { if (Number.isFinite(audio.duration)) { audio.currentTime = Math.min(Number(seek.value),audio.duration); updateTime(); } });
document.querySelector('#music-art-open').addEventListener('click',() => { const track = tracks[queue.index]; if (track) showImage(track.art,track.title + '\n' + document.querySelector('#music-art-caption').textContent); });
document.querySelector('#open-music').addEventListener('click',() => document.querySelector('[data-panel="music"]').click());
document.querySelector('#separate-player').addEventListener('click',() => audio.pause());
audio.addEventListener('play',() => { miniPlayer.hidden = false; document.body.classList.add('has-player'); musicStatus.textContent = '재생 중입니다.'; updatePlayback(); });
audio.addEventListener('pause',() => { if (!audio.ended && audio.currentTime > 0) musicStatus.textContent = '일시정지 중입니다.'; updatePlayback(); });
audio.addEventListener('ended',() => nextTrack(true));
audio.addEventListener('waiting',() => { musicStatus.textContent = '음악 읽는 중...'; });
audio.addEventListener('playing',() => { musicStatus.textContent = '재생 중입니다.'; });
audio.addEventListener('error',() => { musicStatus.textContent = '이 곡을 읽지 못했습니다. 다른 곡을 골라주십시오.'; updatePlayback(); });
audio.addEventListener('loadedmetadata',updateTime); audio.addEventListener('timeupdate',updateTime);
if ('mediaSession' in navigator) {
  for (const [action,handler] of Object.entries({play:playTrack,pause:() => audio.pause(),previoustrack:previousTrack,nexttrack:() => nextTrack(),seekbackward:event => { audio.currentTime = Math.max(0,audio.currentTime - (event.seekOffset || 10)); },seekforward:event => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration,audio.currentTime + (event.seekOffset || 10)); },seekto:event => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0,Math.min(event.seekTime,audio.duration)); }})) {
    try { navigator.mediaSession.setActionHandler(action,handler); } catch {}
  }
}
if (tracks.length) loadTrack();
else { musicStatus.textContent = '곡 목록을 읽지 못했습니다.'; document.querySelectorAll('[data-transport]').forEach(button => { button.disabled = true; }); }
