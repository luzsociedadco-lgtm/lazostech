'use client';

import NudosBalance from './NudosBalance';
import Image from 'next/image';
import { WalletConnect } from './WalletConnect';

export default function WalletDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 flex flex-col items-center justify-start py-10 px-4">
      <header className="flex flex-col items-center mb-10">
        <Image
          src="/logo.svg"
          alt="Lazos.go Logo"
          width={100}
          height={100}
          className="mb-3"
        />
        <h1 className="text-3xl font-bold text-indigo-600">Lazos.go DApp 💫</h1>
        <p className="text-gray-600 mt-2">Conecta, Recicla y Gana $NUDOS</p>
      </header>

      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <WalletConnect />
        <div className="mt-6">
          <NudosBalance />
        </div>
      </div>

      <footer className="mt-10 text-sm text-gray-500">
        Construido con ❤️ por Lazos.go
      </footer>
    </div>
  );
}
