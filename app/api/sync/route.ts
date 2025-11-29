// app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllIntercomCompanies,
  fetchAllIntercomUsers,
} from "../../lib/intercom";
import {
  upsertHubspotCompanyFromIntercomCompany,
  upsertHubspotContactFromIntercomUser,
  associateContactToCompany,
} from "../../lib/hubspot";
import { log } from "../../lib/logger";

export async function POST(req: NextRequest) {
  try {
    // 1) Fetch & upsert Companies
    const intercomCompanies = await fetchAllIntercomCompanies();
    const companyIdMap = new Map<string, string>(); // IntercomId -> HubSpotId

    for (const company of intercomCompanies) {
      const hubCompany = await upsertHubspotCompanyFromIntercomCompany(company);
      companyIdMap.set(company.id, hubCompany.id);
    }

    // 2) Fetch & upsert Users
    const intercomUsers = await fetchAllIntercomUsers();
    const createdContacts: any[] = [];
    const createdCompanies: any[] = [];
    const createdAssociations: any[] = [];

    for (const user of intercomUsers) {
      const hubContact = await upsertHubspotContactFromIntercomUser(user);
      createdContacts.push(hubContact);

      // 3) Associate contact ↔ company using Intercom user → companies linkage
      const companies = user.companies || [];
      for (const c of companies) {
        const hubCompanyId = companyIdMap.get(c.id);
        if (!hubCompanyId) {
          log(`No HubSpot company mapping for Intercom company ${c.id}`);
          continue;
        }
        await associateContactToCompany(hubContact.id, hubCompanyId);
        createdAssociations.push({
          contactId: hubContact.id,
          companyId: hubCompanyId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        intercomCompanies: intercomCompanies.length,
        intercomUsers: intercomUsers.length,
        hubspotContactsUpserted: createdContacts.length,
        hubspotCompaniesUpserted: companyIdMap.size,
        associationsCreated: createdAssociations.length,
      },
      sample: {
        contact: createdContacts[0] || null,
        company: companyIdMap.size > 0 ? [...companyIdMap.entries()][0] : null,
        association: createdAssociations[0] || null,
      },
    });
  } catch (e: any) {
    log("SYNC FAILED", e.message);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
