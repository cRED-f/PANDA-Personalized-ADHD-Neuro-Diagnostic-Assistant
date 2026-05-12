# PANDA: Personalized ADHD Neuro Diagnostic Assistant

PANDA (Personalized Attention-Deficit/Hyperactivity Disorder Neuro Diagnostic Assistant) is a conversational screening support platform that helps caregivers describe ADHD-related behaviors through natural dialogue (text or voice), while the system tracks coverage of key symptom indicators and produces structured, assessment-oriented outputs.


---

## What PANDA Does

- **Conversational ADHD screening** through natural dialogue (instead of rigid questionnaires)
- **Tracks assessment progress** during the session to reduce missed areas
- **Post-session scoring pipeline** that extracts evidence from the transcript and generates structured symptom scoring outputs
- **Multi-domain scoring** using a domain-split analysis approach (Oppositional, Cognitive, Hyperactivity, ADHD Index), merged into a final report
- **Voice mode** using speech-to-text and text-to-speech
- **Expanded coverage** to include autism spectrum–related assessment areas

---

## System Overview

High-level flow:

1. User completes a **text or voice** conversation session.
2. The system uses a **conversation framework** plus an **internal tracking method** to keep the interaction natural while still covering symptom areas.
3. Session transcripts are stored for scoring and review.
4. After the session, PANDA runs a **multi-model scoring pipeline** that analyzes distinct domains independently and then merges the outputs into a consolidated assessment.
<img width="1182" height="672" alt="architecture" src="https://github.com/user-attachments/assets/8775eed4-4dcc-40fa-b64c-9215b625fa08" />

---
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-blue)

## 🤷‍♂️ Demo


<img width="1917" height="875" alt="pandaUI" src="https://github.com/user-attachments/assets/d8abb50d-effa-4e94-b52f-9aa2d567eeed" />
<img width="1361" height="795" alt="demo1" src="https://github.com/user-attachments/assets/cd025266-6ee0-4dfd-9688-0fb714e05f4f" />
<img width="1578" height="906" alt="calculate score" src="https://github.com/user-attachments/assets/dc4d8ccd-f1e0-4130-9087-3a33f73bfc32" />

## Evaluation Snapshot

Quantitative results reported on a 10-sample evaluation set:

- **Item alignment:** 83.33% to 94.44%
- **Question coverage:** 78.79% to 85.71%
- **Response mapping accuracy:** 82.00% to 86.00% (reported as ~85% overall in the abstract)
- **Latency:** ~1 second per exchange
- **Typical full session time:** ~20 to 30 minutes (with longer sessions for more complex cases)

---

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



## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Convex](https://convex.dev/) - Real-time database
- [OpenRouter](https://openrouter.ai/) - AI model gateway
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Framer Motion](https://framer.com/motion/) - Animation library
- [Tabler Icons](https://tabler-icons.io/) - Icon set

---

**Star ⭐ this repository if you find it helpful!**

---

## 📄 License

MIT License

Copyright (c) 2025 cRED-f

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
