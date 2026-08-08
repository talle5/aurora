import { initWasmModule, waitForGlobalFunction } from "./wasm-loader";
import { encodeEnvelope, decodeEnvelope } from "./utils";

export type PdfData = Uint8Array[];
export type PdfWasmFunction = (files: PdfData, params?: Record<string, unknown>) => Promise<Uint8Array[]>;
export type PdfMethodName =
  | "merge"
  | "rotate"
  | "optimize"
  | "crop"
  | "validateSignatures"
  | "encrypt"
  | "unlockForm"
  | "removeSignatures"
  | "removePages"
  | "extractImages"
  | "addWaterMark"
  | "removePassword"
  | "getInfo"
  | "booklet";

// Cria as 11 funções tipadas numa tacada só
export type PdfEngine = Record<PdfMethodName, PdfWasmFunction>;

let engineInstance: PdfEngine | null = null;

export async function loadPdfCpu(): Promise<PdfEngine> {
  if (engineInstance) {
    return engineInstance;
  }

  await initWasmModule("pdfcpu-merge.wasm");
  await waitForGlobalFunction("pdfcpuGetManifest");

  const manifest = (globalThis as any).pdfcpuGetManifest() as Record<string, number>;

  const call = async (func: string, files: PdfData, params?: Record<string, unknown>) => {
    const envelope = encodeEnvelope({ files, params });
    const res = await (globalThis as any)[func](envelope);
    return decodeEnvelope(res).files;
  };

  engineInstance = {} as PdfEngine;

  for (const funcName of Object.keys(manifest)) {
    const apiName = funcName.replace(/^pdfcpu/, '');
    const methodName = apiName.charAt(0).toLowerCase() + apiName.slice(1);

    (engineInstance as any)[methodName] = async (files: PdfData, params?: Record<string, unknown>) => call(funcName, files, params);
  }

  return engineInstance;
}