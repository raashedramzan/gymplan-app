# GymPlan.fit

AI-Powered Custom Workout Plan Generator

## Features
- Multi-step form for personalized workout and nutrition plans
- AI-powered plan generation (Google Gemini API)
- Downloadable PDF export
- Responsive, accessible design
- SEO optimized

## Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables:
   - `GEMINI_API_KEY` (required)
   - `HEALTH_CHECK` (optional, set to 'true' to enable /api/health)
4. Start the server (if applicable)

## Usage
- Open `index.html` in your browser for the frontend
- The backend API is in `api/generate-plan.js`
- To check health: GET `/api/health` (if enabled)

## Deployment
- Ensure environment variables are set securely
- Use a static host for the frontend and a Node.js-compatible host for the API

## License
MIT 