export async function sendMemberEmails({ cooperativeId, subject, body, recipients, channels }) {
  const res = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cooperativeId, subject, body, recipients, channels }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}
