import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils';

const API_SECRET = 'degreefyd_v1_secure_key_2024';

export const generateSignature = (method, url, timestamp) => {
  try {
    // Construct exactly like backend: `${timestamp}${method}${originalUrl}`
    // Since baseURL is /v1, we prepend /v1 if missing
    let fullPath = url;
    if (!url.startsWith('/v1')) {
      fullPath = '/v1' + (url.startsWith('/') ? url : '/' + url);
    }
    
    const message = `${timestamp}${method.toUpperCase()}${fullPath}`;
    const hash = hmac(sha256, utf8ToBytes(API_SECRET), utf8ToBytes(message));
    return bytesToHex(hash);
  } catch (error) {
    // Only log in development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.error('Error generating signature:', error);
    }
    return null;
  }
};
