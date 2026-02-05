# Deployment Guide

## Production Deployment Options

### Option 1: Local/VPS Deployment (Recommended for Testing)

#### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+
- 2GB RAM minimum
- 10GB disk space

#### Steps:

1. **Clone/Upload Project**
```bash
cd /var/www/
# Upload your project here
```

2. **Run Setup Script**
```bash
cd elderly-care-menu-generator
chmod +x setup.sh
./setup.sh
```

3. **Configure Environment Variables**
```bash
# Edit backend/.env
nano backend/.env
```

Add your API keys:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
```

4. **Install PM2 (Process Manager)**
```bash
npm install -g pm2
```

5. **Start Backend**
```bash
cd backend
pm2 start src/server.js --name menu-backend
pm2 save
pm2 startup
```

6. **Start Frontend**
```bash
cd ../frontend
npm run build
pm2 start npm --name menu-frontend -- start
pm2 save
```

7. **Setup Nginx (Optional but Recommended)**
```bash
sudo apt install nginx
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/menu-generator
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/menu-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 2: Docker Deployment

#### Prerequisites
- Docker
- Docker Compose

#### Steps:

1. **Create .env file in project root**
```bash
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

2. **Build and Start Containers**
```bash
docker-compose up -d
```

3. **View Logs**
```bash
docker-compose logs -f
```

4. **Stop Containers**
```bash
docker-compose down
```

---

### Option 3: Cloud Platform Deployment

#### Railway.app (Easiest)

**Backend:**
1. Go to railway.app
2. Create new project
3. Connect GitHub repo (backend folder)
4. Add environment variables:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `FRONTEND_URL` (will be your frontend URL)
5. Deploy

**Frontend:**
1. Create another service
2. Connect GitHub repo (frontend folder)
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` (your backend URL)
4. Deploy

#### Vercel (Frontend) + Railway (Backend)

**Backend on Railway:**
- Same as above

**Frontend on Vercel:**
1. Import GitHub repo
2. Select frontend folder as root
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL`
4. Deploy

#### Render.com

**Backend:**
1. New Web Service
2. Connect repo
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && node src/server.js`
5. Add environment variables
6. Deploy

**Frontend:**
1. New Web Service
2. Connect repo
3. Build command: `cd frontend && npm install && npm run build`
4. Start command: `cd frontend && npm start`
5. Add environment variables
6. Deploy

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

---

## Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# PM2
pm2 restart all

# Docker
docker-compose restart

# Nginx
sudo systemctl restart nginx
```

### Update Application
```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all
```

---

## Backup Strategy

### Important Files to Backup
- `backend/cache/` - Generated images
- `backend/outputs/` - Generated PDFs
- `backend/logs/audit.json` - Generation history
- `.env` files - Configuration

### Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backup-$DATE.tar.gz \
  backend/cache \
  backend/outputs \
  backend/logs \
  backend/.env \
  frontend/.env.local

# Upload to cloud storage
# aws s3 cp backup-$DATE.tar.gz s3://your-bucket/
```

---

## Monitoring

### Resource Usage
```bash
# CPU and Memory
htop

# Disk space
df -h

# PM2 monitoring
pm2 monit
```

### Set up Alerts
Consider using:
- UptimeRobot (free uptime monitoring)
- Sentry (error tracking)
- LogRocket (session replay)

---

## Cost Estimates

### Self-Hosted (VPS)
- DigitalOcean Droplet: $12/month
- Domain: $10/year
- Total: ~$13/month

### Cloud Hosted
- Railway: $5-10/month
- Vercel: Free tier OK for light use
- Total: $5-10/month

### API Costs
- Claude Vision: ~$0.01 per menu
- DALL-E 3: ~$0.25 per menu
- Total per menu: ~$0.26
- Monthly (30 menus): ~$8
- With caching (after 2 weeks): ~$3-5

**Grand Total: $18-28/month**

---

## Troubleshooting

### Backend won't start
- Check API keys are set correctly
- Verify Node.js version: `node -v` (should be 18+)
- Check logs: `pm2 logs menu-backend`

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Test API: `curl http://localhost:5000/health`

### PDF generation fails
- Install Chromium: `sudo apt install chromium-browser`
- Check Puppeteer logs
- Verify disk space available

### Images not generating
- Verify OpenAI API key has credits
- Check API usage limits
- Test API: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

---

## Security Checklist

- [ ] API keys stored in environment variables (not code)
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured (UFW or similar)
- [ ] Regular backups scheduled
- [ ] PM2 logs rotated
- [ ] Nginx rate limiting enabled
- [ ] File upload size limits set
- [ ] CORS properly configured

---

## Support

For issues:
1. Check logs first
2. Verify API keys
3. Test API endpoints individually
4. Check network connectivity

Common issues and solutions are documented in the main README.md
