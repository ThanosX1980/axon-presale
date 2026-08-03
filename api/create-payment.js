export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pay_currency, price_amount_usd, order_description } = req.body;

    // Call NOWPayments to generate a hosted invoice
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: price_amount_usd,
        price_currency: 'usd', // MUST be explicit for hosted invoices
        pay_currency: pay_currency,
        order_description: order_description || 'AXON Presale',
        success_url: 'https://axon-presale.vercel.app/',
        cancel_url: 'https://axon-presale.vercel.app/'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'NOWPayments error' });
    }

    // Return invoice_url to index.html
    return res.status(200).json({ invoice_url: data.invoice_url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
