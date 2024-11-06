# GPT Image Captioner 🖼️

GPT Image Captioner is a web app that generates high-quality image captions using the OpenAI API. Designed for users who want to streamline dataset preparation, it's especially useful for those working with LoRA model training platforms like [fal LoRA Trainer](https://fal.ai/models/fal-ai/flux-lora-fast-training) and [Replicate LoRA Trainer](https://replicate.com/ostris/flux-dev-lora-trainer/train).

## 🌐 Demo

Try it live at [GPT Image Captioner](https://gptcaptioner.aleksa.io/)!

## ✨ Features

- **Image Captioning**: Upload images to generate detailed captions.
- **Customizable Captions**: Add prefix and suffix options to tailor captions.
- **Batch Processing**: Supports multiple image uploads with real-time progress.
- **Downloadable Captions**: Get all captions as a ZIP file.
- **API Key Management**: Securely store and manage your OpenAI API key within the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **API Integration**: OpenAI API

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- OpenAI API key (optional for development, can also be added within the app)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aleksa-codes/gpt-flux-img-captioner.git
   cd gpt-image-captioner
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file to add your OpenAI API key (optional; the key can also be added in-app):

   ```bash
   OPENAI_API_KEY=your-api-key
   ```

4. Start the development server:

   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## 💡 Usage

1. **Upload Images**: Add one or multiple images to generate captions.
2. **Customize Captions**: Optionally add a prefix and/or suffix for caption styling.
3. **Generate Captions**: Click "Generate Captions" to process images.
4. **Download Captions**: Once generated, download all captions as a ZIP file.

### 🔑 API Key Management

- Use the in-app **API Key Manager** to securely store your OpenAI API key in local storage.
- This key enables seamless interaction with the OpenAI API.
- You can add, update, or remove the key as needed.

## 🤝 Contributing

Contributions are welcome! Here’s how to get involved:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/AmazingFeature`.
3. Commit your changes: `git commit -m 'Add AmazingFeature'`.
4. Push to the branch: `git push origin feature/AmazingFeature`.
5. Open a Pull Request.

### Development Guidelines

- Follow the existing code style and conventions.
- Write meaningful commit messages.
- Test changes thoroughly and update documentation as needed.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ by <a href="https://github.com/aleksa-codes">aleksa.codes</a></p>
