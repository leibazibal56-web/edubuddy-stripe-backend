const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Main endpoint called by the Android mobile app
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: "Missing amount parameter" });
    }

    // 1. Create a Customer (required by Stripe PaymentSheet for saving cards)
    const customer = await stripe.customers.create();
    
    // 2. Create an Ephemeral Key for the Customer (gives the mobile app temporary access to the customer object)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );
    
    // 3. Create a PaymentIntent (specifies amount, currency, and customer)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || 'ron',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // 4. Return all details to the mobile client
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
    console.log(`PaymentIntent created successfully for amount ${amount} ${currency || 'ron'}`);
  } catch (error) {
    console.error("Error creating payment intent:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('EduBuddy Stripe Backend is running! 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
