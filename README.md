# JEE Blueprint

React + Vite version of the JEE Blueprint app.

## Local setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## AWS Amplify build settings

- Build command: `npm run build`
- Output directory: `dist`

## AI backend note

This frontend is safe to deploy because it does not expose a Claude/Anthropic API key in the browser.

To connect AI later, create a backend endpoint and set this environment variable in Amplify:

`VITE_AI_ENDPOINT=https://your-backend-url`

The endpoint should accept:

```json
{
  "system": "prompt",
  "userText": "student question",
  "imageBase64": null,
  "imageMime": null
}
```

and return:

```json
{
  "answer": "AI response"
}
```
