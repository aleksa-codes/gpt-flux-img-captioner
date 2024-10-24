# GPT Image Captioner

GPT Image Captioner is a web app that generates high-quality image captions using the OpenAI API. This tool is designed for users who want to streamline the dataset preparation process, especially when working with LoRA model training platforms like [fal LoRA Trainer](https://fal.ai/models/fal-ai/flux-lora-fast-training) or [Replicate LoRA Trainer](https://replicate.com/ostris/flux-dev-lora-trainer/train).

## Features

- Upload images to generate detailed captions.
- Supports optional prefix and suffix to customize captions.
- Outputs captions in a downloadable ZIP file.
- API key management for secure usage of the OpenAI API.
- Supports multiple image uploads and real-time captioning progress.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Icons**: [Lucide-react](https://lucide.dev/)
- **API**: OpenAI API

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gpt-image-captioner.git
   cd gpt-image-captioner
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file and add your OpenAI API key (not required, you can add it inside the app):

   ```bash
   OPENAI_API_KEY=your-api-key
   ```

4. Run the development server:

   ```bash
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload one or more images that you want to generate captions for.
2. Optionally provide a prefix and/or suffix to customize the caption format.
3. Click the "Generate Captions" button.
4. Once the captions are ready, they will be listed on the page, and you can download all captions as a ZIP file.

### API Key Management

- Use the **API Key Manager** to securely store your OpenAI API key in the browser's local storage.
- The API key will be used to interact with OpenAI API.
- You can add, remove, or update the key as needed.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. Make sure to follow best practices and write clear commit messages.

## License

This project is licensed under the MIT License.
