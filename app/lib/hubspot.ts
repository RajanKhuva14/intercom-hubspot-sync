// lib/hubspot.ts
import qs from "qs";
import { log } from "./logger";
import type { IntercomUser, IntercomCompany } from "./intercom";

const HUBSPOT_BASE = "https://api.hubapi.com";

let hubspotAccessTokenCache: string | null = null;

export function getHubspotAccessToken(): string {
  const token = hubspotAccessTokenCache || process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("HubSpot access token not available. Complete OAuth first.");
  }
  return token;
}

export function setHubspotAccessToken(token: string) {
  hubspotAccessTokenCache = token;
}

export async function exchangeHubspotCodeForToken(code: string) {
  const body = qs.stringify({
    grant_type: "authorization_code",
    client_id: process.env.HUBSPOT_CLIENT_ID,
    client_secret: process.env.HUBSPOT_CLIENT_SECRET,
    redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
    code,
  });

  const resp = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    log("HubSpot token exchange failed", text);
    throw new Error("Failed to exchange HubSpot code for token");
  }

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error("HubSpot token response missing access_token");
  }

  setHubspotAccessToken(data.access_token);
  return data.access_token;
}

// ---- Internal helpers ----

async function hubspotRequest(path: string, options: RequestInit = {}) {
  const token = getHubspotAccessToken();
  const resp = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    log("HubSpot API error:", path, text);
    throw new Error(`HubSpot API error: ${path}`);
  }
  return resp.json();
}

// Search object by property
async function searchHubspotObject(
  objectType: "contacts" | "companies",
  propertyName: string,
  value: string
): Promise<any | null> {
  const body = {
    filterGroups: [
      {
        filters: [
          {
            propertyName,
            operator: "EQ",
            value,
          },
        ],
      },
    ],
    limit: 1,
  };

  const data = await hubspotRequest(`/crm/v3/objects/${objectType}/search`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (data?.results && data.results.length > 0) {
    return data.results[0];
  }
  return null;
}

// ---- Upsert Contact ----

export async function upsertHubspotContactFromIntercomUser(user: IntercomUser) {
  const intercomId = user.id;
  const email = user.email;
  const name = user.name || "";
  const phone = user.phone || "";

  // Try to find by intercom_id first
  let contact = await searchHubspotObject("contacts", "intercom_id", intercomId);

  // Fallback: if not found by intercom_id but we have email, look by email
  if (!contact && email) {
    contact = await searchHubspotObject("contacts", "email", email);
  }

  const properties: Record<string, any> = {
    intercom_id: intercomId,
  };
  if (email) properties.email = email;
  if (name) properties.firstname = name.split(" ")[0];
  if (name) properties.lastname = name.split(" ").slice(1).join(" ") || name;
  if (phone) properties.phone = phone;

  if (!contact) {
    // Create
    const created = await hubspotRequest("/crm/v3/objects/contacts", {
      method: "POST",
      body: JSON.stringify({ properties }),
    });
    log(`Created HubSpot contact for Intercom user ${intercomId} → ${created.id}`);
    return created;
  } else {
    // Update
    const id = contact.id;
    const updated = await hubspotRequest(`/crm/v3/objects/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    log(`Updated HubSpot contact ${id} for Intercom user ${intercomId}`);
    return updated;
  }
}

// ---- Upsert Company ----

export async function upsertHubspotCompanyFromIntercomCompany(company: IntercomCompany) {
  const intercomCompanyId = company.id;
  const name = company.name || "";
  const website = company.website || "";
  const companyIdExternal = company.company_id || "";

  // Prefer a dedicated property for Intercom company id
  let hubspotCompany = await searchHubspotObject(
    "companies",
    "intercom_company_id",
    intercomCompanyId
  );

  const properties: Record<string, any> = {
    intercom_company_id: intercomCompanyId,
  };
  if (name) properties.name = name;
  if (website) properties.website = website;
  if (companyIdExternal) properties.company_id = companyIdExternal;

  if (!hubspotCompany) {
    const created = await hubspotRequest("/crm/v3/objects/companies", {
      method: "POST",
      body: JSON.stringify({ properties }),
    });
    log(`Created HubSpot company for Intercom company ${intercomCompanyId} → ${created.id}`);
    return created;
  } else {
    const id = hubspotCompany.id;
    const updated = await hubspotRequest(`/crm/v3/objects/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    log(`Updated HubSpot company ${id} for Intercom company ${intercomCompanyId}`);
    return updated;
  }
}

// ---- Association: Contact ↔ Company ----

export async function associateContactToCompany(hubspotContactId: string, hubspotCompanyId: string) {
  // Using CRM v3 association endpoint with label `contact_to_company`
  await hubspotRequest(
    `/crm/v3/objects/contacts/${hubspotContactId}/associations/companies/${hubspotCompanyId}/contact_to_company`,
    {
      method: "PUT",
    }
  );
  log(`Associated contact ${hubspotContactId} ↔ company ${hubspotCompanyId}`);
}
