# IEDC TKIET — Official Web Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.165-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

The official web platform of the **Innovation and Entrepreneurship Development Cell (IEDC)** at **Tatyasaheb Kore Institute of Engineering and Technology (TKIET), Warananagar**.

This platform serves as the central digital ecosystem for fostering student entrepreneurship, showcasing innovations, organizing national hackathons, managing institutional collaborations, and providing an administrative content management system.

---

## Key Features

- **Interactive 3D Visualizations**: Dynamic 3D interactive photo globe and interactive canvases powered by Three.js and `@react-three/fiber`.
- **Comprehensive Admin CMS**: Complete administrative portal (`/admin`) for managing events, blogs, leadership records, student teams, gallery photos, and achievements.
- **Single-Administrator Security Model**: Protected administrative workflows with PBKDF2/scrypt password hashing and HMAC-SHA256 signed HTTP-only session cookies.
- **RESTful API Architecture**: Modular Next.js App Router API endpoints handling contact inquiries, asset uploads, and database entities.
- **Responsive Institutional Dark UI**: Built with Tailwind CSS and GSAP animations, optimized for high performance, accessibility, and modern aesthetics.
- **Robust Database Layer**: MongoDB persistence with Mongoose schema modeling and connection lifecycle management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.5 |
| **Styling & UI** | Tailwind CSS, Lucide React, clsx, tailwind-merge |
| **3D & Animations** | Three.js, `@react-three/fiber`, `@react-three/drei`, GSAP |
| **Database & ODM** | MongoDB, Mongoose 8 |
| **Security & Auth** | Node.js Crypto (`scrypt`, `HMAC-SHA256`), Web Crypto API |

---

## Project Structure

```
IEDC_WEB/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── (public)/           # Public institutional pages (home, about, events, team...)
│   ├── admin/              # Administrative CMS login and dashboard panels
│   └── api/                # Next.js Route Handlers (REST API endpoints)
│       ├── admin/          # Authenticated CMS CRUD endpoints
│       └── contact/        # Public contact form submission endpoint
├── components/             # Reusable UI, layout, 3D Canvas, and CMS components
├── lib/                    # Core utilities, database connection, and auth logic
│   ├── auth/               # Session verification and password hashing utilities
│   └── db/                 # MongoDB Mongoose connection client
├── models/                 # Mongoose data schemas (Events, Blogs, Team, etc.)
├── public/                 # Static assets, institutional SVGs, and placeholder media
├── types/                  # TypeScript interface declarations
├── .env.example            # Environment configuration template
├── DEPLOYMENT.md           # Production deployment reference
└── next.config.mjs         # Next.js configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or `v20.x` LTS
- **npm** (v9+) or **yarn** (v1.22+)
- **MongoDB**: Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aniket-Patil-2196/iedc-tkiet.git
   cd iedc-tkiet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a local configuration file from the template:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URI and credentials.

---

## Environment Variables

Configure the following variables in your `.env.local` (or production environment manager):

| Variable | Description | Example / Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/iedc_tkiet` |
| `ADMIN_EMAIL` | Authorized administrator login email | `admin@tkiet.ac.in` |
| `ADMIN_PASSWORD_HASH` | Scrypt password hash for admin | *Pre-computed scrypt hash* |
| `ADMIN_PASSWORD` | Fallback admin password for dev | `your-secure-password` |
| `SESSION_SECRET` | 64+ char random key for session signing | `your-cryptographic-secret-key` |
| `SMTP_HOST` | Outgoing SMTP host (optional for dev) | `smtp.example.com` |
| `SMTP_PORT` | Outgoing SMTP port | `587` |
| `SMTP_USER` | SMTP username | `no-reply@tkiet.ac.in` |
| `SMTP_PASSWORD` | SMTP password / app key | `your-smtp-password` |
| `CONTACT_RECEIVER_EMAIL` | Recipient inbox for contact submissions | `iedc@tkiet.ac.in` |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL of the platform | `http://localhost:3000` |
| `NODE_ENV` | Runtime environment mode | `development` / `production` |

> **Security Note**: Never commit `.env` or `.env.*` files containing live credentials. All `.env` files (except `.env.example`) are ignored by Git.

---

## Development & Building

### Running the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Compiling Production Build

To test type-checking, route generation, and production compilation:

```bash
npm run build
```

### Running Production Server

```bash
npm run start
```

---

## Deployment Architecture

The planned production deployment architecture utilizes a decoupled modern infrastructure:

- **Frontend & Public Experience** → **[Vercel](https://vercel.com/)**  
  Edge-optimized delivery, automatic SSL, asset caching, and global CDN distribution.
- **Backend & Database Services** → **[Render](https://render.com/)**  
  Dedicated background service orchestration, continuous API execution, and MongoDB Atlas persistence.

For dedicated self-hosted server deployments (NGINX reverse proxy, PM2 process management, and TLS setup), refer to [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Administrative CMS Access

1. Navigate to `/admin` on your deployment or local instance.
2. Sign in using the credentials defined by `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (or `ADMIN_PASSWORD`).
3. Manage events, news articles, leadership records, student teams, and gallery media through the centralized dashboard.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

**Innovation & Entrepreneurship Development Cell (IEDC)**  
Tatyasaheb Kore Institute of Engineering & Technology, Warananagar  
Web: [https://tkiet.ac.in](https://tkiet.ac.in)
