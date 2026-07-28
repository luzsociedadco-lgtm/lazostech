import type { Metadata } from "next";

import WeLanding from "./WeLanding";

export const metadata: Metadata = {
  title: "LazosTech | Reciclaje, comunidad y blockchain",
  description:
    "Convertimos el reciclaje en oportunidades mediante blockchain desde la comunidad universitaria."
};

export default function WePage() {
  return <WeLanding />;
}
