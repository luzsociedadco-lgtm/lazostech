export const LAZOSTECH_ASSET_ORGANIZATION_ID = "6dbfbbe9-d271-4c10-a1bd-2cda227d2453";
export const LAZOSTECH_ASSET_ROOT = "0x6DbfbbE9d2719C10aA1BD2Cda227d2453E1F16F7" as const;
export const LAZOSTECH_ENTERPRISE_ID = 1n;
export const LAZOSTECH_ENTERPRISE_ADMIN = "0xCa9cDD6714033a4D08e4BE479c1077e5B35f3a4B" as const;
export const LAZOSTECH_OPERATOR_WALLET = "0xB4BFd705bd44E5b6e154b55f6198c2b1F5a457eC" as const;
export const LAZOSTECH_AUDITOR_WALLET = "0x0e34aA3dFd097Ac3a318B4832B2F094caB28220c" as const;
export const ENTERPRISE_OPERATOR_ROLE =
  "0x62c396e909cb3a33ff933605f9a069dae6c5528d447227ab9091bc0c1244a941" as const;
export const ENTERPRISE_AUDITOR_ROLE =
  "0x438169c14634f87e2308c3344f7ca2d6dbc85f722194ebf0c8cfe2aaf2d9dea9" as const;

export const assetMaterialProfiles = {
  ALUMINUM_POST_CONSUMER: {
    label: "Latas de aluminio posconsumo",
    outputType: "ALUMINUM_RECYCLED_INGOT",
    inputPrefix: "LAZ-ALU-",
    outputPrefix: "LAZ-RALU-"
  },
  PET_POST_CONSUMER: {
    label: "PET posconsumo",
    outputType: "PET_RECYCLED_FLAKE",
    inputPrefix: "LAZ-PET-",
    outputPrefix: "LAZ-RPET-"
  }
} as const;

export type AssetInputMaterial = keyof typeof assetMaterialProfiles;
export type AssetLayerRole = "admin" | "operator" | "verifier" | "auditor" | "viewer";
export type AssetLayerStatus =
  | "registered"
  | "verified"
  | "in_custody"
  | "transformed"
  | "certified"
  | "redeemed"
  | "suspended";

export type AssetLayerAsset = {
  id: string;
  asset_ref: string;
  material_type: string;
  quantity_grams: number;
  origin_general: string;
  current_custodian: string;
  status: AssetLayerStatus;
  passport_version: number;
  chain_asset_id: number | null;
  chain_tx_hash: string | null;
  anchor_status: "pending" | "processing" | "confirmed" | "failed" | "not_required";
  created_at: string;
  updated_at: string;
};
