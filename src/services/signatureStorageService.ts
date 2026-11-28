import type { SavedSignature } from "@app/types/signature";

export type StorageType = "backend" | "localStorage";

interface SignatureStorageCapabilities {
  supportsBackend: boolean;
  storageType: StorageType;
}

/**
 * Service to handle signature storage with adaptive backend/localStorage fallback
 */
class SignatureStorageService {
  private capabilities: SignatureStorageCapabilities | null = null;
  private detectionPromise: Promise<SignatureStorageCapabilities> | null = null;

  /**
   * Detect if backend supports signature storage API
   */
  async detectCapabilities(): Promise<SignatureStorageCapabilities> {
    // Return cached result if already detected
    if (this.capabilities) {
      return this.capabilities;
    }

    // Return in-flight detection if already running
    if (this.detectionPromise) {
      return this.detectionPromise;
    }

    // Start new detection
    this.detectionPromise = this._performDetection();
    this.capabilities = await this.detectionPromise;
    this.detectionPromise = null;

    return this.capabilities;
  }

  private async _performDetection(): Promise<SignatureStorageCapabilities> {
    try {
      // 200 = Backend available and accessible (authenticated)
      console.log(
        "[SignatureStorage] Backend signature API detected and accessible (authenticated)",
      );
      return {
        supportsBackend: true,
        storageType: "backend",
      };
    } catch (error: any) {
      // Check if it's an HTTP error with status code
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Backend exists but needs auth - gracefully fall back to localStorage
        console.log(
          "[SignatureStorage] Backend signature API requires authentication, using localStorage",
        );
      } else if (error?.response?.status === 404) {
        // Endpoint doesn't exist (not running proprietary mode)
        console.log(
          "[SignatureStorage] Backend signature API not available (not in proprietary mode), using localStorage",
        );
      } else {
        // Network error, timeout, or other error
        console.log(
          "[SignatureStorage] Backend signature API not available, using localStorage",
        );
      }

      return {
        supportsBackend: false,
        storageType: "localStorage",
      };
    }
  }

  /**
   * Get current storage type
   */
  async getStorageType(): Promise<StorageType> {
    const capabilities = await this.detectCapabilities();
    return capabilities.storageType;
  }

  /**
   * Load all signatures
   */
  async loadSignatures(): Promise<SavedSignature[]> {
    return this._loadFromLocalStorage();
  }

  /**
   * Save a signature
   */
  async saveSignature(signature: SavedSignature): Promise<void> {
    signature.scope = "localStorage";
    this._saveToLocalStorage(signature);
  }

  /**
   * Delete a signature
   */
  async deleteSignature(id: string): Promise<void> {
    this._deleteFromLocalStorage(id);
  }

  /**
   * Update signature label
   */
  async updateSignatureLabel(id: string, label: string): Promise<void> {
    this._updateLabelInLocalStorage(id, label);
  }

  private readonly STORAGE_KEY = "stirling:saved-signatures:v1";

  private _loadFromLocalStorage(): SavedSignature[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const signatures = JSON.parse(raw);
      // Ensure all localStorage signatures have the correct scope
      return signatures.map((sig: SavedSignature) => ({
        ...sig,
        scope: "localStorage" as const,
      }));
    } catch {
      return [];
    }
  }

  private _saveToLocalStorage(signature: SavedSignature): void {
    const signatures = this._loadFromLocalStorage();
    const index = signatures.findIndex((s) => s.id === signature.id);

    if (index >= 0) {
      signatures[index] = signature;
    } else {
      signatures.unshift(signature);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(signatures));
  }

  private _deleteFromLocalStorage(id: string): void {
    const signatures = this._loadFromLocalStorage();
    const filtered = signatures.filter((s) => s.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  private _updateLabelInLocalStorage(id: string, label: string): void {
    const signatures = this._loadFromLocalStorage();
    const signature = signatures.find((s) => s.id === id);
    if (signature) {
      signature.label = label;
      signature.updatedAt = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(signatures));
    }
  }

  /**
   * Migrate signatures from localStorage to backend
   */
  async migrateToBackend(): Promise<{ migrated: number; failed: number }> {
    const capabilities = await this.detectCapabilities();

    if (!capabilities.supportsBackend) {
      return { migrated: 0, failed: 0 };
    }

    const localSignatures = this._loadFromLocalStorage();
    if (localSignatures.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    let migrated = 0;
    let failed = 0;

    // Clear localStorage after successful migration
    if (migrated > 0 && failed === 0) {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log(
        `[SignatureStorage] Successfully migrated ${migrated} signatures to backend`,
      );
    }

    return { migrated, failed };
  }
}

export const signatureStorageService = new SignatureStorageService();
