import IntercomClient from './intercom';
import HubSpotClient from './hubspot';

class SyncService {
  constructor(intercomToken, hubspotApiKey) {
    this.intercom = new IntercomClient(intercomToken);
    this.hubspot = new HubSpotClient(hubspotApiKey);
    this.syncLog = [];
  }

  log(message, data = null) {
    const logEntry = { timestamp: new Date().toISOString(), message, data };
    this.syncLog.push(logEntry);
    console.log(`[SYNC] ${message}`, data || '');
  }

  /**
   * Main sync orchestration
   */
  async syncAll() {
    try {
      this.log('Starting full sync: Intercom → HubSpot');

      // Step 1: Fetch and sync companies
      const companiesMap = await this.syncCompanies();
      this.log(`Synced companies`, { count: companiesMap.size });

      // Step 2: Fetch and sync contacts
      const contactsMap = await this.syncContacts(companiesMap);
      this.log(`Synced contacts`, { count: contactsMap.size });

      // Step 3: Create associations
      await this.createAssociations(contactsMap, companiesMap);
      this.log('Created contact-company associations');

      this.log('Sync completed successfully');
      return {
        success: true,
        summary: {
          companiesSynced: companiesMap.size,
          contactsSynced: contactsMap.size,
          log: this.syncLog,
        },
      };
    } catch (error) {
      this.log('Sync failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        log: this.syncLog,
      };
    }
  }

  /**
   * Sync all companies from Intercom to HubSpot
   */
  async syncCompanies() {
    const companiesMap = new Map(); // intercomId → hsCompanyId
    let cursor = null;
    let pageCount = 0;

    try {
      while (true) {
        this.log(`Fetching companies page ${pageCount + 1}...`);

        const result = await this.intercom.getCompanies(cursor);
        const companies = result.data;

        if (companies.length === 0) {
          this.log('No more companies to fetch');
          break;
        }

        for (const company of companies) {
          try {
            const hsCompanyId = await this.hubspot.upsertCompany({
              name: company.name,
              website: company.website,
              intercomId: company.id,
              customProperties: {
                intercom_company_id: company.id,
                company_id: company.company_id,
              },
            });

            companiesMap.set(company.id, hsCompanyId);
            this.log(`Upserted company: ${company.name} (Intercom: ${company.id})`);
          } catch (error) {
            this.log(`Failed to upsert company ${company.id}`, { error: error.message });
          }
        }

        pageCount++;

        if (!result.pagination.hasMore) {
          break;
        }

        cursor = result.pagination.nextCursor;
      }
    } catch (error) {
      this.log('Error syncing companies', { error: error.message });
      throw error;
    }

    return companiesMap;
  }

  /**
   * Sync all contacts from Intercom to HubSpot
   */
  async syncContacts(companiesMap) {
    const contactsMap = new Map(); // email → { hsContactId, intercomId, companyId }
    let cursor = null;
    let pageCount = 0;

    try {
      while (true) {
        this.log(`Fetching contacts page ${pageCount + 1}...`);

        const result = await this.intercom.getUsers(cursor);
        const users = result.data;

        if (users.length === 0) {
          this.log('No more contacts to fetch');
          break;
        }

        for (const user of users) {
          try {
            const email = user.email || `${user.id}@intercom.local`;
            const companyId = user.companies?.data?.[0]?.id || null;

            const hsContactId = await this.hubspot.upsertContact({
              email: email,
              firstName: user.name?.split(' ')[0] || 'N/A',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              phone: user.phone || '',
              intercomId: user.id,
            });

            contactsMap.set(email, {
              hsContactId,
              intercomId: user.id,
              companyId,
            });

            this.log(`Upserted contact: ${email} (Intercom: ${user.id})`);
          } catch (error) {
            this.log(`Failed to upsert contact ${user.id}`, { error: error.message });
          }
        }

        pageCount++;

        if (!result.pagination.hasMore) {
          break;
        }

        cursor = result.pagination.nextCursor;
      }
    } catch (error) {
      this.log('Error syncing contacts', { error: error.message });
      throw error;
    }

    return contactsMap;
  }

  /**
   * Create associations between contacts and companies
   */
  async createAssociations(contactsMap, companiesMap) {
    let associationCount = 0;

    try {
      for (const [email, contactData] of contactsMap.entries()) {
        const { hsContactId, companyId } = contactData;

        if (!companyId || !companiesMap.has(companyId)) {
          continue; // Skip if no company association
        }

        const hsCompanyId = companiesMap.get(companyId);

        try {
          await this.hubspot.associateContactToCompany(hsContactId, hsCompanyId);
          associationCount++;
          this.log(`Associated contact ${email} → company ${companyId}`);
        } catch (error) {
          this.log(`Failed to associate contact ${email}`, { error: error.message });
        }
      }

      this.log(`Created ${associationCount} associations`);
    } catch (error) {
      this.log('Error creating associations', { error: error.message });
      throw error;
    }
  }

  getSyncLog() {
    return this.syncLog;
  }
}

export default SyncService;