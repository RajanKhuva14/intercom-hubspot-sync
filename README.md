# Intercom → HubSpot Integration

A Next.js application that synchronizes Intercom contacts and companies to HubSpot with associations.

## Features

✅ OAuth 2.0 authentication with Intercom  
✅ Fetch paginated Intercom contacts & companies  
✅ Upsert into HubSpot (create/update)  
✅ Create Contact ↔ Company associations  
✅ Idempotency via Intercom ID storage  
✅ Comprehensive logging & error handling  

## Setup Instructions

### 1. Prerequisites

- Node.js 16+
- Intercom workspace
- HubSpot account

### 2. Intercom Setup

```bash
# Create Intercom Developer App
1. Go to https://app.intercom.com/developers
2. Create New App
3. Set OAuth Redirect URI: http://localhost:3000/api/auth/callback
4. Copy Client ID & Client Secret
5. Select Scopes:
   - read_users
   - write_users
   - read_companies
   - write_companies
```

### 3. HubSpot Setup

```bash
# Create Private App
1. Go to https://app.hubspot.com/
2. Settings → Integrations → Private Apps
3. Create App
4. Set Scopes:
   - crm.objects.contacts.read
   - crm.objects.contacts.write
   - crm.objects.companies.read
   - crm.objects.companies.write
   - crm.objects.contacts.manage
5. Copy Private App Access Token
```

### 4. Environment Configuration

```bash
# .env.local
INTERCOM_CLIENT_ID=your_client_id
INTERCOM_CLIENT_SECRET=your_client_secret
INTERCOM_AUTH_URL=https://app.intercom.com/oauth
INTERCOM_TOKEN_URL=https://api.intercom.io/auth/eagle/token
INTERCOM_API_BASE=https://api.intercom.io

HUBSPOT_API_KEY=your_hubspot_private_app_key
HUBSPOT_API_BASE=https://api.hubapi.com

NEXTAUTH_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3000/api/auth/callback
```

### 5. Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit: http://localhost:3000

### 6. Usage

1. Click **"Authorize with Intercom"**
2. Grant permissions
3. Redirected to dashboard
4. Click **"Start Sync"**
5. Monitor logs and results

## Sync Flow

1. **OAuth Authorization** - Get access token from Intercom
2. **Fetch Companies** - Paginate through all Intercom companies
3. **Upsert Companies** - Create/update in HubSpot
4. **Fetch Contacts** - Paginate through all Intercom users
5. **Upsert Contacts** - Create/update in HubSpot
6. **Create Associations** - Link contacts to their companies
7. **Log Results** - Display comprehensive sync log

## API Endpoints

- `GET /api/status` - Health check
- `POST /api/sync/start` - Start sync process
- `GET /api/auth/callback` - OAuth callback handler

## File Mapping

- Intercom Users → HubSpot Contacts
- Intercom Companies → HubSpot Companies
- Intercom User.companies[0] → Contact-Company Association

## Idempotency

Intercom IDs are stored in custom HubSpot properties:
- Contact: `intercom_contact_id`
- Company: `intercom_company_id`

This ensures upserts don't create duplicates.

## Example Output

```json
{
  "success": true,
  "summary": {
    "companiesSynced": 5,
    "contactsSynced": 23,
    "log": [
      {
        "timestamp": "2024-01-15T10:30:45.123Z",
        "message": "Starting full sync: Intercom → HubSpot"
      },
      ...
    ]
  }
}
```

## Troubleshooting

**OAuth token not received:**
- Check redirect URI matches exactly
- Verify client ID & secret are correct

**Upsert failures:**
- Ensure HubSpot custom properties exist
- Check API key has correct scopes

**Association errors:**
- Verify both contact and company were created
- Check HubSpot API limits

## Time Estimate

⏱️ **1-2 hours** with AI assistance (Claude, ChatGPT)

## Support

For Intercom API docs: https://developers.intercom.com/
For HubSpot API docs: https://developers.hubspot.com/