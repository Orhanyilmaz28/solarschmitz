/** Eine Funktion ist vorgesehen, aber noch nicht eingerichtet (z. B. fehlende Zugangsdaten). */
export class NotConfiguredError extends Error {
  readonly code = "NOT_CONFIGURED";
  /** Was fehlt, z. B. Namen von Umgebungsvariablen */
  readonly missing: string[];
  constructor(message: string, missing: string[] = []) {
    super(message);
    this.name = "NotConfiguredError";
    this.missing = missing;
  }
}

/** Fehler bei der Kommunikation mit einem Lieferanten. */
export class SupplierError extends Error {
  readonly code = "SUPPLIER_ERROR";
  readonly supplierId: string;
  readonly status?: number;
  constructor(message: string, supplierId: string, status?: number) {
    super(message);
    this.name = "SupplierError";
    this.supplierId = supplierId;
    this.status = status;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
