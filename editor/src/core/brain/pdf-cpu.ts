import { CustomProcessorResult } from "@app/tools/shared/useToolOperation";
import { loadPdfCpu, PdfEngine } from "./wasm";

let engine: PdfEngine | null = null;

type Methods = {
  [K in keyof PdfEngine]: PdfEngine[K] extends (...args: any[]) => any ? K : never;
}[keyof PdfEngine];

type Fn<T extends Methods> = Extract<PdfEngine[T], (...args: any[]) => any>;

export async function invoke(
  method: Methods,
  files: File[],
  params: Record<string, unknown> = {},
): Promise<Uint8Array[]> {
  const data = await Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));
  engine ??= await loadPdfCpu();

  const targetFunction = (engine as any)[method];
  if (typeof targetFunction !== "function") {
    throw new Error(`Método "${method}" não existe no engine (verifique se foi registrado no Go)`);
  }
  return targetFunction(data, params);
}

export function createSimpleCustomProcessor<P>(
  method: Methods,
  outputName: string | ((parameters: P, files: File[]) => string),
  mimeType: string = "application/pdf",
  toParams?: (parameters: P) => Record<string, unknown>,
) {
  return async (parameters: P, files: File[]): Promise<CustomProcessorResult> => {
    const name = typeof outputName === "function" ? outputName(parameters, files) : outputName;
    const params = toParams ? toParams(parameters) : {};

    const results = await invoke(method, files, params);
    const file = new File([results[0].buffer as ArrayBuffer], name, { type: mimeType });

    return { files: [file], consumedAllInputs: true };
  };
}

export function createMultiFileCustomProcessor<P>(
  method: Methods,
  naming: (index: number, total: number, parameters: P, files: File[]) => { name: string; mimeType: string },
  toParams?: (parameters: P) => Record<string, unknown>,
) {
  return async (parameters: P, files: File[]): Promise<CustomProcessorResult> => {
    const params = toParams ? toParams(parameters) : {};
    const results = await invoke(method, files, params); // Uint8Array[]

    const outFiles = results.map((bytes, i) => {
      const { name, mimeType } = naming(i, results.length, parameters, files);
      return new File([bytes.buffer as ArrayBuffer], name, { type: mimeType });
    });

    return { files: outFiles, consumedAllInputs: true };
  };
}