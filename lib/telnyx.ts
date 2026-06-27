// @ts-ignore
import Telnyx from 'telnyx';

const telnyxApiKey = process.env.TELNYX_API_KEY;
if (!telnyxApiKey) {
  throw new Error('TELNYX_API_KEY is not defined in environment variables');
}

export const telnyx = new (Telnyx as any)(telnyxApiKey);
