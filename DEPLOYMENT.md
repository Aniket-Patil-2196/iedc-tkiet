# IEDC TKIET Platform — Production Deployment Guide

This document outlines the system requirements, configuration steps, and operational procedures for deploying the official **Innovation and Entrepreneurship Development Cell (IEDC)** platform of **Tatyasaheb Kore Institute of Engineering and Technology (TKIET)**.

---

## 1. System Requirements

- **Node.js**: `v18.18.0` or `v20.x` LTS (Active LTS recommended)
- **Package Manager**: `npm` (v9+) or `yarn` (v1.22+)
- **Database**: MongoDB `v6.0+` (MongoDB Atlas or self-hosted replica set recommended for transactions)
- **Reverse Proxy**: NGINX, Caddy, or Cloudflare with TLS (HTTPS) termination
- **Operating System**: Linux (Ubuntu 22.04 LTS / Debian 12 recommended) or Windows Server

---

## 2. Quick Start Commands

```bash
# 1. Clone repository
git clone <repository-url>
cd IEDC_WEB

# 2. Install dependencies
npm install

# 3. Create environment file from template
cp .env.example .env.production

# 4. Compile optimized production build
npm run build

# 5. Start production server
npm run start
```

For continuous background execution on Linux servers, use PM2:
```bash
npm install -g pm2
pm2 start npm --name "iedc-tkiet-web" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 3. Environment Variables Specification

Create a `.env.production` file in the application root directory with the following variables:

```ini
# ==============================================================================
# DATABASE PERSISTENCE
# ==============================================================================
# Production MongoDB connection URI (Atlas SRV or private network connection string)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/iedc_prod?retryWrites=true&w=majority

# ==============================================================================
# SINGLE ADMINISTRATOR AUTHENTICATION
# ==============================================================================
# Official administrative email authorized to access /admin
ADMIN_EMAIL=admin@tkiet.ac.in

# Pre-computed scrypt password hash.
# In production, prefer ADMIN_PASSWORD_HASH over plaintext ADMIN_PASSWORD.
# Format: scrypt:<16-byte-hex-salt>:<64-byte-hex-derived-key>
ADMIN_PASSWORD_HASH=

# Alternatively, set a complex 16+ character password (used if hash is empty)
ADMIN_PASSWORD=

# Cryptographic secret key used to sign HTTP-only session tokens (HMAC-SHA256).
# Generate using: openssl rand -base64 48
SESSION_SECRET=

# ==============================================================================
# SMTP NOTIFICATIONS (Contact Form Submissions)
# ==============================================================================
# Outgoing mail server for forwarding public inquiries to cell coordinators
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=iedc.notifications@tkiet.ac.in
SMTP_PASSWORD=
CONTACT_RECEIVER_EMAIL=iedc@tkiet.ac.in

# ==============================================================================
# CANONICAL SEO & DOMAIN CONFIGURATION
# ==============================================================================
NEXT_PUBLIC_SITE_URL=https://iedc.tkiet.ac.in
NODE_ENV=production
```

> [!CAUTION]
> **Secret Hygiene**: Never commit `.env.production` or any environment files containing live credentials to Git. The repository's `.gitignore` is already pre-configured to exclude all `.env*` files.

---

## 4. Single-Admin Credential Setup

The platform implements a strict **single-administrator model**. No registration endpoints exist.

### Generating a Secure Password Hash
You can generate a scrypt hash using Node.js REPL:
```bash
node -e "
const crypto = require('crypto');
const salt = crypto.randomBytes(16).toString('hex');
const key = crypto.scryptSync('YOUR_COMPLEX_PASSWORD_HERE', salt, 64).toString('hex');
console.log('ADMIN_PASSWORD_HASH=scrypt:' + salt + ':' + key);
"
```
Copy the generated output directly into your `.env.production` file.

---

## 5. First Content Initialization (CMS)

When deploying to a brand-new MongoDB database, all collections will initially be empty:

1. **Production Safety Behavior**:
   - In `NODE_ENV=production`, the public website will **never** display fictional placeholder items.
   - Archives with zero published items automatically present dignified institutional empty states (e.g., *"No upcoming events at the moment"*, *"No published articles yet"*).
   - About page automatically renders the official TKIET baseline mission and vision statements.

2. **Accessing the Administrative Portal**:
   - Navigate to `https://iedc.tkiet.ac.in/admin`.
   - Log in using your configured `ADMIN_EMAIL` and password.

3. **Populating Initial Cell Records**:
   - **Leadership**: Add the 5 institutional leaders (CEO, Principal, Dean, Faculty Coordinator, Student President).
   - **About**: Review or customize the Mission, Vision, and Institutional Introduction text.
   - **Team**: Add current student leads and faculty coordinators.
   - **Collaborations**: Add affiliated councils and national challenges (NEC, IIC).
   - **Achievements**: Publish student hackathon accolades and patent disclosures.
   - **Gallery**: Upload event photographs to populate the 3D Photo Globe.
   - **Events & Blogs**: Create upcoming event notices and publish introductory articles.

---

## 6. Reverse Proxy & HTTPS Configuration (NGINX)

Below is an example NGINX server block for reverse proxying to Next.js on port 3000:

```nginx
server {
    listen 80;
    server_name iedc.tkiet.ac.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name iedc.tkiet.ac.in;

    ssl_certificate /etc/letsencrypt/live/iedc.tkiet.ac.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/iedc.tkiet.ac.in/privkey.pem;

    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Max upload size matching CMS limit (5MB)
    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Security & Operational Checklist

- [ ] Ensure HTTPS is enforced across all routes with valid TLS certificates.
- [ ] Confirm `ADMIN_EMAIL` is set to the authorized cell administrator.
- [ ] Confirm `SESSION_SECRET` is set to a cryptographically random string (min 64 chars).
- [ ] Confirm `MONGODB_URI` points to a dedicated database with restricted network access.
- [ ] Test the public contact form and verify that email notifications reach the coordination inbox.
- [ ] Test admin authentication rate limiting by verifying that repeated invalid logins trigger temporary lockout.
- [ ] Verify that `/admin` and `/admin/dashboard` are not exposed in public sitemaps or indexed by search engines.
