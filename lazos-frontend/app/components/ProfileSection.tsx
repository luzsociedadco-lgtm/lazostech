'use client'

import Image from 'next/image'
import { Barcode } from 'lucide-react'

export default function ProfileSection() {
  return (
    <section className="relative bg-[#b36a00] text-white rounded-b-3xl shadow-lg flex flex-col items-center py-4 px-4">
      
      {/* Foto de perfil */}
      <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-md mb-2">
        <Image
          src="/images/user.jpg" // 🖼️ Reemplaza con el path correcto
          alt="Usuario"
          width={96}
          height={96}
          className="object-cover"
        />
      </div>

      {/* Información principal */}
      <div className="flex justify-center gap-6 mb-2">
        <div className="text-center">
          <p className="text-xl font-bold">$1255</p>
          <p className="text-xs text-white/80">TOKENS</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">15</p>
          <p className="text-xs text-white/80">$NUDOS</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">247</p>
          <p className="text-xs text-white/80">REICLA</p>
        </div>
      </div>

      {/* Código QR / código de barras */}
      <div className="bg-white text-black rounded-xl px-3 py-2 mt-1 w-11/12 flex flex-col items-center">
        <p className="font-mono text-xs break-all text-center mb-1">
          CKZPzDhol7RqewYYKshmlyxtZ6S2
        </p>
        <div className="flex justify-center items-center gap-1">
          <Barcode className="w-8 h-8 text-black" />
          <span className="text-xs font-semibold">https://lazos.go/user</span>
        </div>
      </div>

      {/* Logo flotante lateral (G) */}
      <div className="absolute top-6 right-4">
        <Image
          src="/images/logo-G.png" // 🌀 reemplaza con tu logo real
          alt="Logo G"
          width={50}
          height={50}
        />
      </div>
    </section>
  )
}
