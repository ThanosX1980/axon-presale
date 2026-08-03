const TOKEN_PRICE_USD = 0.001875;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('https://api.nowpayments.io/v1/payment/?limit=500', {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payments from NOWPayments');
    }

    const data = await response.json();
    const payments = data.data || [];

    let totalRaisedUsd = 0;
    const uniqueBuyers = new Set();

    payments.forEach(payment => {
      if (payment.payment_status === 'finished' || payment.payment_status === 'confirmed') {
        totalRaisedUsd += parseFloat(payment.price_amount) || 0;
        
        if (payment.pay_address) {
          uniqueBuyers.add(payment.pay_address.toLowerCase());
        }
      }
    });

    const tokensSold = Math.floor(totalRaisedUsd / TOKEN_PRICE_USD);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

    return res.status(200).json({
      success: true,
      raisedUsd: totalRaisedUsd,
      tokensSold: tokensSold,
      participants: uniqueBuyers.size
    });

  } catch (err) {
    console.error('Stats fetch error:', err);
    return res.status(200).json({
      success: true,
      raisedUsd: 0,
      tokensSold: 0,
      participants: 0
    });
  }
}
