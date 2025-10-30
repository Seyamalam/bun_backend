# Deployment Guide

## 📦 Production Deployment

This guide covers deploying the E-Commerce Backend to production environments.

---

## 🏗️ Building for Production

### 1. Create Production Build

**Cross-platform build:**
```bash
bun run build
# Output: dist/ecommerce or dist/ecommerce.exe (platform-dependent)
```

**Build for specific platform:**
```bash
# Linux
bun run build:linux
# Output: dist/ecommerce-linux

# macOS
bun run build:macos
# Output: dist/ecommerce-macos

# Windows
bun run build:windows
# Output: dist/ecommerce.exe
```

### 2. Build Size & Performance
- **Executable size:** ~50-100MB (includes Bun runtime)
- **Database:** SQLite file (~10-100MB depending on data)
- **Memory usage:** 50-200MB average
- **Performance:** 1000+ requests/second on modern hardware

---

## 🐳 Docker Deployment

### 1. Build Docker Image

```bash
docker build -t ecommerce-backend:latest .
```

### 2. Run Container

**Development:**
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e JWT_SECRET=your-secret \
  -v ./ecommerce.db:/app/ecommerce.db \
  ecommerce-backend:latest
```

**Production:**
```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  -e DATABASE_URL=/app/data/ecommerce.db \
  -v /data/ecommerce:/app/data \
  -v /etc/ssl/certs:/app/certs:ro \
  --restart unless-stopped \
  --name ecommerce-backend \
  ecommerce-backend:latest
```

### 3. Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: /app/data/ecommerce.db
      PORT: 3000
    volumes:
      - backend_data:/app/data
      - ./certs:/app/certs:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  backend_data:
    driver: local
```

Run with compose:
```bash
docker-compose up -d
```

---

## ☁️ Cloud Deployment

### AWS EC2

1. **Launch EC2 Instance**
   - Image: Amazon Linux 2 or Ubuntu 20.04+
   - Instance type: t3.medium or larger
   - Storage: 30GB EBS

2. **Install Bun** (if running from source)
   ```bash
   curl https://bun.sh/install | bash
   ```

3. **Deploy Application**
   ```bash
   cd /opt/ecommerce-backend
   bun run build
   ```

4. **Run with systemd** (see systemd section below)

### AWS Lambda

1. **Build for Lambda**
   ```bash
   bun run build:linux
   ```

2. **Create Lambda function**
   - Runtime: Custom runtime
   - Handler: dist/ecommerce
   - Memory: 1024MB
   - Timeout: 60 seconds

3. **Configure environment variables**
   - `NODE_ENV=production`
   - `JWT_SECRET=<value>`
   - `DATABASE_URL=/tmp/ecommerce.db`

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Note:** Vercel has limitations (functions are serverless), consider Railway or Fly.io instead.

### Railway

1. **Connect repository**
   - Push code to GitHub

2. **Deploy**
   ```bash
   railway link
   railway up
   ```

3. **Set environment variables** in Railway dashboard

### Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create app**
   ```bash
   fly launch
   ```

3. **Deploy**
   ```bash
   fly deploy
   ```

---

## 🔧 Systemd Service (Linux)

Create `/etc/systemd/system/ecommerce-backend.service`:

```ini
[Unit]
Description=E-Commerce Backend Server
After=network.target syslog.target
Wants=network-online.target

[Service]
Type=simple
User=ecommerce
Group=ecommerce
WorkingDirectory=/opt/ecommerce-backend
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="JWT_SECRET=your-secret-key-here"
Environment="DATABASE_URL=/opt/ecommerce-backend/ecommerce.db"
ExecStart=/opt/ecommerce-backend/dist/ecommerce

# Restart settings
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/ecommerce-backend/ecommerce.db

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ecommerce-backend
sudo systemctl start ecommerce-backend
sudo systemctl status ecommerce-backend
```

---

## 🔒 SSL/TLS Configuration

### 1. Generate Self-Signed Certificate (testing only)

```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### 2. Using Let's Encrypt (production)

**With Certbot:**
```bash
sudo certbot certonly --standalone -d yourdomain.com
# Certificates go to: /etc/letsencrypt/live/yourdomain.com/
```

### 3. Configure in Application

Update `.env.production`:
```env
TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Or in Bun config (when implemented):
```typescript
const server = Bun.serve({
  tls: {
    cert: Bun.file(process.env.TLS_CERT_PATH),
    key: Bun.file(process.env.TLS_KEY_PATH),
  },
  // ... rest of config
});
```

---

## 🌐 Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/ecommerce`:

