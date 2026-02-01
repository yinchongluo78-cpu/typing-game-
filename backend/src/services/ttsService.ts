import axios from 'axios';
import crypto from 'crypto';

const ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || '';
const ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
const APP_KEY = process.env.ALIYUN_TTS_APP_KEY || '';

// Token 缓存
let cachedToken: string | null = null;
let tokenExpireTime = 0;

// 获取阿里云 Token
async function getToken(): Promise<string> {
  // 如果 Token 还有效，直接返回
  if (cachedToken && Date.now() < tokenExpireTime - 60000) {
    return cachedToken;
  }

  const url = 'https://nls-meta.cn-shanghai.aliyuncs.com/';
  const params: Record<string, string> = {
    AccessKeyId: ACCESS_KEY_ID,
    Action: 'CreateToken',
    Format: 'JSON',
    RegionId: 'cn-shanghai',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: Math.random().toString(36).substring(2),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2019-02-28',
  };

  // 生成签名
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;

  const signature = crypto
    .createHmac('sha1', ACCESS_KEY_SECRET + '&')
    .update(stringToSign)
    .digest('base64');

  params.Signature = signature;

  const response = await axios.get(url, { params });

  if (response.data.Token) {
    cachedToken = response.data.Token.Id;
    tokenExpireTime = response.data.Token.ExpireTime * 1000;
    return cachedToken as string;
  }

  throw new Error('Failed to get token: ' + JSON.stringify(response.data));
}

// 语音合成
export async function synthesizeSpeech(
  text: string,
  options: {
    voice?: string; // 发音人
    format?: string; // 音频格式
    sampleRate?: number; // 采样率
    volume?: number; // 音量 0-100
    speechRate?: number; // 语速 -500 到 500
    pitchRate?: number; // 语调 -500 到 500
  } = {}
): Promise<Buffer> {
  const token = await getToken();

  const {
    voice = 'Wendy', // 英文女声
    format = 'mp3',
    sampleRate = 16000,
    volume = 50,
    speechRate = 0,
    pitchRate = 0,
  } = options;

  const url = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts';

  const response = await axios.post(
    url,
    {
      appkey: APP_KEY,
      token,
      text,
      format,
      sample_rate: sampleRate,
      voice,
      volume,
      speech_rate: speechRate,
      pitch_rate: pitchRate,
    },
    {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  // 检查是否返回错误（JSON 格式）
  const contentType = response.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    const errorText = Buffer.from(response.data).toString('utf-8');
    throw new Error('TTS Error: ' + errorText);
  }

  return Buffer.from(response.data);
}

// 可用的英文发音人列表
export const englishVoices = [
  { name: 'Wendy', description: '英文女声' },
  { name: 'William', description: '英文男声' },
  { name: 'Olivia', description: '英式英文女声' },
  { name: 'Harry', description: '英式英文男声' },
];
