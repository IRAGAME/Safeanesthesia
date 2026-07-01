# SafeAnesthesia

[![Node.js CI](https://github.com/IRAGAME/Safeanesthesia/actions/workflows/node.js.yml/badge.svg)](https://github.com/IRAGAME/Safeanesthesia/actions/workflows/node.js.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://safeanesthesia.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://safeanesthesia.onrender.com)

A continuing medical education platform for anesthesia professionals across Africa, built for **SPOOA-PM Africa**.

## Features

- 📚 Browse and access medical training modules
- 🔐 Admin panel with JWT authentication
- 📝 CRUD management for training formations
- 📧 Contact form with email notifications
- 🖼️ Image upload and management via Supabase Storage
- 📱 Responsive design for desktop and mobile
- 🔒 Security-focused with Helmet and rate limiting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Backend** | Node.js, Express 5 (ES Modules) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | JWT (JSON Web Tokens) |
| **Email** | Nodemailer (SMTP) |
| **Deployment** | Vercel (Frontend), Render (Backend) |

## Getting Started

### Prerequisites

- Node.js >= 18
- A Supabase account (free tier works)
- An SMTP email provider

### Installation

```bash
# Clone the repository
git clone https://github.com/IRAGAME/Safeanesthesia.git
cd Safeanesthesia

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```env
PORT=5000
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
CORS_ORIGIN=https://safeanesthesia.vercel.app
STORAGE_TYPE=external
```

### Run Locally

```bash
# Start backend
cd backend
node server.js

# Open frontend (serve with any static server)
cd frontend
npx serve .
```

## API Documentation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/formations` | List all formations | No |
| GET | `/api/formations/:id` | Get formation by ID | No |
| POST | `/api/auth/login` | Admin login | No |
| GET | `/api/auth/verify` | Verify JWT token | Yes |
| POST | `/api/admin/formations` | Create formation | Yes |
| PUT | `/api/admin/formations/:id` | Update formation | Yes |
| DELETE | `/api/admin/formations/:id` | Delete formation | Yes |
| POST | `/send` | Submit contact form | No |

## Project Structure

```
├── backend/
│   ├── server.js          # Express server entry point
│   ├── cors.js            # CORS configuration
│   ├── storage.js         # Supabase storage client
│   ├── supabase.js        # Supabase database client
│   └── .env.example       # Environment variables template
├── frontend/
│   ├── index.html         # Home page
│   ├── about.html         # About page
│   ├── contact.html       # Contact page
│   ├── login.html         # Admin login
│   ├── admin.html         # Admin dashboard
│   ├── formation.html     # Formation detail page
│   ├── formations.html    # Formations listing
│   ├── css/
│   │   └── style.css      # Stylesheet
│   └── js/                # JavaScript modules
│       ├── config.js
│       ├── index.js
│       ├── admin.js
│       ├── formation.js
│       ├── formations.js
│       └── script.js
├── .gitignore
└── README.md
```

## Deployment

- **Frontend**: Deployed on [Vercel](https://safeanesthesia.vercel.app)
- **Backend**: Deployed on [Render](https://safeanesthesia.onrender.com)

## Roadmap

- [ ] Unit and integration tests
- [ ] Internationalization (FR/EN)
- [ ] User registration for learners
- [ ] Progress tracking and certificates
- [ ] Video content support
- [ ] Offline access via PWA

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for SPOOA-PM Africa*
