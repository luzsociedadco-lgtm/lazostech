import "./globals.css";
import AppAuthGate from "./components/AppAuthGate";
import FooterNav from "./components/FooterNav";
import { AuthProvider } from "./providers/AuthProvider";
import { ClientProviders } from "./providers/ClientProviders";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "LazosTech",
  description: "Frontend de la dapp LazosTech sobre Base Sepolia",
  icons: {
    icon: "/favicon-lazostech.png",
    shortcut: "/favicon-lazostech.png",
    apple: "/favicon-lazostech.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>
          <AuthProvider>
            <div className="app-frame">
              <AppAuthGate>
                {children}
                <FooterNav />
              </AppAuthGate>
            </div>
          </AuthProvider>
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
