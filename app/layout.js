export const metadata = {
  title: "Cooperative CRM",
  description: "Member ledger for cooperative societies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
