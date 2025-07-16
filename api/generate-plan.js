const fetch = require('node-fetch');

// Health check endpoint
if (process.env.HEALTH_CHECK === 'true') {
  module.exports = async (req, res) => {
    if (req.url === '/api/health') {
      return res.status(200).json({ status: 'ok' });
    }
    // Get the prompt from the request body
    const { prompt } = req.body;

    // Get the API key from the environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Send the error from the API back to the client
        return res.status(response.status).json(result);
      }

      // Send the successful result back to the client
      res.status(200).json(result);

    } catch (error) {
      // Handle network or other unexpected errors
      res.status(500).json({ error: { message: error.message } });
    }
  };
}

module.exports = async (req, res) => {
  // Basic logging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Get the prompt from the request body
  const { prompt } = req.body;

  // Basic input validation (extract variables from prompt)
  try {
    const sexMatch = prompt.match(/sex: "(.*?)"/);
    const weightMatch = prompt.match(/weight_kg: (\d+)/);
    const heightMatch = prompt.match(/height_cm: (\d+)/);
    const daysMatch = prompt.match(/days_per_week: (\d+)/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : null;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : null;
    const days = daysMatch ? parseInt(daysMatch[1], 10) : null;
    if (!weight || weight < 30 || weight > 300) {
      return res.status(400).json({ error: { message: 'Invalid weight' } });
    }
    if (!height || height < 100 || height > 250) {
      return res.status(400).json({ error: { message: 'Invalid height' } });
    }
    if (!days || days < 1 || days > 7) {
      return res.status(400).json({ error: { message: 'Invalid days per week' } });
    }
  } catch (e) {
    return res.status(400).json({ error: { message: 'Invalid input format' } });
  }

  // Get the API key from the environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      // Log error
      console.error(`[${new Date().toISOString()}] Gemini API error:`, result);
      // Send the error from the API back to the client
      return res.status(response.status).json(result);
    }

    // Send the successful result back to the client
    res.status(200).json(result);

  } catch (error) {
    // Log error
    console.error(`[${new Date().toISOString()}] Server error:`, error);
    // Handle network or other unexpected errors
    res.status(500).json({ error: { message: error.message } });
  }

  // TODO: Implement rate limiting here (e.g., using express-rate-limit)
  // TODO: Sanitize all inputs if expanding to more complex data
};