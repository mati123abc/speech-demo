# Speech Demo

Real-time Korean speech recognition with live translation into Vietnamese, English, and Chinese — built for construction site safety meetings (TBM).

## How it works

1. Browser captures microphone audio via Azure Speech SDK
2. Korean speech is transcribed in real time
3. An optional AI correction layer (Azure OpenAI) fixes domain-specific terminology (safety, scaffolding, crane, etc.)
4. Translated captions appear simultaneously in VI / EN / ZH via Azure Translator

## Pages

| File | Description |
|------|-------------|
| `stt.html` | Main app — STT + translation |
| `index.html` | Minimal demo |
| `vi.html` / `en.html` / `zh.html` | Single-language caption views |
| `mic-test.html` | Microphone test page |

## Setup

1. Copy `.env.example` to `.env` and fill in your keys:

```
TRANSLATOR_KEY=your_azure_translator_key
AZURE_REGION=koreacentral
AOAI_ENDPOINT=https://your-resource.openai.azure.com
AOAI_API_KEY=your_aoai_key
AOAI_DEPLOYMENT=your_deployment_name
```

2. Add your Azure Speech key directly in `index.html` and `stt.html` (look for `YOUR_AZURE_SPEECH_KEY_HERE`).

3. Install dependencies and start the server:

```bash
npm install
node server.js
```

4. Open `http://localhost:3000/stt.html`

## Tech stack

- [Azure Cognitive Services Speech SDK](https://learn.microsoft.com/azure/cognitive-services/speech-service/)
- [Azure Translator](https://learn.microsoft.com/azure/cognitive-services/translator/)
- Azure OpenAI (optional, for STT correction)
- Express.js
