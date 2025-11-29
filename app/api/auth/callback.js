import axios from 'axios';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      message: `Authorization failed: ${error}`,
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code not provided',
    });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      process.env.INTERCOM_TOKEN_URL,
      {
        client_id: process.env.INTERCOM_CLIENT_ID,
        client_secret: process.env.INTERCOM_CLIENT_SECRET,
        code: code,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Failed to obtain access token',
      });
    }

    // Store token in session/cookie (secure way)
    res.setHeader(
      'Set-Cookie',
      `intercom_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );

    // Redirect to dashboard or sync page
    return res.redirect('/dashboard?success=true&token=' + accessToken);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Token exchange failed',
      error: error.message,
    });
  }
}