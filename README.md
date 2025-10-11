# AutoThreat

A comprehensive security platform for managing software vulnerabilities and SBOMs (Software Bill of Materials).

## Features

- 🔐 **Authentication**: Auth0 integration for secure user management
- 📊 **Dashboard**: Overview of projects and vulnerabilities
- 🏷️ **Token Management**: API token generation and management
- 📦 **SBOM Management**: Upload and analyze Software Bill of Materials
- ☁️ **Cloud Storage**: AWS S3 integration for SBOM storage
- 🎯 **GitHub Actions**: Automated security scanning workflows

## Getting Started

### Prerequisites

- Node.js 24+
- MongoDB database
- AWS account (for S3 storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshsoni-harsh/autothreat.git
   cd autothreat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Configure the following environment variables:
   ```env
   # Database
   DATABASE_URL="your-mongodb-connection-string"

   # Auth0
   AUTH0_SECRET="your-auth0-secret"
   AUTH0_DOMAIN="your-auth0-domain"
   AUTH0_CLIENT_ID="your-auth0-client-id"
   AUTH0_CLIENT_SECRET="your-auth0-client-secret"

   # AWS S3 (Optional - for SBOM storage)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="autothreat-sboms"
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **AWS S3 Setup** (Optional)
   - Follow the setup guide in `AWS_S3_SETUP.md`
   - Test the configuration: `node scripts/test-s3.js`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (authenticated)/   # Protected pages
│   └── (auth)/           # Authentication pages
├── components/            # Reusable UI components
├── lib/                  # Utility libraries
├── prisma/               # Database schema
└── scripts/              # Utility scripts
```

## API Documentation

### Authentication
All API routes use Bearer token authentication:
```
Authorization: Bearer your-api-token
```

### Endpoints

- `GET /api/tokens` - List user tokens
- `POST /api/tokens` - Create new token
- `DELETE /api/tokens/:id` - Delete token
- `POST /api/sbom/sync` - Sync SBOM data

## GitHub Actions

The project includes a GitHub Action for automated security scanning:

```yaml
- uses: harshsoni-harsh/autothreat-action@main
  with:
    path: '.'
    api-key: ${{ secrets.AUTO_THREAT_API_KEY }}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request
