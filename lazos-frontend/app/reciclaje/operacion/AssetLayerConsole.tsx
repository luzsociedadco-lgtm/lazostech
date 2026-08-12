"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { assetMaterialProfiles, type AssetLayerAsset } from "@/app/lib/asset-layer/config";
import styles from "./asset-layer.module.css";

type Dashboard = {
  organization: {
    legal_name: string;
    enterprise_id: number;
    root_address: string;
    chain_id: number;
    priority_material: string;
  };
  role: string;
  assets: AssetLayerAsset[];
  events: Array<{ id: number; event_type: string; created_at: string }>;
  metrics: {
    assets: number;
    grams: number;
    verified: number;
    certified: number;
    redeemed: number;
    pendingAnchors: number;
  };
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) }
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "No se pudo completar la operación");
  return payload;
}

function nextAction(asset: AssetLayerAsset) {
  if (asset.passport_version === 0) return "passport";
  if (asset.status === "registered" || asset.status === "suspended") return "verify";
  if (asset.status === "verified" && asset.material_type.includes("RECYCLED")) return "certificate";
  if (asset.status === "verified") return "custody";
  if (asset.status === "in_custody") return "transform";
  if (asset.status === "certified") return "redeem";
  return null;
}

const actionLabels = {
  passport: "Emitir pasaporte",
  verify: "Verificar lote",
  custody: "Transferir custodia",
  transform: "Registrar transformación",
  certificate: "Emitir certificado",
  redeem: "Retirar activo"
};

