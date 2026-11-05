import { lessons } from './lessons.js';

const recordings = new Map(lessons.filter((lesson) => !lesson.book).flatMap((lesson) => [
  [lesson.english, `./audio/${lesson.id}.wav`],
  ...lesson.chunks.map(([text], index) => [text, `./audio/${lesson.id}-chunk-${index}.wav`]),
]));
export const audioFiles = [...recordings.values()];

export function createAudioPlayer(report) {
  let activeAudio = null;
  let activeUtterance = null;
  let timeout;
  let playbackId = 0;

  function stop() {
    playbackId += 1;
    clearTimeout(timeout);
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
      activeAudio = null;
    }
    activeUtterance = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    report('');
  }

  function fallback(text, rate, requestId, onEnd) {
    if (requestId !== playbackId) return;
    clearTimeout(timeout);
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
      activeAudio = null;
    }
    if (!('speechSynthesis' in window)) { report('音频加载失败，请刷新重试，并检查设备音量。'); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => /^en[-_]US$/i.test(voice.lang)) || voices.find((voice) => /^en/i.test(voice.lang)) || null;
    utterance.onstart = () => { if (requestId === playbackId) { clearTimeout(timeout); report('正在播放，请跟着听一听。'); } };
    utterance.onend = () => { if (requestId === playbackId) { clearTimeout(timeout); activeUtterance = null; report('播放结束，可以再听一遍。'); onEnd?.(); } };
    utterance.onerror = () => { if (requestId === playbackId) { clearTimeout(timeout); activeUtterance = null; report('暂时无法播放，请刷新重试，并检查设备音量和英语语音设置。'); } };
    timeout = setTimeout(() => { if (requestId === playbackId) { stop(); report('语音未能启动，请刷新重试，或换用系统浏览器打开。'); } }, 8000);
    report('正在尝试系统语音……');
    try { window.speechSynthesis.resume(); window.speechSynthesis.speak(activeUtterance); }
    catch { stop(); report('暂时无法播放，请刷新后重试。'); }
  }

  function speak(text, rate = 0.85, onEnd) {
    stop();
    const requestId = playbackId;
    const source = recordings.get(text);
    if (!source) { fallback(text, rate, requestId, onEnd); return; }
    const audio = new Audio(source);
    activeAudio = audio;
    audio.volume = 1;
    audio.muted = false;
    audio.playbackRate = rate / 0.85;
    audio.onplaying = () => { if (requestId === playbackId) { clearTimeout(timeout); report(rate < 0.85 ? '正在慢速播放……' : '正在播放，请跟着听一听。'); } };
    audio.onended = () => { if (requestId === playbackId) { clearTimeout(timeout); activeAudio = null; report('播放结束，可以再听一遍。'); onEnd?.(); } };
    const failed = () => { if (requestId === playbackId && activeAudio === audio) fallback(text, rate, requestId, onEnd); };
    audio.onerror = failed;
    timeout = setTimeout(failed, 8000);
    report('正在加载音频……');
    try { audio.play().catch(failed); } catch { failed(); }
  }

  return { speak, stop };
}
