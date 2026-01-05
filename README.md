# GPT Image Captioner 🖼️

A web app that generates AI-powered image captions. Ideal for LoRA model training on platforms like [fal LoRA Trainer](https://fal.ai/models/fal-ai/flux-lora-fast-training) and [Replicate LoRA Trainer](https://replicate.com/ostris/flux-dev-lora-trainer/train).

**[Live Demo](https://gptcaptioner.aleksa.codes/)**

## ✨ Features

- **Dual Model Support**: OpenAI API (GPT-5 series) or Ollama (local models)
- **Batch Processing**: Upload and caption multiple images at once
- **Image Preview**: Visual thumbnails of selected images before and after captioning
- **Smart Validation**: Automatic file type (JPEG, PNG, WebP, GIF) and size validation (20MB max)
- **Customization**: Add prefix/suffix to captions
- **Export**: Download all captions as a ZIP file
- **API Key Management**: Securely store OpenAI keys in-app

## 🧠 Model Options

- **OpenAI**: GPT-5 (high-quality), GPT-5-mini (balanced), and GPT-5-nano (faster, cheaper)
- **Ollama**: Local vision models (LLaVA, moondream, bakLLaVA), no API key needed

> **Note**: When using the deployed web app with Ollama, you have several options:
>
> 1. Use [ngrok](https://ngrok.com/) to create a secure tunnel to your local Ollama server. [Learn more](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-use-ollama-with-ngrok).
> 2. Configure Ollama to allow additional web origins using the `OLLAMA_ORIGINS` environment variable. [Learn more](https://github.com/ollama/ollama/blob/main/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama) and check out [LobeHub's Ollama provider documentation](https://lobehub.com/docs/usage/providers/ollama).

## 🛠️ Tech Stack

Next.js 14, Tailwind CSS, shadcn/ui, Lucide React, Vercel AI SDK

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Bun
- OpenAI API key (if using OpenAI)
- Ollama installed locally (if using local models)

### Install & Run

```bash
# Clone repo
git clone https://github.com/aleksa-codes/gpt-flux-img-captioner.git
cd gpt-image-captioner

# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 Usage

1. Choose between OpenAI or Ollama
2. Upload one or more images (JPEG, PNG, WebP, or GIF - max 20MB each)
3. Preview your selected images in a grid layout
4. Add optional prefix/suffix to customize captions
5. Generate captions (thumbnails appear alongside each caption)
6. Download all captions as a ZIP file

### Image Requirements

- **Supported formats**: JPEG, PNG, WebP, GIF
- **Maximum file size**: 20MB per image
- **Multiple uploads**: Yes, batch processing supported

### Using Ollama

1. [Install Ollama](https://ollama.com/download)
2. Pull a vision model: `ollama pull llava`
3. Start Ollama server
4. Select "Ollama" in the app and choose your model

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Development setup and workflow
- Code style and standards
- Submitting bug reports and feature requests
- Pull request process

Quick start: Fork the repo, create a feature branch, and submit a pull request.

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by <a href="https://github.com/aleksa-codes">aleksa.codes</a></p>
