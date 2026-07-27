import { Rectangle } from "@app/utils/cropCoordinates";
import { initWasmModule, waitForGlobalFunction } from "./wasm-loader";
import { encodeEnvelope, decodeEnvelope } from "./pdf-cpu";

export type PdfData = Uint8Array[];

export interface PdfEngine {
  merge(files: PdfData): Promise<Uint8Array>;
  rotate(files: PdfData, angle: number): Promise<Uint8Array>;
  optimize(files: PdfData): Promise<Uint8Array>;
  crop(files: PdfData, area: Rectangle): Promise<Uint8Array>;
  validateSignatures(files: PdfData): Promise<Uint8Array>;
  encrypt(files: PdfData, password: string, ownerPassword: string): Promise<Uint8Array>;
}

let engineInstance: PdfEngine | null = null;

export async function loadPdfCpu(): Promise<PdfEngine> {
  if (engineInstance) {
    return engineInstance;
  }

  await initWasmModule("pdfcpu-merge.wasm");

  const funcName = ["pdfcpuMerge", "pdfcpuRotate", "pdfcpuOptimize", "pdfcpuCrop", "pdfcpuValidateSignatures", "pdfcpuEncrypt"];
  await Promise.all(funcName.map((f) => waitForGlobalFunction(f)));

  const call = async (func: string, files: PdfData, params?: Record<string, unknown>) => {
    const envelope = encodeEnvelope({ files, params });
    const res = await (globalThis as any)[func](envelope);
    return decodeEnvelope(res).files[0];
  };

  engineInstance = {
    merge: (files) => call("pdfcpuMerge", files),
    rotate: (files, rotation) => call("pdfcpuRotate", files, { rotation }),
    optimize: (files) => call("pdfcpuOptimize", files),
    crop: (files, area) => call("pdfcpuCrop", files, area as any),
    validateSignatures: (files) => call("pdfcpuValidateSignatures", files),
    encrypt: (files, viewPass, ownerPass) => call("pdfcpuEncrypt", files, { viewPass, ownerPass })
  };

  return engineInstance;
}