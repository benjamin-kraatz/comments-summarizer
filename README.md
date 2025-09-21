# 🎬 Comments Summarizer

<div align="center">
  <img src="./assets/icon.png" alt="Comments Summarizer Logo" width="128" height="128">

**AI-Powered YouTube Comment Analysis Extension**

Automatically summarize YouTube video comments with AI-powered analysis and sentiment detection.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-orange)

</div>

## ✨ Features

### 🚀 Core Functionality

- **Automatic Comment Summarization** - AI-powered analysis of YouTube video comments
- **Sentiment Analysis** - Tone detection with visual rating indicators
- **Real-time Processing** - Instant analysis when enabled
- **Smart Integration** - Seamlessly integrates with YouTube's interface

### 🎯 YouTube Integration

- **Auto-Detection** - Automatically detects when you're on a YouTube video
- **Content Injection** - Displays summaries directly in the YouTube interface
- **Robust Parsing** - Handles YouTube's dynamic content loading

### 🎨 User Experience

- **Clean Interface** - Integrates with YouTube's interface
- **Settings Control** - Toggle auto-summarization on/off
- **Position Options** - Choose where to display summaries
- **Visual Feedback** - Loading states and error messages

### 🔧 Technical Features

- **Type Safety** - Full TypeScript implementation
- **Modern Architecture** - Built with Plasmo framework and React
- **Error Handling** - Comprehensive retry mechanisms
- **Performance Optimized** - Efficient DOM manipulation and API calls

## 📋 Requirements

- **Browser**: Chrome 88+ or Chromium-based browsers
- **Backend Server**: Required for AI-powered comment summarization[^1]

## ⚙️ Backend Server

See the footnotes[^1] for more information.

## 🛠 Installation

### From Source (Development)

> [!IMPORTANT]
> If you don't have a dedicated backend server, you can use the public backend server at `https://cs.bnndv.qzz.io` - which is the default backend server used in the extension. Note that during development or when building manually from source, the backend has rate-limit protections and may eventually rate-limit you. Consider [installing the extension from the Chrome Web Store](#from-chrome-web-store) instead.

1. **Clone the repository**

   ```bash
   git clone https://github.com/benjamin-kraatz/comments-summarizer.git
   cd comments-summarizer
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Set up backend server**

> [!NOTE]
> We are working on providing the codebase for the backend server in the future, or at least giving you a basic backend server implementation for development purposes. Note that the public server is not for development use yet.

5. **Load in browser**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

### From Chrome Web Store

_Coming Soon_ - The extension will be available on the Chrome Web Store for easy installation.

## 📖 Usage

### Basic Usage

1. Go to any YouTube video page
2. The extension automatically detects you're on a YouTube video
3. The extension automatically summarizes the comments and displays a visual rating of the tone of the comments

### Advanced Usage

#### Configure Settings

1. Open the extension popup
2. Turn the summarization on or off
3. Adjust display position
4. Enable/disable personalization (coming soon)

> We are planning to add more settings to allow you to personalize the extension to your needs.

## 🏗 Project Structure

```
src/
├── background/          # Background service worker
│   ├── index.ts         # Main background script
│   └── messages/        # Message handlers
│       └── ping.ts      # Ping message handler
├── components/          # Reusable React components
│   └── ui/              # UI component library
│       ├── card.tsx     # Card component
│       ├── select.tsx   # Select component
│       └── switch.tsx   # Switch component
├── contents/            # Content scripts
│   └── summary-display.tsx # YouTube summary display
├── lib/                 # Utility libraries
│   ├── l18n.ts          # Internationalization
│   └── utils.ts         # General utilities
├── services/            # API and business logic
│   ├── api-service.ts   # Backend API communication
│   └── youtubeExtractor.ts # YouTube metadata extraction
├── store/               # State management
│   └── settingsStore.ts # Extension settings
├── types/               # TypeScript type definitions
│   └── youtube.ts       # YouTube-related types
├── options.tsx          # Settings/options page
├── popup.tsx            # Extension popup interface
└── styles.css           # Global CSS styles
```

## 🔧 Development

### Prerequisites

- Node.js 20+
- pnpm
- Chrome/Chromium browser
- Backend Server[^1] (default public server available at `https://cs.bnndv.qzz.io`)

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
```

### Key Technologies

- **Framework**: [Plasmo](https://plasmo.com/) - Browser Extension SDK
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: `@plasmohq/storage` for persistent storage
- **UI Components**: Radix UI components (Select, Switch, Card, from shadcn)
- **Language Support**: Internationalization with Chrome i18n API

## 🔒 Security & Privacy

- **Content Script Isolation** - Runs in YouTube's security context
- **API Communication** - Makes requests to configured backend endpoint
- **No Data Collection** - Extension doesn't store or collect user data
- **Minimal Permissions** - Only requires access to YouTube pages
- **Open Source** - Code is transparent and auditable[^1]
- **Minimal Data Collection** - Only collects the minimum data necessary to function (video ID, user-agent, timestamp)

## 🐛 Troubleshooting

### Common Issues

**Summaries not appearing**

- Reload the page (this is likely the most common cause)
- Verify auto-summarize is enabled in settings
- Look for error messages in the extension popup or browser console

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Guidelines

- Follow TypeScript (_strict mode_) best practices
- Use React functional components with hooks
- Maintain consistent styling with Tailwind
- Write comprehensive tests (_coming soon, not a priority yet_)
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Trademarks & Acknowledgments

All product names, logos, brands, trademarks, and registered trademarks featured or referenced within this project remain the exclusive property of their respective owners. These include, but are not limited to:

- **YouTube** and all related marks are trademarks of Google LLC
- **Google Chrome** and related browser technologies are trademarks of Google LLC
- **React**, **TypeScript**, and related tools are trademarks of Meta Platforms, Inc. and Microsoft Corporation respectively

This project is developed independently and is not affiliated with, endorsed by, or sponsored by any of the aforementioned companies. All trademarks are used solely for descriptive purposes to accurately identify the technologies and services with which this extension integrates.

The extension's use of these trademarks does not imply any partnership, sponsorship, or endorsement by the trademark owners.

## 🙏 Acknowledgments

- **Plasmo Framework** for the excellent extension development experience
- **YouTube** for the platform we're enhancing
- **Tailwind CSS** for the beautiful styling system
- **Radix UI** for the accessible component library
- **React** for the powerful UI framework

## 📝 Footnotes

[^1]: The backend server codebase is not (yet) public, nor is it contained in this repository. We will eventually provide a public backend server implementation or even publish the codebase as open source in the future.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/benjamin-kraatz/comments-summarizer/issues)

---

<div align="center">
  <p><strong>Built with ❤️ by BNN using Plasmo, React, and TypeScript</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>