```nginx
upstream ecommerce_backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Compression
    gzip on;
    gzip_types application/json text/plain;
    gzip_min_length 1024;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;
    limit_req zone=general burst=200 nodelay;
    
    # Proxy settings
    location / {
        proxy_pass http://ecommerce_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 📊 Monitoring & Logging

### 1. Application Logging

**View logs:**
```bash
# Real-time
sudo journalctl -u ecommerce-backend -f

# Last 100 lines
sudo journalctl -u ecommerce-backend -n 100

# Specific time range
sudo journalctl -u ecommerce-backend --since "2024-01-15"
```

### 2. Health Checks

**Configure monitoring:**
```bash
# Check every 30 seconds
curl http://localhost:3000/health

# Check detailed status
curl http://localhost:3000/api/v1/status
```

### 3. Log Aggregation

**Using ELK Stack:**
```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/ecommerce-backend.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### 4. Metrics Collection

**Using Prometheus:**
```bash
# Add to nginx config
location /metrics {
    proxy_pass http://ecommerce_backend;
}
```

---

## 🔄 Database Backups

### 1. Automated Backups

Create `/opt/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Create backup
cp /opt/ecommerce-backend/ecommerce.db "$BACKUP_DIR/ecommerce_$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "ecommerce_*.db" -mtime +30 -delete
```

Add to crontab:
```bash
# Backup every 6 hours
0 */6 * * * /opt/backup-db.sh

# Backup daily
0 2 * * * /opt/backup-db.sh
```

### 2. Remote Backups

**Upload to S3:**
```bash
aws s3 cp ecommerce.db s3://my-backup-bucket/ecommerce_$(date +%Y-%m-%d).db
```

**Restore from backup:**
```bash
aws s3 cp s3://my-backup-bucket/ecommerce_2024-01-15.db ecommerce.db
```

---

## ⚡ Performance Optimization

### 1. Database Optimization

```bash
# Analyze database
sqlite3 ecommerce.db "ANALYZE;"

# Optimize database
sqlite3 ecommerce.db "VACUUM;"

# Check database integrity
sqlite3 ecommerce.db "PRAGMA integrity_check;"
```

### 2. Enable WAL Mode

Already enabled by default. Verify:
```bash
sqlite3 ecommerce.db "PRAGMA journal_mode;"
# Output: wal
```

### 3. Set Connection Pooling

Will be implemented in future versions for MySQL/PostgreSQL support.

### 4. Enable Caching

Consider Redis for:
- Session storage
- Rate limiting
- Product catalog caching
- Order caching

---

## 🚨 Disaster Recovery

### 1. Database Recovery

**If database is corrupted:**
```bash
# Restore from backup
cp ecommerce.db.backup ecommerce.db

# Or rebuild from latest backup
aws s3 cp s3://my-backup-bucket/latest.db ecommerce.db
```

### 2. Service Recovery

**Auto-restart with systemd:**
```bash
sudo systemctl restart ecommerce-backend
```

**Docker auto-restart:**
```bash
docker run --restart unless-stopped ...
```

### 3. Data Recovery

**Restore point-in-time (daily backups):**
```bash
# List available backups
ls -la /opt/backups/

# Restore specific backup
cp /opt/backups/ecommerce_2024-01-15.db ecommerce.db
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable TLS/SSL with Let's Encrypt
- [ ] Configure firewall (allow only ports 80, 443)
- [ ] Set up regular database backups
- [ ] Enable monitoring and alerting
- [ ] Configure rate limiting
- [ ] Set strong database file permissions (chmod 600)
- [ ] Use environment variables for secrets
- [ ] Configure HTTPS headers
- [ ] Set up DDoS protection
- [ ] Enable security auditing
- [ ] Regular dependency updates

---

## 🚀 Deployment Checklist

- [ ] Build production binary
- [ ] Test in staging environment
- [ ] Backup current database
- [ ] Set environment variables
- [ ] Configure SSL certificates
- [ ] Set up nginx reverse proxy
- [ ] Configure systemd service
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up automated backups
- [ ] Test health check endpoint
- [ ] Test critical API endpoints
- [ ] Set up alerting
- [ ] Document deployment procedure
- [ ] Create rollback plan

---

## 📞 Support & Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database locked:**
```bash
# Remove WAL files
rm ecommerce.db-shm ecommerce.db-wal
```

**Application won't start:**
```bash
# Check logs
journalctl -u ecommerce-backend -e

# Test manually
cd /opt/ecommerce-backend
./dist/ecommerce
```

---

## 📚 Additional Resources

- [Bun Deployment Guide](https://bun.sh/docs)
- [Docker Best Practices](https://docs.docker.com)
- [Nginx Documentation](https://nginx.org/docs)
- [Let's Encrypt](https://letsencrypt.org)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

---

**Happy Deploying! 🚀**
