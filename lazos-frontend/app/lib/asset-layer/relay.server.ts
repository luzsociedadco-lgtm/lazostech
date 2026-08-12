import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  Contract,
  encodeBytes32String,
  getAddress,
  Interface,
  JsonRpcProvider,
  Wallet,
  type TransactionReceipt
} from "ethers";

const assetLayerAbi = [
  "function registerAsset(uint256 enterpriseId,string assetRef,bytes32 assetType,uint256 quantity,bytes32 unit,bytes32 originDigest,string metadataURI,address initialCustodian) returns (uint256 assetId)",
  "function issueAssetPassport(uint256 enterpriseId,uint256 assetId,string metadataURI,bytes32 metadataDigest) returns (uint256 passportId)",
  "function verifyAsset(uint256 enterpriseId,uint256 assetId,bytes32 verificationType,uint256 verifiedQuantity,bool approved,bytes32 evidenceDigest,string evidenceURI) returns (uint256 verificationId)",
  "function transferAssetCustody(uint256 enterpriseId,uint256 assetId,address toCustodian,bytes32 manifestDigest,string manifestURI) returns (uint256 custodyEventId)",
  "function recordAssetTransformation((uint256 enterpriseId,uint256 inputAssetId,string outputAssetRef,bytes32 outputAssetType,uint256 outputQuantity,uint256 rejectedQuantity,bytes32 evidenceDigest,string evidenceURI,string outputMetadataURI) params) returns (uint256 transformationId,uint256 outputAssetId)",
  "function issueAssetCertificate(uint256 enterpriseId,uint256 assetId,bytes32 certificateType,bytes32 certificateDigest,string certificateURI,string passportURI) returns (uint256 certificateId)",
  "function redeemAsset(uint256 enterpriseId,uint256 assetId,bytes32 redemptionDigest,string redemptionURI)",
  "event AssetRegistered(uint256 indexed enterpriseId,uint256 indexed assetId,string assetRef,bytes32 indexed assetType,uint256 quantity,bytes32 unit,address issuer,address custodian)",
  "event AssetTransformationRecorded(uint256 indexed enterpriseId,uint256 indexed inputAssetId,uint256 indexed outputAssetId,uint256 transformationId,uint256 inputQuantity,uint256 outputQuantity,uint256 rejectedQuantity,bytes32 evidenceDigest,address recordedBy)"
];

type OutboxJob = {
  id: string;
  organization_id: string;
  asset_id: string;
  operation: "register" | "passport" | "verify" | "custody" | "transform" | "certificate" | "redeem";
  payload: Record<string, unknown>;
  attempts: number;
};

