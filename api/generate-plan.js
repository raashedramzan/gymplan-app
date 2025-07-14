const fetch = require('node-fetch');

module.exports = async (req, res) => {
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