import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [token, setToken] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const handleStartSync = async () => {
    if (!token) {
      alert('Please authorize first');
      return;
    }

    setSyncing(true);
    setSyncLog([]);
    setResult(null);

    try {
      const response = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intercomToken: token,
          hubspotApiKey: process.env.NEXT_PUBLIC_HUBSPOT_API_KEY,
        }),
      });

      const data = await response.json();
      setSyncLog(data.log || []);
      setResult(data);
    } catch (error) {
      alert('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>📊 Sync Dashboard</h1>

      {token ? (
        <>
          <p>✅ Authorized with Intercom</p>
          <button
            onClick={handleStartSync}
            disabled={syncing}
            style={{
              ...styles.button,
              opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? '⏳ Syncing...' : '🚀 Start Sync'}
          </button>
        </>
      ) : (
        <p>❌ Not authorized. Please go back and authorize.</p>
      )}

      {result && (
        <div style={styles.result}>
          <h2>Results:</h2>
          <pre>{JSON.stringify(result.summary, null, 2)}</pre>
        </div>
      )}

      {syncLog.length > 0 && (
        <div style={styles.log}>
          <h3>📋 Sync Log:</h3>
          <div style={styles.logContent}>
            {syncLog.map((entry, idx) => (
              <div key={idx} style={styles.logEntry}>
                <small>{entry.timestamp}</small>
                <p>{entry.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#1f8feb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  result: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#e8f4f8',
    borderRadius: '6px',
    border: '1px solid #b3d9e8',
  },
  log: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #ddd',
  },
  logContent: {
    maxHeight: '400px',
    overflowY: 'auto',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
  },
  logEntry: {
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '10px',
  },
};