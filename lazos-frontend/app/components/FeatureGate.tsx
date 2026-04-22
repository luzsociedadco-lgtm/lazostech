"use client";

import type { AccessModule } from "@/app/lib/types";

const copyByModule: Record<AccessModule, { title: string; body: string }> = {
  perfil: {
    title: "Perfil activo",
    body: "Tu perfil es el centro del onboarding y siempre esta disponible."
  },
  tickets: {
    title: "Tickets bloqueados",
    body: "Completa tu perfil o valida tu identidad universitaria para habilitar tickets."
  },
  reciclaje: {
    title: "Reciclaje bloqueado",
    body: "Vincula tu wallet blockchain al perfil para habilitar reciclaje."
  },
  marketplace: {
    title: "Marketplace bloqueado",
    body: "Vincula tu wallet blockchain al perfil para habilitar marketplace."
  },
  dao: {
    title: "DAO bloqueado",
    body: "Vincula tu wallet blockchain al perfil para habilitar el modulo DAO."
  }
};

export function FeatureGate({
  module,
  children
}: {
  module: AccessModule;
  children: React.ReactNode;
}) {
  // Bloqueo progresivo pausado temporalmente para revisar el frontend completo.
  // const { user } = useAuth();
  // if (!user?.access[module]) {
  //   const copy = copyByModule[module];
  //   return (
  //     <div className="feature-lock-card">
  //       <strong>{copy.title}</strong>
  //       <p>{copy.body}</p>
  //     </div>
  //   );
  // }

  void module;
  void copyByModule;

  return <>{children}</>;
}
