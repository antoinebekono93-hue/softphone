const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export const flutterwave = {
  paymentPlans: {
    async create(data: {
      amount: number;
      name: string;
      interval: string;
      currency?: string;
    }) {
      if (!FLUTTERWAVE_SECRET_KEY) {
        throw new Error('FLUTTERWAVE_SECRET_KEY is missing. Please set it in your .env.local file');
      }
      
      const response = await fetch('https://api.flutterwave.com/v3/payment-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          name: data.name,
          interval: data.interval,
          currency: data.currency || 'USD',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create payment plan on Flutterwave');
      }

      return result.data;
    }
  },
  payments: {
    async create(data: {
      tx_ref: string;
      amount: number;
      currency?: string;
      redirect_url: string;
      customer: { email: string; name?: string };
      meta: Record<string, string>;
      customizations?: { title: string; logo?: string };
    }) {
      if (!FLUTTERWAVE_SECRET_KEY) {
        throw new Error('FLUTTERWAVE_SECRET_KEY is missing');
      }
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: data.tx_ref,
          amount: data.amount,
          currency: data.currency || 'USD',
          redirect_url: data.redirect_url,
          customer: data.customer,
          meta: data.meta,
          customizations: data.customizations,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Failed to create payment link');
      }
      return result.data; // contains .link
    }
  }
};
