// app/page.tsx
"use client";

import { useState } from "react";

export default function HomePage() {
  const [log, setLog] = useState<string>("");

  const connectIntercom = () => {
    const clientId = process.env.NEXT_PUBLIC_INTERCOM_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_INTERCOM_REDIRECT_URI;
    const authUrl = new URL("https://app.intercom.com/oauth");
    authUrl.searchParams.set("client_id", clientId || "");
    authUrl.searchParams.set("redirect_uri", redirectUri || "");
    authUrl.searchParams.set("state", "intercom-oauth");
    window.location.href = authUrl.toString();
  };

  const connectHubspot = () => {
    const clientId = process.env.NEXT_PUBLIC_HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_HUBSPOT_REDIRECT_URI;
    const scopes = [
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
      "crm.objects.companies.read",
      "crm.objects.companies.write",
      "crm.objects.associations.read",
      "crm.objects.associations.write",
    ].join(" ");
    const authUrl = new URL("https://app.hubspot.com/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId || "");
    authUrl.searchParams.set("redirect_uri", redirectUri || "");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", "hubspot-oauth");
    window.location.href = authUrl.toString();
  };

  const runSync = async () => {
    setLog("Running sync...");
    const resp = await fetch("/api/sync", { method: "POST" });
    const json = await resp.json();
    setLog(JSON.stringify(json, null, 2));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-8 gap-6">
      <h1 className="text-3xl font-bold">Intercom → HubSpot Sync</h1>
      <p className="text-gray-600 max-w-xl text-center">
        This tool authenticates with Intercom via OAuth, fetches Contacts & Companies,
        upserts them into HubSpot, and creates Contact ↔ Company associations.
      </p>

      <div className="flex gap-4">
        <button
          onClick={connectIntercom}
          className="px-4 py-2 rounded-lg border font-semibold"
        >
          Connect Intercom
        </button>
        <button
          onClick={connectHubspot}
          className="px-4 py-2 rounded-lg border font-semibold"
        >
          Connect HubSpot
        </button>
      </div>

      <button
        onClick={runSync}
        className="px-6 py-3 rounded-lg bg-black text-white font-semibold"
      >
        Run Sync
      </button>

      <pre className="mt-4 w-full max-w-3xl border rounded-lg p-4 text-sm overflow-auto">
        {log || "Click 'Run Sync' to see logs here."}
      </pre>
    </main>
  );
}
