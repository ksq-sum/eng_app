#!/usr/bin/env python3
"""
Edge TTS 音频服务器
提供文本转语音API，支持多种语音和语速
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import edge_tts
import asyncio
import os
import hashlib
from pathlib import Path
import logging
from tempfile import NamedTemporaryFile

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置
CACHE_DIR = Path("audio_cache")
CACHE_DIR.mkdir(exist_ok=True)

# 日志配置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 推荐的英语语音
VOICES = {
    "female": "en-US-JennyNeural",      # 女声（美式）
    "male": "en-US-GuyNeural",          # 男声（美式）
    "female-uk": "en-GB-SoniaNeural",   # 女声（英式）
    "male-uk": "en-GB-RyanNeural",      # 男声（英式）
}

def get_cache_filename(text, voice, rate):
    """根据文本、音色和语速生成缓存文件名"""
    key = f"{text}_{voice}_{rate}"
    hash_key = hashlib.md5(key.encode()).hexdigest()
    return CACHE_DIR / f"{hash_key}.mp3"

async def generate_speech(text, voice, rate):
    """生成语音文件"""
    cache_file = get_cache_filename(text, voice, rate)
    if cache_file.exists() and cache_file.stat().st_size > 0:
        logger.info(f"使用缓存: {cache_file}")
        return cache_file
    temporary_file = None
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        with NamedTemporaryFile(dir=CACHE_DIR, suffix=".tmp", delete=False) as output:
            temporary_file = Path(output.name)
        await communicate.save(str(temporary_file))
        if temporary_file.stat().st_size == 0:
            raise RuntimeError("TTS returned empty audio")
        temporary_file.replace(cache_file)
        logger.info(f"生成音频: {cache_file}")
        return cache_file
    except Exception as e:
        logger.error(f"生成语音失败: {e}")
        raise
    finally:
        if temporary_file is not None:
            temporary_file.unlink(missing_ok=True)

@app.route('/tts', methods=['POST'])
def text_to_speech():
    """
    文本转语音API
    请求参数:
        text: 要转换的文本
        voice: 语音类型 (female/male/female-uk/male-uk)，默认 female
        speed: 语速 (0.5-2.0)，默认 0.85
    """
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({"error": "缺少 text 参数"}), 400

        text = data['text'].strip()
        if not text:
            return jsonify({"error": "文本不能为空"}), 400

        # 获取参数
        voice_type = data.get('voice', 'female')
        speed = float(data.get('speed', 0.85))

        # 验证参数
        if voice_type not in VOICES:
            return jsonify({"error": f"不支持的语音类型: {voice_type}"}), 400

        if not 0.5 <= speed <= 2.0:
            return jsonify({"error": "语速必须在 0.5-2.0 之间"}), 400

        voice = VOICES[voice_type]
        # Edge TTS 的 rate 格式: +50% 或 -50%
        rate_percent = f"{int((speed - 1) * 100):+d}%"

        # 生成语音
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            audio_file = loop.run_until_complete(generate_speech(text, voice, rate_percent))
        finally:
            loop.close()

        # 返回音频文件
        return send_file(
            audio_file,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name=f'{hashlib.md5(text.encode()).hexdigest()}.mp3'
        )

    except Exception as e:
        logger.error(f"处理请求失败: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/voices', methods=['GET'])
def list_voices():
    """列出可用的语音"""
    return jsonify({
        "voices": VOICES,
        "default": "female"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({"status": "ok"})

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """清理缓存"""
    try:
        count = 0
        for file in CACHE_DIR.glob("*.mp3"):
            file.unlink()
            count += 1
        return jsonify({"message": f"已清理 {count} 个缓存文件"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("Edge TTS 服务器启动中...")
    print(f"缓存目录: {CACHE_DIR.absolute()}")
    print("可用语音:")
    for key, voice in VOICES.items():
        print(f"  {key}: {voice}")
    print("=" * 50)
    print("\n访问 http://localhost:5000/health 检查服务状态")
    print("访问 http://localhost:5000/voices 查看可用语音\n")

    app.run(host='0.0.0.0', port=5000, debug=False)
