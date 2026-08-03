export default async function handler(req, res) {
  try {
    // 1. Call NOWPayments to get your finished/successful transactions
    const response = await fetch('https://api.nowpayments.io/v1/payment/?limit=500', {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY // Uses your existing environment variable
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from NOWPayments');
    }

    const data = await response.json();
    
    // 2. Sum up all completed payments
    let livePaymentsTotal = 0;
    if (data.data && Array.isArray(data.data)) {
      livePaymentsTotal = data.data
        .filter(p => p.payment_status === 'finished' || p.payment_status === 'confirmed')
        .reduce((sum, payment) => sum + (parseFloat(payment.price_amount) || 0), 0);
    }

    // 3. Set your base starting amount (e.g. initial presale baseline)
    const baseAmount = 142850; 
    const grandTotal = baseAmount + livePaymentsTotal;

    // 4. Return the updated total to your web page
    return res.status(200).json({ raisedUsd: grandTotal });

  } catch (err) {
    // If anything fails, fall back gracefully to the base number
    return res.status(200).json({ raisedUsd: 142850 });
  }
}
