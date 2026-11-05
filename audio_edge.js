/**
 * Edge TTS 音频播放器
 * 使用 Python 后端提供的 Edge TTS 服务
 */

import { createAudioPlayer } from './audio.js';

const ttsServerUrl = new URL(window.location.origin);
ttsServerUrl.port = '5000';
const TTS_SERVER = ttsServerUrl.origin;

export function createEdgeAudioPlayer(report) {
  let activeAudio = null;
  let activeUrl = null;
  let playbackId = 0;
  const fallbackPlayer = createAudioPlayer(report);

  function stop() {
    playbackId += 1;
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
        signal: AbortSignal.timeout(120000),
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
      const audioUrl = URL.createObjectURL(audioBlob);

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
