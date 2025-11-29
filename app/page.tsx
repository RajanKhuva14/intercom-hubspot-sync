export default function Home() {
  const handleAuthorize = () => {
    const clientId = process.env.NEXT_PUBLIC_INTERCOM_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_REDIRECT_URI
    );
    const scopes = "read_users,write_users,read_companies,write_companies";

    const authUrl = `${process.env.NEXT_PUBLIC_INTERCOM_AUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;

    window.location.href = authUrl;
  };

  return (
    <div style={styles.container}>
      <h1>🔄 Intercom → HubSpot Sync</h1>
      <p>Synchronize your Intercom contacts and companies to HubSpot</p>
      <button onClick={handleAuthorize} style={styles.button}>
        🔐 Authorize with Intercom
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    backgroundColor: "#1f8feb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
