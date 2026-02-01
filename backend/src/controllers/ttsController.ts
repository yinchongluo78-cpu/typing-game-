import { Request, Response, NextFunction } from 'express';
import { synthesizeSpeech, englishVoices } from '../services/ttsService';
import { success } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// 语音合成接口
export async function textToSpeech(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, voice, speechRate } = req.query;

    if (!text || typeof text !== 'string') {
      throw new AppError('缺少 text 参数');
    }

    if (text.length > 500) {
      throw new AppError('文本长度不能超过 500 字符');
    }

    const audioBuffer = await synthesizeSpeech(text, {
      voice: typeof voice === 'string' ? voice : 'Wendy',
      speechRate: typeof speechRate === 'string' ? parseInt(speechRate, 10) : 0,
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400', // 缓存 1 天
    });

    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
}

// 获取可用发音人列表
export async function getVoices(_req: Request, res: Response) {
  res.json(success(englishVoices));
}
