import axios from 'axios';

class IntercomClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = process.env.INTERCOM_API_BASE;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all users (contacts) with pagination
   */
  async getUsers(cursor = null) {
    try {
      const params = {
        per_page: 50,
      };

      if (cursor) {
        params.starting_after = cursor;
      }

      const response = await this.client.get('/users', { params });

      return {
        data: response.data.data || [],
        pagination: {
          nextCursor: response.data.paging?.next?.cursor || null,
          hasMore: !!response.data.paging?.next,
        },
      };
    } catch (error) {
      console.error('Error fetching Intercom users:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all companies with pagination
   */
  async getCompanies(cursor = null) {
    try {
      const params = {
        per_page: 50,
      };

      if (cursor) {
        params.starting_after = cursor;
      }

      const response = await this.client.get('/companies', { params });

      return {
        data: response.data.data || [],
        pagination: {
          nextCursor: response.data.paging?.next?.cursor || null,
          hasMore: !!response.data.paging?.next,
        },
      };
    } catch (error) {
      console.error('Error fetching Intercom companies:', error.message);
      throw error;
    }
  }

  /**
   * Get users associated with a company
   */
  async getCompanyUsers(companyId) {
    try {
      const response = await this.client.get(`/companies/${companyId}/users`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching users for company ${companyId}:`, error.message);
      return [];
    }
  }
}

export default IntercomClient;