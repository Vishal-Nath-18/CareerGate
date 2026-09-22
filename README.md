# CareerGate

**AI-powered career platform connecting students with real industry opportunities through personalized skill-gap analysis, intelligent job matching, career guidance, and recruitment workflows.**

CareerGate is a **Smart India Hackathon (SIH) 2026** project built to address the gap between what students currently know and what industry opportunities actually require. It brings students and industry users onto one platform and uses AI to turn a student's profile, career goals, skills, and current opportunities into actionable career guidance.

## 🚀 What CareerGate Does

CareerGate serves two sides of the career ecosystem:

- **Students** can build a career profile, discover internships and placements, apply to opportunities, track applications, analyze their skill gaps, and generate an AI-powered career scorecard.
- **Industry users** can create company profiles, publish internship or placement opportunities, define required skills, and manage student applications.

The platform is designed with a focus on **AYUSH and related healthcare/traditional-medicine opportunities**, while its career scorecard can provide guidance based on a student's broader career goal.

## 🎯 The Problem

Students often face a fragmented career journey:

- They may not know which skills employers currently demand.
- Job portals usually show opportunities but do not explain **why a student is or is not ready** for them.
- Students lack personalized, actionable roadmaps for closing their skill gaps.
- Industry users need a structured way to publish opportunities and evaluate incoming applications.
- Students and employers therefore operate in separate systems with limited feedback between skills and actual market demand.

## 💡 The CareerGate Approach

CareerGate connects student profiles, career goals, skills, resumes, and real opportunities available on the platform to create a personalized career workflow.

```text
Student Profile
      ↓
Skills + Career Goal + Resume
      ↓
Open Opportunities on CareerGate
      ↓
AI Career Analysis
      ↓
┌──────────────────────────────────────┐
│ Skill Gaps                           │
│ Job Matching + Match Scores          │
│ Missing Skills                       │
│ Industry-Demand Insights             │
│ Personalized Learning Path           │
└──────────────────────────────────────┘
      ↓
Career Scorecard
      ↓
Applications
      ↓
Industry Review
      ↓
Accepted / Rejected
```

The AI skill analysis uses **current open opportunities on the platform** as market-demand context instead of looking at a student's skills in isolation.

## ✨ Key Features

### 👨‍🎓 Student Features

- Student registration and authentication
- Personal career profile
- College, degree, academic year, skills, and career goals
- Resume PDF upload
- Browse open internship and placement opportunities
- View job details and required skills
- Apply to opportunities
- Track application status
- Bookmark functionality in the application ecosystem
- AI-powered skill-gap analysis
- Industry-demand insights based on current open opportunities
- AI job matching with match scores and missing skills
- Personalized learning path
- AI Career Scorecard
- Career readiness score
- Missing-skill identification
- Recommended project ideas
- Recommended courses/certifications
- Relevant programming/query language recommendations
- Phased career roadmap
- Optional personal OpenRouter API key/model configuration

### 🏢 Industry Features

- Industry/company registration
- Company profile
- Post internship opportunities
- Post placement opportunities
- Specify job location and description
- Define required skills
- Add custom skills in addition to predefined AYUSH-sector skills
- View applicants
- Accept or reject applications
- Manage posted opportunities


## 🤖 AI Features

CareerGate uses OpenRouter-compatible LLMs to power personalized career intelligence.

### Skill Gap Analysis

The AI analyzes a student's profile against the requirements of currently open opportunities on CareerGate.

It generates:

- Current profile assessment
- Important skill gaps
- Prioritized learning path
- Matching opportunities
- Match scores
- Missing skills for each opportunity
- Industry-demand insights

### AI Job Matching

CareerGate compares student skills with opportunity requirements to identify relevant opportunities and highlight missing skills.

### Career Scorecard

The Career Scorecard evaluates a student's profile against their stated career goal and provides:

- Career readiness score
- Explanation of the score
- Missing skills
- Recommended number of projects
- Personalized project ideas
- Recommended courses and certifications
- Relevant programming/query languages
- Three-phase career roadmap

### AI Report Caching

Generated AI reports are cached for 24 hours to reduce unnecessary model calls. Students can also force a fresh analysis when required.
## 🔐 Authentication & Security

CareerGate includes role-based authentication for students and industry users.

