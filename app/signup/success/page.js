export default function SignupSuccess() {
  return (
    <div
      style={{
        display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif", background: "#EFEBE0",
      }}
    >
      <div style={{ background: "#fff", padding: 32, borderRadius: 8, width: 420, border: "1px solid #D9D3C2", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Payment received</h1>
        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.5 }}>
          We're setting up your cooperative now. Check your email in the next couple of minutes
          for your sign-in link and invite code.
        </p>
        <p style={{ fontSize: 13, color: "#8A8372" }}>
          Didn't get anything after a few minutes? Check spam, or reach out and we'll sort it out.
        </p>
      </div>
    </div>
  );
}