export default function AssetLayerConsole() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Cargando operación empresarial…");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    assetRef: `LAZ-ALU-${new Date().getFullYear()}-001`,
    materialType: "ALUMINUM_POST_CONSUMER",
    quantityGrams: "500000",
    originGeneral: "Universidad del Valle - campus Meléndez",
    custodian: "LazosTech"
  });

  const refresh = useCallback(async () => {
    try {
      const next = await api<Dashboard>("/api/asset-layer");
      setDashboard(next);
      setError("");
      setMessage("Operación sincronizada con la capa empresarial.");
    } catch (nextError) {
      setError((nextError as Error).message);
      setMessage("");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeAssets = useMemo(
    () => dashboard?.assets.filter(asset => !["transformed", "redeemed"].includes(asset.status)) ?? [],
    [dashboard]
  );

  async function registerAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/asset-layer", { method: "POST", body: JSON.stringify(form) });
      setMessage(`Lote ${form.assetRef} registrado y encolado para Base Sepolia.`);
      await refresh();
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function bootstrapAdmin() {
    setBusy(true);
    try {
      await api("/api/asset-layer/bootstrap", { method: "POST" });
      await refresh();
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function processBlockchainQueue() {
    setBusy(true);
    try {
      const result = await api<{ processed: number }>("/api/asset-layer/relay", { method: "POST" });
      setError("");
      setMessage(`Relayer ejecutado: ${result.processed} operación(es) procesada(s).`);
      await refresh();
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function advance(asset: AssetLayerAsset) {
    const action = nextAction(asset);
    if (!action) return;
    const payload: Record<string, unknown> = { action };

    if (action === "custody") {
      const toCustodian = window.prompt("Nuevo custodio", "Reciclador aliado");
      if (!toCustodian) return;
      payload.toCustodian = toCustodian;
    }
    if (action === "transform") {
      const outputAssetRef = window.prompt(
        "Referencia del lote de salida",
        asset.material_type.startsWith("PET") ? `LAZ-RPET-${Date.now()}` : `LAZ-RALU-${Date.now()}`
      );
      if (!outputAssetRef) return;
      const outputQuantityGrams = Number(window.prompt("Gramos aprovechables", String(Math.floor(asset.quantity_grams * 0.85))));
      const rejectedQuantityGrams = asset.quantity_grams - outputQuantityGrams;
      payload.outputAssetRef = outputAssetRef;
      payload.outputQuantityGrams = outputQuantityGrams;
      payload.rejectedQuantityGrams = rejectedQuantityGrams;
    }

    setBusy(true);
    try {
      await api(`/api/asset-layer/${asset.id}/actions`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMessage(`${asset.asset_ref}: ${actionLabels[action]} completado.`);
      await refresh();
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadEvidence(asset: AssetLayerAsset, file: File) {
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("evidenceType", "WEIGHT_ORIGIN_EVIDENCE");
      const response = await fetch(`/api/asset-layer/${asset.id}/evidence`, { method: "POST", body });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar la evidencia");
      setMessage(`${asset.asset_ref}: evidencia privada registrada y hasheada.`);
      setError("");
    } catch (nextError) {
      setError((nextError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !dashboard) {
    return (
      <section className={styles.denied}>
        <span>Symmetry Asset Layer</span>
        <h1>Acceso empresarial requerido</h1>
        <p>{error}</p>
        <p>Un administrador debe asignarte como operador, verificador, auditor o visor del root de LazosTech.</p>
        <button type="button" disabled={busy} onClick={() => void bootstrapAdmin()}>
          {busy ? "Validando…" : "Activar administración autorizada"}
        </button>
        <Link href="/reciclaje">Volver a reciclaje</Link>
      </section>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>Symmetry Asset Layer · LazosTech root</span>
          <h1>Materiales circulares verificables</h1>
          <p>Aluminio primero. PET disponible sobre la misma infraestructura.</p>
        </div>
        <div className={styles.rootCard}>
          <small>Rol: {dashboard?.role ?? "…"}</small>
          <strong>Enterprise #{dashboard?.organization.enterprise_id ?? 1}</strong>
          <code>{dashboard?.organization.root_address ?? "0x6Dbf…16F7"}</code>
        </div>
      </header>

      <p className={error ? styles.error : styles.message}>{error || message}</p>

      {dashboard?.role === "admin" ? (
        <div className={styles.relayBar}>
          <span>Plan Hobby: procesamiento inmediato manual y cron diario de respaldo.</span>
          <button disabled={busy} onClick={() => void processBlockchainQueue()} type="button">
            {busy ? "Procesando…" : "Procesar Base Sepolia"}
          </button>
        </div>
      ) : null}

      <section className={styles.metrics}>
        {[
          [dashboard?.metrics.assets ?? 0, "lotes"],
          [dashboard?.metrics.grams ?? 0, "gramos"],
          [dashboard?.metrics.verified ?? 0, "verificados"],
          [dashboard?.metrics.certified ?? 0, "certificados"],
          [dashboard?.metrics.redeemed ?? 0, "retirados"],
          [dashboard?.metrics.pendingAnchors ?? 0, "anclajes pendientes"]
        ].map(([value, label]) => (
          <article key={label}>
            <strong>{Number(value).toLocaleString("es-CO")}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className={styles.grid}>
        <form className={styles.card} onSubmit={registerAsset}>
          <span>01 / Registro</span>
          <h2>Crear lote</h2>
          <label>
            Material
            <select
              value={form.materialType}
              onChange={event => {
                const materialType = event.target.value as keyof typeof assetMaterialProfiles;
                const profile = assetMaterialProfiles[materialType];
                setForm({ ...form, materialType, assetRef: `${profile.inputPrefix}${new Date().getFullYear()}-001` });
              }}
            >
              {Object.entries(assetMaterialProfiles).map(([value, profile]) => (
                <option value={value} key={value}>{profile.label}</option>
              ))}
            </select>
          </label>
          <label>Referencia<input value={form.assetRef} onChange={event => setForm({ ...form, assetRef: event.target.value })} /></label>
          <label>Peso en gramos<input type="number" min="1" value={form.quantityGrams} onChange={event => setForm({ ...form, quantityGrams: event.target.value })} /></label>
          <label>Origen general<input value={form.originGeneral} onChange={event => setForm({ ...form, originGeneral: event.target.value })} /></label>
          <label>Custodio inicial<input value={form.custodian} onChange={event => setForm({ ...form, custodian: event.target.value })} /></label>
          <button disabled={busy} type="submit">{busy ? "Procesando…" : "Registrar lote"}</button>
        </form>

        <section className={`${styles.card} ${styles.lifecycle}`}>
          <div className={styles.cardTitle}>
            <div><span>02 / Ciclo de vida</span><h2>Operación por etapas</h2></div>
            <b>{activeAssets.length} activos</b>
          </div>
          <div className={styles.assetList}>
            {dashboard?.assets.length ? dashboard.assets.map(asset => {
              const action = nextAction(asset);
              return (
                <article key={asset.id} className={styles.assetRow}>
                  <div>
                    <Link href={`/reciclaje/lotes/${encodeURIComponent(asset.asset_ref)}`}>{asset.asset_ref}</Link>
                    <span>{asset.material_type} · {Number(asset.quantity_grams).toLocaleString("es-CO")} g</span>
                  </div>
                  <div>
                    <b data-status={asset.status}>{asset.status.replace(/_/g, " ")}</b>
                    <small>{asset.anchor_status === "confirmed" ? "on-chain" : "anclaje pendiente"}</small>
                    <label className={styles.evidenceButton}>
                      Adjuntar evidencia
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,text/csv,application/json"
                        disabled={busy}
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) void uploadEvidence(asset, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {action ? <button type="button" disabled={busy} onClick={() => void advance(asset)}>{actionLabels[action]}</button> : null}
                  </div>
                </article>
              );
            }) : <p>No hay lotes registrados todavía.</p>}
          </div>
        </section>
      </section>

      <section className={`${styles.card} ${styles.audit}`}>
        <span>03 / Auditoría</span>
        <h2>Eventos recientes</h2>
        <div>
          {dashboard?.events.length ? dashboard.events.map(event => (
            <p key={event.id}><strong>{event.event_type.replace(/_/g, " ")}</strong><time>{new Date(event.created_at).toLocaleString("es-CO")}</time></p>
          )) : <p>Los eventos aparecerán cuando inicie la operación.</p>}
        </div>
      </section>
    </main>
  );
}
