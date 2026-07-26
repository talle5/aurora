// src/wasm.ts
import { Rectangle } from "@app/utils/cropCoordinates";
import { initWasmModule, waitForGlobalFunction } from "./wasm-loader";

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

/**
 * Carrega e retorna a engine do PDF pronta para uso.
 */
export async function loadPdfCpu(): Promise<PdfEngine> {
  if (engineInstance) {
    return engineInstance;
  }

  // 1. Inicializa o binário WebAssembly do pdfcpu
  await initWasmModule("pdfcpu-merge.wasm");

  // 2. Aguarda todas as funções globais ficarem disponíveis
  const funcName = ["pdfcpuMerge", "pdfcpuRotate", "pdfcpuOptimize", "pdfcpuCrop", "pdfcpuValidateSignatures", "pdfcpuEncrypt"]
  await Promise.all(funcName.map((f) => waitForGlobalFunction(f)));

  // 3. Constrói o objeto da engine limpo
  engineInstance = {
    merge: async (buffers: PdfData) => (globalThis as any).pdfcpuMerge(buffers),
    rotate: async (data: PdfData, angulo: number) => (globalThis as any).pdfcpuRotate(data, angulo),
    optimize: async (data: PdfData) => (globalThis as any).pdfcpuOptimize(data),
    crop: async (data: PdfData, area: Rectangle) => (globalThis as any).pdfcpuCrop(data, area),
    validateSignatures: async (data: PdfData) => (globalThis as any).pdfcpuValidateSignatures(data),
    encrypt: async (data: PdfData, password: string, ownerPassword: string) => (globalThis as any).pdfcpuEncrypt(data, password, ownerPassword)
  };

  return engineInstance;
}