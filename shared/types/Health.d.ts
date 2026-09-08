/* Generated from shared/contracts; do not edit. */

export type Service = "backend" | "processing";
export type Status = "ok" | "degraded";
export type ContractVersion = "1.0";

export interface Health {
  service: Service;
  status: Status;
  contract_version: ContractVersion;
  checks: Checks;
}
export interface Checks {
  [k: string]: "ok" | "unavailable" | "not_configured" | "not_implemented";
}
