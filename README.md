# Intercom → HubSpot Sync (Next.js)

This project implements the coding assignment:

- Authenticate via OAuth to **Intercom**
- Fetch **Contacts (Users)** and **Companies** from Intercom (with pagination)
- Upsert them into **HubSpot** Contacts and Companies
- Create **Contact ↔ Company** associations in HubSpot using the Intercom user → company link

## Tech

- Next.js (App Router, TypeScript)
- Node.js runtime (serverless API routes)
- Intercom REST API
- HubSpot CRM v3 objects + associations API

## Setup

1. Clone and install:

```bash
npm install
