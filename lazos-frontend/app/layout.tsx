import "./globals.css";
import FooterNav from "./components/FooterNav";
import { AuthProvider } from "./providers/AuthProvider";
import { WagmiWrapper } from "./providers/WagmiWrapper";

export const metadata = {
  title: "NUDOS",
  description: "Frontend de la dapp NUDOS sobre Base Sepolia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <WagmiWrapper>
          <AuthProvider>
            <div className="app-frame">
              {children}
              <FooterNav />
            </div>
          </AuthProvider>
        </WagmiWrapper>
      </body>
    </html>
  );
}
