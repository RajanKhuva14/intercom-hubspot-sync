import axios from 'axios';

class HubSpotClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = process.env.HUBSPOT_API_BASE;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Upsert a contact in HubSpot
   * If contact exists (by email), update it; otherwise, create it
   */
  async upsertContact(contactData) {
    try {
      const {
        email,
        firstName,
        lastName,
        phone,
        intercomId,
      } = contactData;

      const properties = [
        { property: 'firstname', value: firstName || '' },
        { property: 'lastname', value: lastName || '' },
        { property: 'email', value: email || '' },
        { property: 'phone', value: phone || '' },
        { property: 'intercom_contact_id', value: intercomId },
      ];

      // HubSpot upsert endpoint
      const response = await this.client.post('/crm/v3/objects/contacts/batch/upsert', {
        inputs: [
          {
            idProperty: 'email',
            id: email,
            properties: properties.reduce((acc, prop) => {
              acc[prop.property] = prop.value;
              return acc;
            }, {}),
          },
        ],
      });

      return response.data.results[0]?.id;
    } catch (error) {
      console.error('Error upserting contact:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upsert a company in HubSpot
   */
  async upsertCompany(companyData) {
    try {
      const {
        name,
        website,
        intercomId,
        customProperties = {},
      } = companyData;

      const properties = {
        name: name || '',
        website: website || '',
        intercom_company_id: intercomId,
        ...customProperties,
      };

      const response = await this.client.post('/crm/v3/objects/companies/batch/upsert', {
        inputs: [
          {
            idProperty: 'intercom_company_id',
            id: intercomId,
            properties: properties,
          },
        ],
      });

      return response.data.results[0]?.id;
    } catch (error) {
      console.error('Error upserting company:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get a contact by email
   */
  async getContactByEmail(email) {
    try {
      const response = await this.client.get(`/crm/v3/objects/contacts/batch/read`, {
        data: {
          inputs: [{ idProperty: 'email', id: email }],
          properties: ['intercom_contact_id'],
        },
      });

      return response.data.results[0] || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting contact:', error.message);
      throw error;
    }
  }

  /**
   * Get a company by Intercom ID
   */
  async getCompanyByIntercomId(intercomId) {
    try {
      const response = await this.client.get(`/crm/v3/objects/companies/batch/read`, {
        data: {
          inputs: [{ idProperty: 'intercom_company_id', id: intercomId }],
        },
      });

      return response.data.results[0] || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting company:', error.message);
      throw error;
    }
  }

  /**
   * Create association between contact and company
   */
  async associateContactToCompany(contactId, companyId) {
    try {
      const response = await this.client.put(
        `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}`,
        {
          associationCategory: 'HUBSPOT_DEFINED',
          associationType: 'contact_to_company',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating association:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Batch create associations
   */
  async batchAssociateContactsToCompany(contactIds, companyId) {
    try {
      const inputs = contactIds.map((contactId) => ({
        id: contactId,
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationType: 'contact_to_company',
          },
        ],
        toObjectId: companyId,
      }));

      const response = await this.client.post(
        `/crm/v3/objects/contacts/batch/associate/companies`,
        { inputs }
      );

      return response.data;
    } catch (error) {
      console.error('Error batch associating:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default HubSpotClient;