export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NOWPAYMENTS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server is not configured with a NOWPayments API key.'
    });
  }

  const {
    pay_currency,
    price_amount_usd,
    order_description
  } = req.body || {};

  if (!pay_currency || !price_amount_usd || price_amount_usd <= 0) {
    return res.status(400).json({
      error: 'pay_currency and a positive price_amount_usd are required.'
    });
  }

  try {
    const invoiceData = {
      price_amount: price_amount_usd,
      price_currency: 'usd',
      pay_currency: pay_currency.toLowerCase(),
      order_id: `axon-${Date.now()}`,
      order_description:
        order_description || 'AXON ($AXN) presale contribution',
      success_url: 'https://yourdomain.com/thank-you',
      cancel_url: 'https://yourdomain.com/#buy',
      ipn_callback_url: 'https://yourdomain.com/api/payment-webhook'
    };

    const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });

    const data = await npRes.json();

    if (!npRes.ok) {
      return res.status(npRes.status).json({
        error: data.message || 'NOWPayments error',
        details: data
      });
    }

    return res.status(200).json({
      invoice_url: data.invoice_url,
      invoice_id: data.id
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to reach NOWPayments.'
    });
  }
}
