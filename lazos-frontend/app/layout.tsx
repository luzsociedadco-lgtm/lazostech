import "./globals.css";
import AppAuthGate from "./components/AppAuthGate";
import FooterNav from "./components/FooterNav";
import { AuthProvider } from "./providers/AuthProvider";
import { WagmiWrapper } from "./providers/WagmiWrapper";
import Script from "next/script";

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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YPK16TKDZW"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-YPK16TKDZW');
          `}
        </Script>
      </head>

      <body>
        <WagmiWrapper>
          <AuthProvider>
            <div className="app-frame">
              <AppAuthGate>
                {children}
                <FooterNav />
              </AppAuthGate>
            </div>
          </AuthProvider>
        </WagmiWrapper>
      </body>
    </html>
  );
}
