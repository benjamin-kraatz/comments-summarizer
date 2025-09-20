# 🎬 Comments Summarizer

<div align="center">
  <img src="./assets/icon.png" alt="Comments Summarizer Logo" width="128" height="128">

**AI-Powered YouTube Comment Analysis Extension**

Summarize YouTube video comments with advanced AI models. Get insights, key themes, and sentiment analysis from video comment sections instantly.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-orange)

</div>

## ✨ Features

### 🚀 Core Functionality

- **Smart Comment Analysis** - Leverage AI models to summarize YouTube comments
- **Multiple AI Providers** - Support for GPT-3.5, GPT-4, and Claude models
- **Customizable Parameters** - Adjust summary length, comment limits, and more
- **Real-time Processing** - Instant analysis of video comment sections

### 🎯 YouTube Integration

- **Video Detection** - Automatically detects YouTube videos
- **Rich Metadata Display** - Shows video title, channel, views, and publish date
- **Channel Information** - Quick access to channel pages
- **Direct Video Links** - Easy access to the current video

### 🎨 User Experience

- **Dark Mode Support** - Seamless dark/light theme switching
- **Intuitive Interface** - Clean, modern popup design
- **Loading States** - Visual feedback during processing
- **Error Handling** - Graceful fallbacks and user-friendly messages
- **Settings Panel** - Comprehensive configuration options

### 🔧 Technical Features

- **Type Safety** - Full TypeScript implementation
- **Modular Architecture** - Clean, maintainable codebase
- **Robust Error Handling** - Multiple retry mechanisms
- **Performance Optimized** - Efficient DOM parsing and API calls

## 📋 Requirements

- **Browser**: Chrome 88+ or Chromium-based browsers
- **Permissions**: Access to YouTube pages
- **API Key**: Required for AI summarization services

## 🛠 Installation

### From Source (Development)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd comments-summarizer
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Load in browser**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

### From Chrome Web Store

_Coming Soon_ - The extension will be available on the Chrome Web Store for easy installation.

### Manual Installation

1. **Build for production**

   ```bash
   pnpm build
   ```

2. **Package the extension**

   ```bash
   pnpm package
   ```

3. **Install the generated ZIP file**
   - Open `chrome://extensions/`
   - Drag and drop the ZIP file into the page

## 📖 Usage

### Basic Usage

1. **Navigate to YouTube**

   - Go to any YouTube video page
   - Open the extension popup

2. **Automatic Detection**

   - The extension automatically detects you're on a YouTube video
   - Video information is displayed in the "Current Video" section

3. **Configure Settings**

   - Click "Settings" to access configuration options
   - Set your AI API key
   - Choose your preferred AI model
   - Adjust summarization parameters

4. **Summarize Comments**
   - Click "Summarize Comments" when ready
   - Wait for AI processing (may take a few seconds)
   - View the generated summary

### Advanced Configuration

#### AI Model Selection

- **GPT-3.5 Turbo** - Fast and cost-effective
- **GPT-4** - Higher quality, more expensive
- **GPT-4 Turbo** - Balance of speed and quality
- **Claude 3 Haiku** - Fast processing
- **Claude 3 Sonnet** - Balanced performance

#### Summary Customization

- **Summary Length** - Short, Medium, Long, or Detailed
- **Max Comments** - Limit the number of comments analyzed
- **Auto-summarize** - Automatically summarize when opening videos
- **Display Options** - Show/hide thumbnails and metadata

## 🎨 Interface

### Main Popup

```
┌─────────────────────────────────────┐
│ 🎬 Comments Summarizer             │
│ AI-powered YouTube comment analysis │
├─────────────────────────────────────┤
│ 📺 Current Video                    │
│ 🎯 Video Title                     │
│ 👤 Channel Name (clickable)        │
│ 📅 Date • 👁️ Views • 🔗 Open      │
│ ✓ YouTube Video                     │
├─────────────────────────────────────┤
│ ⚙️ Quick Settings                  │
│ 🤖 AI Model: GPT-4                 │
│ 📝 Max Comments: 50                 │
│ 🔄 Auto-summarize: ON               │
├─────────────────────────────────────┤
│ 🚀 Summarize Comments              │
├─────────────────────────────────────┤
│ ⚙️ Settings | 🔴 API Ready         │
└─────────────────────────────────────┘
```

### Settings Page

- API key configuration
- Model selection
- Parameter tuning
- Theme preferences
- Advanced options

## 🏗 Project Structure

