// lib/intercom.ts
import qs from "qs";
import { log } from "./logger";

const INTERCOM_BASE = "https://api.intercom.io";

let intercomAccessTokenCache: string | null = null;

export function getIntercomAccessToken(): string {
  // Prefer runtime cache; fallback to env for local testing
  const token = intercomAccessTokenCache || process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Intercom access token not available. Complete OAuth first.");
  }
  return token;
}

export function setIntercomAccessToken(token: string) {
  intercomAccessTokenCache = token;
}

export async function exchangeIntercomCodeForToken(code: string) {
  const body = qs.stringify({
    client_id: process.env.INTERCOM_CLIENT_ID,
    client_secret: process.env.INTERCOM_CLIENT_SECRET,
    code,
    redirect_uri: process.env.INTERCOM_REDIRECT_URI,
  });

  const resp = await fetch("https://api.intercom.io/auth/eagle/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    log("Intercom token exchange failed", text);
    throw new Error("Failed to exchange Intercom code for token");
  }

  const data = await resp.json();
  if (!data.access_token) {
    throw new Error("Intercom token response missing access_token");
  }

  setIntercomAccessToken(data.access_token);
  return data.access_token;
}

// ---- Fetch Intercom Users (Contacts) with pagination ----

export interface IntercomUser {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  companies?: { id: string }[];
  [key: string]: any;
}

export async function fetchAllIntercomUsers(): Promise<IntercomUser[]> {
  const token = getIntercomAccessToken();
  const results: IntercomUser[] = [];
  let startingAfter: string | undefined = undefined;

  while (true) {
    const url = new URL(`${INTERCOM_BASE}/users`);
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      log("Intercom users fetch failed", text);
      throw new Error("Failed to fetch Intercom users");
    }

    const data = await resp.json();
    const users: IntercomUser[] = data.data || data.users || [];
    results.push(...users);

    // Pagination cursor
    const nextCursor = data.pages?.next?.starting_after || data.pages?.next?.starting_after;
    if (!nextCursor) break;
    startingAfter = nextCursor;
  }

  log(`Fetched ${results.length} Intercom users`);
  return results;
}

// ---- Fetch Intercom Companies with pagination ----

export interface IntercomCompany {
  id: string;
  name?: string;
  website?: string;
  company_id?: string;
  [key: string]: any;
}

export async function fetchAllIntercomCompanies(): Promise<IntercomCompany[]> {
  const token = getIntercomAccessToken();
  const results: IntercomCompany[] = [];
  let startingAfter: string | undefined = undefined;

  while (true) {
    const url = new URL(`${INTERCOM_BASE}/companies`);
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      log("Intercom companies fetch failed", text);
      throw new Error("Failed to fetch Intercom companies");
    }

    const data = await resp.json();
    const companies: IntercomCompany[] = data.data || data.companies || [];
    results.push(...companies);

    const nextCursor = data.pages?.next?.starting_after;
    if (!nextCursor) break;
    startingAfter = nextCursor;
  }

  log(`Fetched ${results.length} Intercom companies`);
  return results;
}
