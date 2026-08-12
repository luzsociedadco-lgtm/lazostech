import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import { LAZOSTECH_ASSET_ORGANIZATION_ID } from "@/app/lib/asset-layer/config";

export const dynamic = "force-dynamic";

export default async function PublicAssetPassportPage({ params }: { params: Promise<{ assetRef: string }> }) {
  const { assetRef } = await params;
  const supabase = await createClient();
  const { data: passport } = await supabase
    .from("asset_layer_public_passports")
    .select("asset_ref, organization_name, enterprise_id, root_address, chain_id, material_type, quantity_grams, origin_general, status, passport_version, passport_digest, certificate_digest, chain_asset_id, chain_tx_hash, updated_at")
    .eq("asset_ref", decodeURIComponent(assetRef).toUpperCase())
    .eq("organization_id", LAZOSTECH_ASSET_ORGANIZATION_ID)
    .maybeSingle();

  if (!passport) notFound();
  const explorerBase = passport.chain_id === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org";

  return (
    <main style={{ minHeight: "100vh", background: "#f2f0e8", color: "#10231a", padding: "clamp(24px, 6vw, 80px)" }}>
      <section style={{ maxWidth: 860, margin: "0 auto", background: "white", borderRadius: 30, padding: "clamp(24px, 5vw, 54px)", boxShadow: "0 25px 80px rgba(16,35,26,.1)" }}>
        <span style={{ color: "#26724a", fontWeight: 850, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 12 }}>Pasaporte digital verificable</span>
        <h1 style={{ fontSize: "clamp(38px, 7vw, 72px)", lineHeight: .95, letterSpacing: "-.05em", margin: "18px 0" }}>{passport.asset_ref}</h1>
        <p style={{ fontSize: 18, color: "#526259" }}>{passport.organization_name} · Enterprise #{passport.enterprise_id}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, margin: "30px 0" }}>
          {[
            ["Material", passport.material_type],
            ["Cantidad", `${Number(passport.quantity_grams).toLocaleString("es-CO")} g`],
            ["Estado", passport.status],
            ["Origen general", passport.origin_general],
            ["Pasaporte", `versión ${passport.passport_version}`],
            ["Anclaje", passport.chain_asset_id ? `activo #${passport.chain_asset_id}` : "pendiente"]
          ].map(([label, value]) => <article key={label} style={{ border: "1px solid #dfe3dc", borderRadius: 16, padding: 16 }}><small style={{ color: "#718077" }}>{label}</small><strong style={{ display: "block", marginTop: 6, overflowWrap: "anywhere" }}>{value}</strong></article>)}
        </div>
        <div style={{ background: "#10231a", color: "white", borderRadius: 20, padding: 20, display: "grid", gap: 8 }}>
          <small>Root empresarial</small><code style={{ color: "#91d8a9", overflowWrap: "anywhere" }}>{passport.root_address}</code>
          {passport.chain_tx_hash ? <a href={`${explorerBase}/tx/${passport.chain_tx_hash}`} target="_blank" rel="noreferrer" style={{ color: "#e7e938", fontWeight: 800 }}>Ver transacción en BaseScan</a> : <span style={{ color: "#c5cec8" }}>La operación está registrada y pendiente de anclaje blockchain.</span>}
        </div>
        <p style={{ marginTop: 24, color: "#68766e" }}>Este pasaporte documenta trazabilidad y evidencia. No representa por sí mismo propiedad legal, inversión ni título valor.</p>
        <Link href="/reciclaje" style={{ display: "inline-block", marginTop: 12, color: "#26724a", fontWeight: 800 }}>Volver a LazosTech</Link>
      </section>
    </main>
  );
}