- Passwords are hashed before storage.
- Sessions use signed JWTs stored in an `httpOnly` cookie.
- Role-based access controls protect student and industry routes.
- User-provided OpenRouter API keys are encrypted using **AES-256-GCM** before being stored.
- Decrypted API keys are used in memory when making AI requests rather than being written to project files.

> **Security note:** Never commit `.env` or `.env.local` files, API keys, database tokens, JWT secrets, or encryption keys to GitHub.

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────┐
│                CareerGate UI                │
│       Next.js + React + Tailwind CSS        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│            Next.js API Routes               │
│ Auth │ Jobs │ Applications │ Skills │       │
│ Profile │ Scorecard │ User API Keys         │
└───────────────┬─────────────────┬───────────┘
                │                 │
                ▼                 ▼
┌──────────────────────┐   ┌──────────────────┐
│ Prisma + Turso       │   │ OpenRouter       │
│ SQLite / LibSQL      │   │ LLM API          │
│                      │   │                  │
│ Users                │   │ Skill Analysis   │
│ Students             │   │ Scorecard        │
│ Industries           │   │ Job Matching     │
│ Jobs                 │   │ Career Guidance  │
│ Applications         │   │                  │
│ AI Reports           │   └──────────────────┘
└──────────────────────┘
```

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | Turso / SQLite (LibSQL) |
| ORM | Prisma |
| AI | OpenRouter-compatible LLMs |
| Authentication | JWT + `jose` |
| Password Security | bcrypt / bcryptjs |
| API Key Encryption | AES-256-GCM |
| UI & Icons | Lucide React |
| Animation | Framer Motion |
| Email | Nodemailer |
| Deployment | Netlify |

## 🗄️ Data Model

CareerGate uses Prisma with a SQLite-compatible Turso database.

Core entities include:

- `User` — authentication and role information
- `Student` — student profile, academic information, skills, and career goals
- `Industry` — company/industry profile information
- `Job` — internship and placement opportunities
- `Application` — student applications and application status
- `SkillGapReport` — cached AI skill-gap analysis
- `ScorecardReport` — cached AI career scorecard
- `UserApiKey` — encrypted user-provided OpenRouter API credentials

The relationships between these entities connect students with their applications, industry users with their opportunities, and students with their AI-generated career reports.

## 🔄 Example Student Workflow

```text
Register
   ↓
Complete Profile
   ↓
Add Skills + Career Goals / Resume
   ↓
Browse Opportunities
   ↓
Run AI Skill Analysis
   ↓
Identify Skill Gaps
   ↓
Follow Learning Path
   ↓
Generate Career Scorecard
   ↓
Apply for Opportunities
   ↓
Track Application Status
```

## 🔄 Example Industry Workflow

```text
Register as Industry
        ↓
Create Company Profile
        ↓
Post Internship / Placement
        ↓
Define Required Skills
        ↓
Receive Applications
        ↓
Review Students
        ↓
Accept / Reject Applications
```

## 📁 Project Structure

```text
CareerGate/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── careergate.svg
│   └── ...
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── applications/
│   │   │   ├── auth/
│   │   │   ├── jobs/
│   │   │   ├── scorecard/
│   │   │   ├── skills/
│   │   │   ├── student/
│   │   │   └── user/
│   │   ├── auth/
│   │   └── dashboard/
│   │       ├── student/
│   │       └── industry/
│   ├── components/
│   └── lib/
│       ├── auth.ts
│       ├── encryption.ts
│       ├── prisma.ts
│       └── ...
├── .env.local
├── package.json
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Turso database
- An OpenRouter API key

### 1. Clone the repository

```bash
git clone https://github.com/Vishal-Nath-18/CareerGate.git
cd CareerGate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file and configure the values required by the application, including:

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
OPENROUTER_API_KEY=
JWT_SECRET=
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=
```

Use your own secure values. Do **not** commit this file to GitHub.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 6. Build for production

```bash
npm run build
```

## 🌐 Live Demo

**CareerGate:** https://careergatewell.netlify.app/

## 🏆 Hackathon

Built for **Smart India Hackathon 2026 (SIH 2026)**.

CareerGate focuses on using AI to connect student capabilities, career goals, and real opportunity requirements into a single actionable career workflow.

## 👨‍💻 Developer

**Bishal Nath**

Computer Science & Engineering Student | AI/ML

GitHub: [@Vishal-Nath-18](https://github.com/Vishal-Nath-18)

---

If you find the project useful, consider giving the repository a ⭐.
