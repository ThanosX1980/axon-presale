export default async function handler(req, res) {
  // Set CORS headers so your frontend can communicate cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing NOWPAYMENTS_API_KEY in Vercel environment variables.' });
    }

    const { pay_currency, price_amount, order_description } = req.body || {};

    if (!pay_currency || !price_amount) {
      return res.status(400).json({ error: 'Missing pay_currency or price_amount parameter.' });
    }

    const payload = {
      price_amount: Number(price_amount),
      price_currency: 'usd',
      pay_currency: String(pay_currency),
      order_description: order_description || 'AXON Presale Contribution',
      ipn_callback_url: 'https://axon-presale.vercel.app/api/nowpayments-webhook',
      success_url: 'https://axon-presale.vercel.app/',
      cancel_url: 'https://axon-presale.vercel.app/'
    };

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // NOWPayments returned an error (e.g. invalid currency, below min amount)
      console.error('NOWPayments API Error:', data);
      return res.status(response.status).json({ 
        error: data.message || data.error || 'NOWPayments rejected the invoice creation.' 
      });
    }

    if (!data.invoice_url) {
      return res.status(500).json({ error: 'NOWPayments response succeeded but omitted invoice_url.' });
    }

    return res.status(200).json({ invoice_url: data.invoice_url });

  } catch (err) {
    console.error('Serverless Function Catch:', err);
    return res.status(500).json({ error: err.message || 'Internal server error occurred.' });
  }
}
