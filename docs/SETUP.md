# Installation & Setup Guide

## Quick Start

### 1. Prerequisites
- Bun 1.0+ ([Install](https://bun.sh))
- Git

### 2. Clone & Setup
```bash
git clone <repository-url>
cd bun_backend
bun install
```

### 3. Environment Configuration
```bash
cp .env .env.local
# Edit .env.local with your settings
```

### 4. Run Development Server
```bash
bun run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
bun_backend/
├── src/
│   ├── database/          # SQLite database setup
│   ├── middleware/        # Auth, rate limiting middleware
│   ├── routes/            # API endpoint handlers
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Auth, validation, error utilities
│   └── services/          # Business logic (reserved for future)
├── tests/                 # Unit and integration tests
├── index.ts              # Main server file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env                  # Environment variables
└── README.md             # Documentation
```

## Available Scripts

```bash
# Development with hot reload
bun run dev

# Start production server
bun run start

# Build standalone executable
bun run build
bun run build:linux
bun run build:macos
bun run build:windows

# Testing
bun test
bun test --watch
bun test --coverage

# Clean up
bun run clean
```

## Testing the API

### Using Bun fetch
```typescript
// Create user
const response = await fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123',
    password_confirm: 'Password123',
    first_name: 'John',
    last_name: 'Doe'
  })
});
```

### Using curl
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "password_confirm": "Password123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Using cURL (Powershell)
```powershell
$body = @{
    email = "user@example.com"
    password = "Password123"
    password_confirm = "Password123"
    first_name = "John"
    last_name = "Doe"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

## Database

The application uses SQLite with the following features:
- **WAL Mode**: Write-Ahead Logging for concurrent access
- **Foreign Keys**: Enabled for referential integrity
- **Auto-initialization**: Tables created on first run
- **Location**: `./ecommerce.db` (configurable via `DATABASE_URL`)

### Database Backup
```bash
# Backup database
cp ecommerce.db ecommerce.db.backup

# Restore database
cp ecommerce.db.backup ecommerce.db
```

## Security Setup

### JWT Configuration
Change the `JWT_SECRET` in `.env` to a secure random value:

```bash
# Generate a secure secret
openssl rand -base64 32

# Or use Bun
bun -e "console.log(crypto.getRandomValues(new Uint8Array(32)).join(''))"
```

### HTTPS/TLS Configuration
For production, configure TLS certificates:

```env
TLS_CERT_PATH=/path/to/cert.pem
TLS_KEY_PATH=/path/to/key.pem
```

## Deployment

### Docker
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
EXPOSE 3000
CMD ["bun", "start"]
```

Build and run:
```bash
docker build -t ecommerce-backend .
docker run -p 3000:3000 -e JWT_SECRET=your-secret ecommerce-backend
```

### Systemd Service (Linux)
```ini
[Unit]
Description=E-Commerce Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ecommerce-backend
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your-secret"
ExecStart=/usr/bin/bun start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ecommerce-backend
sudo systemctl start ecommerce-backend
```

### Cloud Platforms

#### AWS Lambda
```bash
bun run build:linux
# Upload to Lambda as custom runtime
```

#### Vercel
```bash
vercel --prod
```

#### Railway
```bash
railway link
railway up
```

## Monitoring & Debugging

### View Logs
```bash
# Development
bun run dev 2>&1 | tee app.log

# Production
journalctl -u ecommerce-backend -f
```

### Health Checks
```bash
# Basic health
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/api/v1/status
```

### Database Inspection
```bash
sqlite3 ecommerce.db
> .tables
> .schema users
> SELECT COUNT(*) FROM users;
```

## Troubleshooting

### Port Already in Use
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | Stop-Process
```

### Database Locked
```bash
# Remove WAL files
rm ecommerce.db-shm ecommerce.db-wal

# Or clear database completely
rm ecommerce.db
```

### Memory Issues
```bash
# Increase memory limit
NODE_OPTIONS=--max-old-space-size=2048 bun start
```

## Performance Optimization

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET`
- [ ] Enable `ENABLE_RATE_LIMIT=true`
- [ ] Configure TLS certificates
- [ ] Set up database backups
- [ ] Enable monitoring/logging
- [ ] Use reverse proxy (nginx)
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Monitor database size

### Database Optimization
```bash
# Analyze and optimize
sqlite3 ecommerce.db "ANALYZE;"
sqlite3 ecommerce.db "VACUUM;"
```

## Development Tips

### Hot Reload
Using `bun run dev` enables hot reload. Changes to TypeScript files are automatically recompiled.

### Debug Logging
Add `console.log` statements (they appear in development console):
```typescript
console.log('Debug info:', variable);
```

### Database Queries
Test queries directly:
```bash
sqlite3 ecommerce.db
> SELECT * FROM users LIMIT 5;
```

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Zod Validation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API documentation in README.md
3. Create an issue on GitHub
4. Check existing issues and discussions

---

**Happy building! 🚀**