type AssetRow = {
  id: string;
  chain_asset_id: number | null;
  anchor_status: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}`);
  return value;
}

function signerFor(operation: OutboxJob["operation"], provider: JsonRpcProvider) {
  const auditorOperation = operation === "verify" || operation === "certificate";
  const keyName = auditorOperation
    ? "ASSET_LAYER_AUDITOR_PRIVATE_KEY"
    : "ASSET_LAYER_OPERATOR_PRIVATE_KEY";
  const walletName = auditorOperation
    ? "ASSET_LAYER_AUDITOR_WALLET"
    : "ASSET_LAYER_OPERATOR_WALLET";
  const signer = new Wallet(required(keyName), provider);
  const expectedAddress = getAddress(required(walletName));
  if (signer.address !== expectedAddress) {
    throw new Error(`${keyName} no corresponde a ${walletName}`);
  }
  return signer;
}

function parsedEvent(receipt: TransactionReceipt, eventName: string) {
  const contractInterface = new Interface(assetLayerAbi);
  for (const log of receipt.logs) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed?.name === eventName) return parsed;
    } catch {}
  }
  return null;
}

export async function processAssetLayerOutbox(limit = 5) {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) throw new Error("Falta SUPABASE_SECRET_KEY");
  const rpcUrl = process.env.ASSET_LAYER_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) throw new Error("Falta ASSET_LAYER_RPC_URL");

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const provider = new JsonRpcProvider(rpcUrl);
  const { data: jobs, error: jobsError } = await supabase
    .from("asset_layer_outbox")
    .select("id, organization_id, asset_id, operation, payload, attempts")
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 20)));
  if (jobsError) throw jobsError;

  const results: Array<{ id: string; status: string; txHash?: string; error?: string }> = [];
  for (const rawJob of jobs ?? []) {
    const job = rawJob as OutboxJob;
    const { data: claimed } = await supabase
      .from("asset_layer_outbox")
      .update({ status: "processing", attempts: job.attempts + 1, last_error: null })
      .eq("id", job.id)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      const [{ data: organization }, { data: asset }] = await Promise.all([
        supabase
          .from("asset_layer_organizations")
          .select("enterprise_id, root_address")
          .eq("id", job.organization_id)
          .single(),
        supabase
          .from("asset_layer_assets")
          .select("id, chain_asset_id, anchor_status")
          .eq("id", job.asset_id)
          .single()
      ]);
      if (!organization || !asset) throw new Error("La organización o el lote ya no existe");

      const signer = signerFor(job.operation, provider);
      const contract = new Contract(getAddress(organization.root_address), assetLayerAbi, signer);
      const payload = job.payload;
      const enterpriseId = BigInt(organization.enterprise_id);
      const chainAssetId = (asset as AssetRow).chain_asset_id;
      let transaction;

      if (job.operation !== "register" && !chainAssetId) {
        throw new Error("El registro on-chain del lote aún no está confirmado");
      }

      if (job.operation === "register") {
        transaction = await contract.registerAsset(
          enterpriseId,
          String(payload.asset_ref),
          encodeBytes32String(String(payload.material_type)),
          BigInt(String(payload.quantity_grams)),
          encodeBytes32String("g"),
          String(payload.origin_digest),
          String(payload.metadata_uri),
          getAddress(process.env.ASSET_LAYER_DEFAULT_CUSTODIAN_WALLET || signer.address)
        );
      } else if (job.operation === "passport") {
        transaction = await contract.issueAssetPassport(
          enterpriseId,
          BigInt(chainAssetId!),
          String(payload.metadata_uri),
          String(payload.metadata_digest)
        );
      } else if (job.operation === "verify") {
        transaction = await contract.verifyAsset(
          enterpriseId,
          BigInt(chainAssetId!),
          encodeBytes32String(String(payload.verification_type)),
          BigInt(String(payload.verified_quantity_grams)),
          Boolean(payload.approved),
          String(payload.evidence_digest),
          String(payload.evidence_uri)
        );
      } else if (job.operation === "custody") {
        transaction = await contract.transferAssetCustody(
          enterpriseId,
          BigInt(chainAssetId!),
          getAddress(process.env.ASSET_LAYER_DEFAULT_CUSTODIAN_WALLET || signer.address),
          String(payload.manifest_digest),
          String(payload.manifest_uri)
        );
      } else if (job.operation === "transform") {
        const { data: outputAsset } = await supabase
          .from("asset_layer_assets")
          .select("asset_ref, material_type, metadata_uri")
          .eq("id", String(payload.output_asset_id))
          .single();
        if (!outputAsset) throw new Error("No existe el lote de salida de la transformación");
        transaction = await contract.recordAssetTransformation({
          enterpriseId,
          inputAssetId: BigInt(chainAssetId!),
          outputAssetRef: outputAsset.asset_ref,
          outputAssetType: encodeBytes32String(outputAsset.material_type),
          outputQuantity: BigInt(String(payload.output_quantity_grams)),
          rejectedQuantity: BigInt(String(payload.rejected_quantity_grams)),
          evidenceDigest: String(payload.evidence_digest),
          evidenceURI: String(payload.evidence_uri),
          outputMetadataURI: outputAsset.metadata_uri
        });
      } else if (job.operation === "certificate") {
        transaction = await contract.issueAssetCertificate(
          enterpriseId,
          BigInt(chainAssetId!),
          encodeBytes32String(String(payload.certificate_type)),
          String(payload.digest),
          String(payload.public_uri),
          String(payload.public_uri)
        );
      } else {
        transaction = await contract.redeemAsset(
          enterpriseId,
          BigInt(chainAssetId!),
          String(payload.redemption_digest),
          String(payload.redemption_uri)
        );
      }

      const receipt = await transaction.wait();
      if (!receipt) throw new Error("La transacción no produjo recibo");

      if (job.operation === "register") {
        const event = parsedEvent(receipt, "AssetRegistered");
        if (!event) throw new Error("No se encontró AssetRegistered en el recibo");
        await supabase
          .from("asset_layer_assets")
          .update({ chain_asset_id: Number(event.args.assetId), chain_tx_hash: receipt.hash })
          .eq("id", job.asset_id);
      }

      if (job.operation === "transform") {
        const event = parsedEvent(receipt, "AssetTransformationRecorded");
        if (!event) throw new Error("No se encontró AssetTransformationRecorded en el recibo");
        await supabase
          .from("asset_layer_assets")
          .update({ chain_asset_id: Number(event.args.outputAssetId), chain_tx_hash: receipt.hash, anchor_status: "confirmed" })
          .eq("id", String(payload.output_asset_id));
      }

      await supabase
        .from("asset_layer_outbox")
        .update({ status: "confirmed", chain_tx_hash: receipt.hash, processed_at: new Date().toISOString() })
        .eq("id", job.id);

      const { count: remaining } = await supabase
        .from("asset_layer_outbox")
        .select("id", { count: "exact", head: true })
        .eq("asset_id", job.asset_id)
        .in("status", ["pending", "processing", "failed"]);
      await supabase
        .from("asset_layer_assets")
        .update({
          anchor_status: remaining ? "pending" : "confirmed",
          chain_tx_hash: receipt.hash
        })
        .eq("id", job.asset_id);
      results.push({ id: job.id, status: "confirmed", txHash: receipt.hash });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Error desconocido";
      await Promise.all([
        supabase
          .from("asset_layer_outbox")
          .update({ status: "failed", last_error: message })
          .eq("id", job.id),
        supabase
          .from("asset_layer_assets")
          .update({ anchor_status: "failed" })
          .eq("id", job.asset_id)
      ]);
      results.push({ id: job.id, status: "failed", error: message });
    }
  }

  return { processed: results.length, results };
}
