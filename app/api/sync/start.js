import SyncService from '../../../lib/sync-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { intercomToken, hubspotApiKey } = req.body;

    if (!intercomToken || !hubspotApiKey) {
      return res.status(400).json({
        success: false,
        message: 'Missing intercomToken or hubspotApiKey',
      });
    }

    // Initialize sync service
    const syncService = new SyncService(intercomToken, hubspotApiKey);

    // Execute sync
    const result = await syncService.syncAll();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Sync failed',
      error: error.message,
    });
  }
}