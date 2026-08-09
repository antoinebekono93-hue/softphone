// @ts-ignore
import Telnyx from 'telnyx';

let telnyxInstance: any = null;

export function getTelnyxClient() {
  if (!telnyxInstance) {
    const telnyxApiKey = process.env.TELNYX_API_KEY;
    if (!telnyxApiKey) {
      throw new Error('TELNYX_API_KEY is not defined in environment variables');
    }
    telnyxInstance = new (Telnyx as any)(telnyxApiKey);
  }
  return telnyxInstance;
}

// For backward compatibility - lazily evaluated
export const telnyx = new Proxy({} as any, {
  get(_, prop) {
    return getTelnyxClient()[prop];
  },
});