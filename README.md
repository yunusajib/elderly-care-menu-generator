# Elderly Care Home Menu Generator

A production-ready AI-powered system for generating daily care home menus with consistent design and AI-generated meal images.

## 🎯 Features

- **OCR Menu Extraction** - Upload photo of handwritten menu
- **AI Image Generation** - DALL-E 3 generates consistent meal images
- **Fixed Template** - Same design every day, only content changes
- **PDF Export** - Print-ready A4 menus
- **Validation System** - Ensures no content is modified or missed
- **Image Caching** - Reuses images for recurring meals
- **Audit Trail** - Logs all generated menus

## 📋 Prerequisites

- Node.js 18+ and npm
- Anthropic API key (for Claude Vision OCR)
- OpenAI API key (for DALL-E 3 image generation)

## 🚀 Quick Start

### 1. Clone/Download Project

```bash
cd elderly-care-menu-generator
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development

# API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# File paths
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
CACHE_DIR=./cache

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Get API Keys

**Anthropic API Key:**
1. Go to https://console.anthropic.com/
2. Sign up/login
3. Go to API Keys section
4. Create new key

**OpenAI API Key:**
1. Go to https://platform.openai.com/
2. Sign up/login
3. Go to API Keys
4. Create new key

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the app:**
Open http://localhost:3000 in your browser

## 📁 Project Structure

```
elderly-care-menu-generator/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express server
│   ├── uploads/             # Uploaded menu images
│   ├── outputs/             # Generated PDFs
│   ├── cache/               # Cached meal images
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
│
└── README.md
```

## 🎨 How It Works

1. **Upload Menu** - Admin uploads photo or text of daily menu
2. **OCR Extraction** - Claude Vision API extracts menu content
3. **Validation** - System validates structure and content
4. **Image Generation** - DALL-E 3 generates meal images with locked style
5. **PDF Creation** - Combines content and images into fixed template
6. **Download** - Admin downloads print-ready PDF

## 💰 Cost Estimation

### Daily Costs (per menu generation):
- Claude Vision OCR: ~$0.01
- DALL-E 3 Images (5-8 images): ~$0.20-0.32
- **Total per menu: ~$0.21-0.33**

### Monthly Costs (30 menus):
- Without caching: ~$6.30-9.90
- With caching (60% reuse): ~$3-5

## 🔧 Configuration

### Menu Structure
Edit `backend/src/config/menuStructure.js` to customize your menu sections.

### Image Style
Edit `backend/src/config/imageStyle.js` to modify the locked visual style for generated images.

### PDF Template
Edit `backend/src/templates/menuTemplate.html` to customize the menu design.

## 📝 Usage

### Basic Flow:
1. Open http://localhost:3000
2. Upload today's menu (image or text)
3. Review extracted content
4. Click "Generate Menu"
5. Review generated images
6. Approve and download PDF

### API Endpoints:

**POST** `/api/menu/extract`
- Upload menu image
- Returns extracted content

**POST** `/api/menu/generate`
- Generate complete menu with images
- Returns PDF download link

**GET** `/api/cache/stats`
- View image cache statistics

## 🐛 Troubleshooting

### "API Key Invalid"
- Check your .env files have correct API keys
- Ensure no extra spaces or quotes

### "Images not generating"
- Verify OpenAI API key has credits
- Check API usage limits

### "PDF generation fails"
- Ensure Puppeteer dependencies installed
- On Linux: `sudo apt-get install -y chromium-browser`

### "Port already in use"
- Change PORT in backend/.env
- Update NEXT_PUBLIC_API_URL in frontend/.env.local

## 📦 Production Deployment

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

### Option 2: Cloud Platform

**Backend:** Deploy to Railway/Render/Heroku
**Frontend:** Deploy to Vercel/Netlify

See `DEPLOYMENT.md` for detailed instructions.

## 🔐 Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Use environment variables in production
- Enable HTTPS in production
- Implement user authentication for multi-user setups

## 📄 License

MIT License - Feel free to use and modify for your care home.

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation
3. Check console logs for errors

## 🎯 Next Steps After Testing

1. Customize the PDF template design
2. Add your care home logo
3. Test with real menu data
4. Train staff on the system
5. Deploy to production

---

**Ready to generate your first menu! 🎉**