```
src/
├── components/           # React components
├── contents/            # Content scripts
│   └── youtube-extractor.ts    # YouTube DOM parsing
├── services/            # Business logic
│   └── youtubeExtractor.ts     # Metadata extraction
├── store/               # State management
│   └── settingsStore.ts        # App settings
├── types/               # TypeScript definitions
│   └── youtube.ts              # YouTube interfaces
├── options.tsx          # Settings page
├── popup.tsx            # Main popup interface
└── styles.css           # Global styles
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm or npm
- Chrome/Chromium browser

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Package extension
pnpm package

# Lint code
pnpm lint

# Format code
pnpm format
```

### Key Technologies

- **Framework**: [Plasmo](https://plasmo.com/) - Browser Extension SDK
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite (via Plasmo)

### Architecture

- **Popup Script**: Main user interface
- **Content Script**: YouTube page interaction
- **Background Script**: Message handling and API calls
- **Options Page**: Settings and configuration

## 🔒 Security & Privacy

- **Local Processing** - Comments are processed locally when possible
- **API Security** - Secure transmission to AI services
- **No Data Storage** - No personal data or comments are stored
- **Minimal Permissions** - Only requests access to YouTube pages
- **Open Source** - Code is transparent and auditable

## 🐛 Troubleshooting

### Common Issues

**Extension not loading**

- Ensure you're on a YouTube video page
- Check browser console for errors
- Try refreshing the page

**API errors**

- Verify your API key is correct
- Check your internet connection
- Ensure you have sufficient API credits

**Content script issues**

- The extension uses multiple selector strategies
- Some YouTube UI changes may require updates
- Check browser console for DOM parsing errors

### Debug Mode

Enable debug logging by opening browser console and looking for `[CommentsSummarizer]` prefixed messages.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use React functional components with hooks
- Maintain consistent styling with Tailwind
- Write comprehensive tests
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Trademarks & Acknowledgments

All product names, logos, brands, trademarks, and registered trademarks featured or referenced within this project remain the exclusive property of their respective owners. These include, but are not limited to:

- **YouTube** and all related marks are trademarks of Google LLC
- **OpenAI**, **GPT-3.5**, **GPT-4**, and associated technologies are trademarks of OpenAI, L.P.
- **Anthropic**, **Claude**, and related AI models are trademarks of Anthropic PBC
- **Google Chrome** and related browser technologies are trademarks of Google LLC
- **React**, **TypeScript**, and related tools are trademarks of Meta Platforms, Inc. and Microsoft Corporation respectively

This project is developed independently and is not affiliated with, endorsed by, or sponsored by any of the aforementioned companies. All trademarks are used solely for descriptive purposes to accurately identify the technologies and services with which this extension integrates.

The extension's use of these trademarks does not imply any partnership, sponsorship, or endorsement by the trademark owners.

## 🙏 Acknowledgments

- **Plasmo Framework** for the excellent extension development experience
- **OpenAI & Anthropic** for providing the AI models
- **YouTube** for the platform we're enhancing
- **Tailwind CSS** for the beautiful styling system

## 🎭 The Heart of the Matter: Our Backend Symphony

Ah, dear reader, allow me to paint for you a picture most grand and elaborate! While the extension you see before you dances gracefully in your browser, conducting its elegant ballet of comment extraction and metadata display, there exists behind the curtain a most sophisticated backend orchestra – a veritable symphony of artificial intelligence and computational wizardry!

This backend, my friends, is the true maestro of our operation. It conducts the grand performance of AI inference, where the raw, unfiltered voices of YouTube's comment sections are transformed through the alchemical processes of natural language understanding. Here, in this hidden realm of servers and algorithms, the chaotic chorus of user opinions, debates, and discussions is distilled into crystalline summaries of insight and understanding.

Yet alas, this magnificent backend remains, for the moment, shrouded in the mists of proprietary development. It is not yet ready to step into the bright lights of open source scrutiny, for it contains the secret recipes of our AI prompting strategies, the carefully crafted algorithms that coax the most meaningful insights from the comment ether, and the robust error-handling mechanisms that ensure our service remains steadfast even when the comment sections grow turbulent.

But fear not! For this frontend extension you hold in your hands is but the vanguard, the elegant ambassador that bridges your browsing experience with the computational might that awaits in the backend. It is designed with the foresight of modularity, ready to embrace the full power of our AI inference engine when the time is right.

So as you marvel at the extension's graceful interface and robust YouTube integration, remember that you are witnessing but the prologue to a grander tale – one where frontend meets backend in perfect harmony, where browser extension meets cloud intelligence, and where the collective wisdom of online communities is made accessible through the magic of artificial intelligence.

_For now, the backend rests in its chrysalis state, but soon it shall emerge, ready to share its secrets with the world..._ 🦋

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/comments-summarizer/issues)

---

<div align="center">
  <p><strong>Built with ❤️ using Plasmo, React, and AI</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>
