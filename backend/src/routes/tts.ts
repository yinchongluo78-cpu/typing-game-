import { Router } from 'express';
import { textToSpeech, getVoices } from '../controllers/ttsController';

const router = Router();

// 语音合成
router.get('/synthesize', textToSpeech);

// 获取可用发音人列表
router.get('/voices', getVoices);

export default router;
