# Linear AI Issue Creator

This application allows users to upload images to automatically create Linear issues using Google AI. It analyzes the uploaded images and creates structured Linear issues with titles, descriptions, priorities, and tags.

## Features

- **Linear OAuth Integration**: Securely authenticate with your Linear account
- **Image Upload**: Upload screenshots, diagrams, wireframes, or any visual content
- **AI-Powered Analysis**: Uses Google Generative AI to analyze images
- **Automatic Issue Creation**: Creates structured Linear issues based on image analysis
- **Team Selection**: Choose which Linear team to create issues for
- **No Database Required**: Works without any persistent storage

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Linear account with admin access to create OAuth applications
- A Google AI API key

### Configuration

1. **Linear OAuth Setup**:
   - Go to your Linear workspace settings
   - Navigate to "API" → "OAuth applications"
   - Create a new OAuth application
   - Set the redirect URI to: `http://localhost:3000/api/auth/callback/linear-oauth`
   - Copy the Client ID and Client Secret

2. **Google AI Setup**:
   - Go to the [Google AI Studio](https://makersuite.google.com/)
   - Get your API key from the settings page

3. **Environment Variables**:
   Copy the sample `.env.local` file and fill in your credentials:
   ```
   # Linear OAuth Configuration
   LINEAR_CLIENT_ID=your-linear-client-id
   LINEAR_CLIENT_SECRET=your-linear-client-secret
   NEXT_PUBLIC_LINEAR_CLIENT_ID=your-linear-client-id

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000 # only used for development, if you are running on Vercel, you can leave it blank, if you are running on another platform, you can use the platform's URL or hardcode it here

   NEXTAUTH_SECRET=generate-a-random-string-here

   # Google AI Configuration  
   GOOGLE_API_KEY=your-google-ai-api-key
   ```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Sign in with your Linear account
2. Select a team from the dropdown
3. Upload an image (screenshot, diagram, wireframe, etc.)
4. Click "Analyze & Create Issue"
5. View the created issue and AI analysis

## Technologies Used

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Linear SDK
- Google AI SDK

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
