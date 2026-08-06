import { Rectangle } from "@app/utils/cropCoordinates";
import { initWasmModule, waitForGlobalFunction } from "./wasm-loader";
import { encodeEnvelope, decodeEnvelope } from "./utils";
import { RotateParameters } from "@app/hooks/tools/rotate/useRotateParameters";
import { AddPasswordParameters } from "@app/hooks/tools/addPassword/useAddPasswordParameters";

export type PdfData = Uint8Array[];

export interface PdfEngine {
  merge(files: PdfData): Promise<Uint8Array>;
  rotate(files: PdfData, angle: RotateParameters): Promise<Uint8Array>;
  optimize(files: PdfData): Promise<Uint8Array>;
  crop(files: PdfData, area: Rectangle): Promise<Uint8Array>;
  validateSignatures(files: PdfData): Promise<Uint8Array>;
  encrypt(files: PdfData, secrets: AddPasswordParameters): Promise<Uint8Array>;
  unlockForm(files: PdfData): Promise<Uint8Array>;
  removeSignatures(files: PdfData): Promise<Uint8Array>;
  removePages(files: PdfData): Promise<Uint8Array>;
  extractImages(files: PdfData): Promise<Uint8Array>;
  addWaterMark(files: PdfData): Promise<Uint8Array>;
}

let engineInstance: PdfEngine | null = null;

export async function loadPdfCpu(): Promise<PdfEngine> {
  if (engineInstance) {
    return engineInstance;
  }

  await initWasmModule("pdfcpu-merge.wasm");
  await waitForGlobalFunction("pdfcpuGetManifest");

  const manifest = (globalThis as any).pdfcpuGetManifest() as Record<string, number>;

  const call = async (func: string, files: PdfData, params?: Record<string, unknown>): Promise<Uint8Array[]> => {
    const envelope = encodeEnvelope({ files, params });
    const res = await (globalThis as any)[func](envelope);
    return decodeEnvelope(res).files;
  };

  engineInstance = {} as PdfEngine;

  for (const funcName of Object.keys(manifest)) {
    const apiName = funcName.replace(/^pdfcpu/, '');
    const methodName = apiName.charAt(0).toLowerCase() + apiName.slice(1);

    (engineInstance as any)[methodName] = async (files: PdfData, params?: any) => call(funcName, files, params);
  }

  return engineInstance;
}