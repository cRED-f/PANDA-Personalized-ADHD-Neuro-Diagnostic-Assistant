# Modern AI Chat Interface

A developer-focused chat interface built with Next.js, TypeScript, Tailwind CSS, and Convex database. Features a clean, modern design with real-time messaging, conversation management, and AI model integration.

![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-blue)

## 🤷‍♂️ Demo

![demo1](https://github.com/user-attachments/assets/304f8354-ca8f-464b-a7e8-6efcd4c7cb6c)
![demo2](https://github.com/user-attachments/assets/16259eee-c253-416a-80b7-e12d72275590)
![demo5](https://github.com/user-attachments/assets/22875192-4ed1-4f21-8f5e-5614f700eea7)
![demo4](https://github.com/user-attachments/assets/11299a8c-c755-40bc-8d89-24372cfe40bf)
![demo3](https://github.com/user-attachments/assets/0f9f0d6c-c786-4e31-8a1b-1dc1c6279c43)

## ✨ Features

### 🎯 Core Functionality

- **Real-time Conversations**: Instant messaging with AI models
- **Multiple Chat Sessions**: Create and manage unlimited conversations
- **Persistent History**: All conversations stored securely in Convex database
- **Prompt Templates**: Pre-built prompts for different use cases
- **Model Configuration**: Customizable AI parameters (temperature, context length)

### 🎨 User Experience

- **Modern Interface**: Clean, intuitive design inspired by modern chat applications
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion powered transitions
- **Real-time Updates**: Live conversation synchronization

### ⚙️ Technical Features

- **OpenRouter Integration**: Support for multiple AI models (GPT-4, Claude, Llama, etc.)
- **System Prompts**: Configurable AI behavior and personality
- **Message Management**: Edit, regenerate, and delete messages
- **Export Conversations**: Download chat history
- **No Authentication Required**: Start chatting immediately

### 🔧 Developer Friendly

- **TypeScript**: Full type safety throughout the application
- **Modular Components**: Reusable, well-structured React components
- **Real-time Database**: Convex for instant data synchronization
- **Easy Deployment**: One-click deploy to Vercel
- **Environment Configuration**: Secure API key management

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Convex account** (free tier available at [convex.dev](https://convex.dev))
- **OpenRouter API key** (get one at [openrouter.ai](https://openrouter.ai))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cRED-f/Modern-AI-Chat-Interface.git
   cd Modern-AI-Chat-Interface
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Convex database**

   ```bash
   npx convex dev
   ```

   Follow the prompts to create a new Convex project or link to an existing one.

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   CONVEX_DEPLOYMENT=your-convex-deployment-url
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

7. **Configure your AI settings**
   - Go to Settings in the sidebar
   - Add your OpenRouter API key
   - Select your preferred AI model
   - Customize temperature and other parameters

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main chat interface
│   └── globals.css             # Global styles and variables
├── components/
│   ├── chat/
│   │   ├── chat-ui.tsx         # Main chat interface
│   │   ├── chat-input.tsx      # Message input with prompt selector
│   │   ├── chat-messages.tsx   # Message list container
│   │   └── message.tsx         # Individual message component
│   ├── prompts/
│   │   ├── prompts-manager.tsx # Prompt CRUD operations
│   │   └── prompt-selector.tsx # Dropdown for selecting prompts
│   ├── settings/
│   │   ├── api-settings.tsx    # API configuration
│   │   └── model-presets.tsx   # AI model parameters
│   ├── sidebar/
│   │   ├── sidebar.tsx         # Main sidebar container
│   │   ├── sidebar-content.tsx # Dynamic content switching
│   │   └── items/              # Sidebar item components
│   └── ui/                     # Reusable UI components
├── hooks/
│   └── useOpenRouter.ts        # OpenRouter API integration
├── lib/
│   ├── openrouter-service.ts   # OpenRouter service layer
│   ├── openrouter.ts           # OpenRouter types and config
│   └── utils.ts                # Utility functions
├── types/
│   └── index.ts                # TypeScript type definitions
└── contexts/
    └── chat-context.tsx        # Chat state management
convex/
├── schema.ts                   # Database schema definitions
├── messages.ts                 # Message CRUD operations
├── prompts.ts                  # Prompt management
└── settings.ts                 # Settings management
```

## 🔧 Configuration

### AI Model Settings

Configure your preferred AI models and parameters in the Settings panel:

- **Model Selection**: Choose from GPT-4, Claude, Llama, and other supported models
- **Temperature**: Control creativity vs consistency (0.0 - 1.0)
- **Max Context Length**: Set the maximum tokens for context window
- **API Provider**: Currently supports OpenRouter (more providers coming soon)

### Prompt Templates

Create and manage reusable prompts:

1. Go to the Prompts section in the sidebar
2. Click "New Prompt" to create a custom template
3. Use prompts by selecting them in the chat input

### Environment Variables

```env
# Required
CONVEX_DEPLOYMENT=your-convex-deployment
NEXT_PUBLIC_CONVEX_URL=your-public-convex-url

# Optional
NEXT_PUBLIC_APP_NAME=Modern AI Chat
NEXT_PUBLIC_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

## 🎨 Customization

### Theming

The application uses Tailwind CSS with CSS variables for theming. Customize colors in `src/app/globals.css`:

```css
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  /* Add your custom colors */
}
```

### Adding New AI Providers

1. Create a new service in `src/lib/`
2. Implement the standard interface defined in `openrouter-service.ts`
3. Update the settings component to include your provider

### Custom Components

All components are modular and can be easily customized:

- Modify styling with Tailwind classes
- Add new functionality by extending existing hooks
- Create new components following the established patterns

## 🤝 Contributing

We welcome contributions!

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Convex](https://convex.dev/) - Real-time database
- [OpenRouter](https://openrouter.ai/) - AI model gateway
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Framer Motion](https://framer.com/motion/) - Animation library
- [Tabler Icons](https://tabler-icons.io/) - Icon set

---

**Star ⭐ this repository if you find it helpful!**
