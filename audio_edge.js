/**
 * Edge TTS 音频播放器
 * 使用 Python 后端提供的 Edge TTS 服务
 */

import { createAudioPlayer } from './audio.js';

const ttsServerUrl = new URL(window.location.origin);
ttsServerUrl.port = '5000';
const TTS_SERVER = ttsServerUrl.origin;

export function createPlaybackBuffer(context, original) {
  const leadFrames = Math.round(original.sampleRate * 0.8);
  const buffer = context.createBuffer(original.numberOfChannels, leadFrames + original.length, original.sampleRate);
  const cueStart = Math.round(original.sampleRate * 0.52);
  const cueFrames = Math.round(original.sampleRate * 0.12);
  for (let channel = 0; channel < original.numberOfChannels; channel += 1) {
    const samples = buffer.getChannelData(channel);
    samples.set(original.getChannelData(channel), leadFrames);
    for (let frame = 0; frame < cueFrames; frame += 1) {
      const envelope = Math.sin(Math.PI * frame / (cueFrames - 1)) ** 2;
      samples[cueStart + frame] = 0.06 * envelope * Math.sin(2 * Math.PI * 660 * frame / original.sampleRate);
    }
  }
  return buffer;
}

export async function addAudioLeadIn(audioBlob) {
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineContext) return audioBlob;
  try {
    const context = new OfflineContext(1, 1, 24000);
    const original = await context.decodeAudioData(await audioBlob.arrayBuffer());
    const buffer = createPlaybackBuffer(context, original);
    const channels = buffer.numberOfChannels;
    const frameCount = buffer.length;
    const blockAlign = channels * 2;
    const dataSize = frameCount * blockAlign;
    const wav = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wav);
    const writeText = (offset, text) => {
      for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
    };
    writeText(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, dataSize, true);
    for (let channel = 0; channel < channels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let frame = 0; frame < buffer.length; frame += 1) {
        const sample = Math.max(-1, Math.min(1, samples[frame]));
        const offset = 44 + (frame * channels + channel) * 2;
        view.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
      }
    }
    return new Blob([wav], { type: 'audio/wav' });
  } catch (error) {
    console.warn('Audio lead-in unavailable; playing original audio:', error);
    return audioBlob;
  }
}

export function createEdgeAudioPlayer(report) {
  let activeAudio = null;
  let activeUrl = null;
  let playbackId = 0;
  let audioContext = null;
  let activeSource = null;
  let requestController = null;
  const fallbackPlayer = createAudioPlayer(report);

  async function resumeOutput() {
    let resumeTimeout;
    try {
      return await Promise.race([
        audioContext.resume().then(() => audioContext.state === 'running'),
        new Promise((resolve) => { resumeTimeout = setTimeout(() => resolve(false), 1500); }),
      ]);
    } finally {
      clearTimeout(resumeTimeout);
    }
  }

  async function prepareOutput(requestId) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      if (!audioContext || audioContext.state === 'closed') audioContext = new Context();
      const running = await resumeOutput();
      if (requestId !== playbackId || !running) return null;
      return audioContext;
    } catch (error) {
      console.warn('Audio output warmup unavailable:', error);
      return null;
    }
  }

  function stop() {
    playbackId += 1;
    requestController?.abort();
    requestController = null;
    if (activeSource) {
      activeSource.onended = null;
      activeSource.stop();
      activeSource.disconnect();
      activeSource = null;
    }
    fallbackPlayer.stop();
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
      activeAudio = null;
    }
    if (activeUrl) {
      URL.revokeObjectURL(activeUrl);
      activeUrl = null;
    }
    report('');
  }

  async function speak(text, rate = 0.85, onEnd) {
    stop();
    const requestId = playbackId;
    const outputReady = prepareOutput(requestId);
    const controller = new AbortController();
    requestController = controller;
    const requestTimeout = setTimeout(() => controller.abort(), 120000);
    let fellBack = false;
    function fallback() {
      if (requestId !== playbackId || fellBack) return;
      fellBack = true;
      if (activeAudio) {
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.onplaying = null;
        activeAudio.pause();
        activeAudio.removeAttribute('src');
        activeAudio.load();
        activeAudio = null;
      }
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
        activeUrl = null;
      }
      report('在线语音暂不可用，正在尝试内置音频或系统英语语音。');
      fallbackPlayer.speak(text, rate, () => { if (requestId === playbackId) onEnd?.(); });
    }

    try {
      report('正在加载音频……');

      // 调用后端 TTS API
      const response = await fetch(`${TTS_SERVER}/tts`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: 'female',  // 可选: female, male, female-uk, male-uk
          speed: rate,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS 服务错误: ${response.status}`);
      }

      // 获取音频 Blob
      const audioBlob = await response.blob();
      if (!audioBlob.size) throw new Error('TTS returned empty audio');
      if (requestId !== playbackId) return;
      const context = await outputReady;
      if (requestId !== playbackId) return;
      if (context) {
        try {
          const buffer = await context.decodeAudioData(await audioBlob.arrayBuffer());
          if (requestId !== playbackId) return;
          const running = await resumeOutput();
          if (requestId !== playbackId) return;
          if (!running) throw new Error('Audio output is not running');
          const source = context.createBufferSource();
          source.buffer = createPlaybackBuffer(context, buffer);
          source.connect(context.destination);
          activeSource = source;
          source.onended = () => {
            source.disconnect();
            if (requestId !== playbackId || activeSource !== source) return;
            activeSource = null;
            report('播放结束，可以再听一遍。');
            onEnd?.();
          };
          source.start(context.currentTime + 0.02);
          report(rate < 0.85 ? '正在慢速播放……' : '正在播放，请跟着听一听。');
          return;
        } catch (error) {
          if (requestId !== playbackId) return;
          if (activeSource) {
            activeSource.onended = null;
            activeSource.disconnect();
            activeSource = null;
          }
          console.warn('Buffered playback unavailable; trying media playback:', error);
        }
      }
      const playbackBlob = await addAudioLeadIn(audioBlob);
      if (requestId !== playbackId) return;
      const audioUrl = URL.createObjectURL(playbackBlob);

      if (requestId !== playbackId) {
        URL.revokeObjectURL(audioUrl);
        return;
      }
      activeUrl = audioUrl;

      // 播放音频
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      audio.volume = 1;

      audio.onplaying = () => {
        if (requestId === playbackId) {
          report(rate < 0.85 ? '正在慢速播放……' : '正在播放，请跟着听一听。');
        }
      };

      audio.onended = () => {
        if (requestId === playbackId) {
          URL.revokeObjectURL(audioUrl);
          activeUrl = null;
          activeAudio = null;
          report('播放结束，可以再听一遍。');
          onEnd?.();
        }
      };

      audio.onerror = () => {
        fallback();
      };

      await audio.play();

    } catch (error) {
      if (requestId === playbackId) {
        console.error('Edge TTS 播放失败:', error);
        fallback();
      }
    } finally {
      clearTimeout(requestTimeout);
      if (requestController === controller) requestController = null;
    }
  }

  return { speak, stop };
}

/**
 * 检查 TTS 服务是否可用
 */
export async function checkTTSService() {
  try {
    const response = await fetch(`${TTS_SERVER}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 获取可用的语音列表
 */
export async function getAvailableVoices() {
  try {
    const response = await fetch(`${TTS_SERVER}/voices`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
