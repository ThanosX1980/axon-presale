// api/create-payment.js (Node.js Serverless Function / Express route)

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pay_currency, price_amount_usd, pay_amount, buyer_address, order_description } = req.body;

    // Call your payment gateway API (e.g. NOWPayments)
    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY, // Stored safely in environment variables
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: price_amount_usd,
        price_currency: 'usd',
        pay_currency: pay_currency,
        ipn_callback_url: process.env.CALLBACK_URL,
        order_description: order_description || 'AXON Presale Contribution',
        // Optional: pass buyer wallet address or metadata
        order_id: buyer_address ? `${buyer_address}_${Date.now()}` : undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Payment processor error' });
    }

    // Return receiving details back to the frontend HTML script
    return res.status(200).json({
      pay_address: data.pay_address,
      pay_amount: data.pay_amount || pay_amount,
      payment_id: data.payment_id
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
