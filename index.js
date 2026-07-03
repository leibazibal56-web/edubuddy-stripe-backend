let app;
let startupError = null;

try {
  const express = require('express');
  const cors = require('cors');
  const https = require('https');

  app = express();
  app.use(cors());
  app.use(express.json());

  // Helper function to lazy-load Stripe and prevent startup crashes if key is missing
  const getStripeInstance = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is missing on the Vercel server.");
    }
    return require('stripe')(secretKey);
  };

  // =========================================================================
  // Diagnostic Endpoint: List all models available to the current API Key
  // =========================================================================
  app.get('/api/models', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the Vercel backend." });
      }

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1/models?key=${apiKey}`,
        method: 'GET'
      };

      const apiRequest = new Promise((resolve, reject) => {
        const reqStream = https.request(options, (resStream) => {
          let bodyData = '';
          resStream.on('data', (chunk) => { bodyData += chunk; });
          resStream.on('end', () => {
            try {
              resolve(JSON.parse(bodyData));
            } catch (e) {
              reject(new Error(`Failed to parse response: ${bodyData}`));
            }
          });
        });
        reqStream.on('error', (err) => { reject(err); });
        reqStream.end();
      });

      const data = await apiRequest;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // 1. Stripe Mobile Endpoint (Retained for Android App compatibility)
  // =========================================================================
  app.post('/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "Missing amount parameter" });
      }
      
      const stripe = getStripeInstance();
      const customer = await stripe.customers.create();
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2023-10-16' }
      );
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency || 'ron',
        customer: customer.id,
        automatic_payment_methods: { enabled: true },
      });
      res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      });
    } catch (error) {
      console.error("Error creating payment intent:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // 2. Stripe Web Checkout Endpoints (For Lex Navigator Web)
  // =========================================================================
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { priceId, successUrl, cancelUrl, planName } = req.body;
      
      // Choose price depending on plan (e.g. all_subjects: 50 RON, single_subject: 20 RON)
      let amount = 5000; // 50.00 RON (Pachet Complet)
      if (planName === 'single_subject') {
        amount = 2000; // 20.00 RON (O singură materie)
      }

      const stripe = getStripeInstance();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'ron',
              product_data: {
                name: `EduBuddy - ${planName === 'single_subject' ? 'Materie Individuală' : 'Pachet Complet'}`,
                description: planName === 'single_subject' ? 'Acces nelimitat pe viață pentru o singură materie la alegere' : 'Acces nelimitat pe viață la toate cele 13 materii de examen',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint to verify if checkout session was paid (called on return from Stripe redirect)
  app.get('/api/verify-session', async (req, res) => {
    try {
      const { session_id } = req.query;
      if (!session_id) {
        return res.status(400).json({ error: "Missing session_id query parameter" });
      }
      
      const stripe = getStripeInstance();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === 'paid') {
        res.json({ paid: true, planDescription: session.line_items?.data?.[0]?.description || "" });
      } else {
        res.json({ paid: false });
      }
    } catch (error) {
      console.error("Error verifying checkout session:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // =========================================================================
  // 3. Gemini API Secure Web Proxy (Hides API Key from browser source code)
  // =========================================================================
  app.post('/api/chat', async (req, res) => {
    try {
      const { examType, subject, history, prompt, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the Vercel backend." });
      }

      // Format history for Google Gemini REST API format
      const contents = [];

      // Inject system instructions as a preamble dialogue (compatible with all API versions)
      contents.push({
        role: 'user',
        parts: [{ text: `INSTRUCTIUNI DE SISTEM (Rolul tau): ${systemInstruction}` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: "Am înțeles rolul meu de tutore EduBuddy și regulile de corectare/pedagogie socratică. Voi răspunde în conformitate cu acestea." }]
      });

      if (history && Array.isArray(history)) {
        // Keep last 8 messages for token savings and speed
        const recentHistory = history.slice(-8);
        for (const msg of recentHistory) {
          contents.push({
            role: msg.sender === 'USER' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
      // Add current user prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      // Call official Gemini REST API (using gemini-2.5-flash as the new standard fallback)
      const payload = JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const apiRequest = new Promise((resolve, reject) => {
        const reqStream = https.request(options, (resStream) => {
          let bodyData = '';
          resStream.on('data', (chunk) => { bodyData += chunk; });
          resStream.on('end', () => {
            try {
              const parsed = JSON.parse(bodyData);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse Gemini response: ${bodyData}`));
            }
          });
        });
        
        reqStream.on('error', (err) => { reject(err); });
        reqStream.write(payload);
        reqStream.end();
      });

      const data = await apiRequest;
      
      if (data.error) {
        console.error("Gemini API returned error:", data.error);
        return res.status(500).json({ error: data.error.message });
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Ne pare rău, nu am putut genera un răspuns. Te rugăm să reîncerci.";
      res.json({ text: aiText });
    } catch (error) {
      console.error("Error in chat proxy:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Health check endpoint
  app.get('/', (req, res) => {
    res.send('Lex Navigator / EduBuddy Stripe & AI Backend is running on Vercel! 🚀');
  });

} catch (err) {
  startupError = err;
  
  // Fallback express app to expose the startup error trace on the web endpoint
  const express = require('express');
  const cors = require('cors');
  
  app = express();
  app.use(cors());
  app.use((req, res) => {
    res.status(500).json({
      error: "Startup Crash Detected on Vercel",
      message: startupError.message,
      stack: startupError.stack
    });
  });
}

module.exports = app;
