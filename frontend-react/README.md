# AI Interview Chatbot - React Frontend

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+ (required by Vite)
- Python 3.8+ (for backend)

### Installation

1. **Install Frontend Dependencies:**
```bash
cd frontend-react
npm install
```

2. **Start Development Server:**
```bash
npm run dev
```

The app will run on `http://localhost:5173`

### Backend Setup

Make sure the backend is running on port 5000:

```bash
cd backend
python app.py
```

## 🎨 Features

### Modern UI/UX
- ✨ **Glassmorphism Design** - Beautiful frosted glass effects
- 🌈 **Gradient Accents** - Vibrant purple/blue/cyan color scheme
- 🎬 **Smooth Animations** - Framer Motion powered transitions
- 📱 **Fully Responsive** - Works on all screen sizes
- 🌙 **Dark Theme** - Easy on the eyes

### Functionality
- 🔐 **User Authentication** - Login with username/password
- 💬 **Text Answers** - Type your responses
- 🎤 **Audio Recording** - 5-second voice answers
- 📊 **Real-time Feedback** - See questions and responses instantly
- 📈 **Final Report** - Detailed interview results with score

## 📁 Project Structure

```
frontend-react/
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Authentication UI
│   │   ├── Interview.jsx      # Main interview interface
│   │   ├── ChatBubble.jsx     # Message bubbles
│   │   ├── AudioRecorder.jsx  # Voice recording
│   │   └── Report.jsx         # Final results
│   ├── services/
│   │   └── api.js             # Backend API calls
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🔌 API Endpoints

The frontend connects to these backend endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/interview/start_session` - Begin interview
- `POST /api/interview/submit_answer` - Submit text answer
- `POST /api/interview/upload_audio` - Upload audio answer

## 🎯 Usage Flow

1. **Login** - Enter credentials (default: candidate1/password123)
2. **Start Interview** - Click "Start Interview" button
3. **Answer Questions** - Use text input OR audio recording
4. **Complete** - Receive final decision and detailed report

## 🛠️ Technologies

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#0ea5e9 → #0284c7)
- **Accent**: Cyan gradient (#06b6d4 → #0891b2)
- **Background**: Dark navy with purple tones
- **Glass**: White with 10-15% opacity + backdrop blur

### Components
- **Buttons**: Gradient primary, glass secondary
- **Inputs**: Glass with focus rings
- **Chat Bubbles**: Glass for bot, gradient for user
- **Cards**: Glass with strong blur

## 🐛 Troubleshooting

### Node Version Error
If you see "Vite requires Node.js version 20.19+ or 22.12+":
- Update Node.js: Download from [nodejs.org](https://nodejs.org)
- Or use nvm: `nvm install 20` then `nvm use 20`

### Backend Connection Error
- Ensure backend is running on `http://127.0.0.1:5000`
- Check CORS is enabled in Flask app
- Verify API endpoints are accessible

### Audio Recording Not Working
- Grant microphone permissions in browser
- Use HTTPS or localhost (required for MediaRecorder API)
- Check browser compatibility (Chrome/Edge recommended)

## 📝 Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Adding New Features

1. Create component in `src/components/`
2. Add API call in `src/services/api.js`
3. Import and use in `Interview.jsx` or `App.jsx`

## 🚀 Production Build

```bash
npm run build
```

Output will be in `dist/` folder. Serve with any static file server.

## 📄 License

Research Prototype - Educational Use Only
