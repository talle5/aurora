import { CustomProcessorResult } from "@app/tools/shared/useToolOperation";
import { loadPdfCpu, PdfEngine } from "./wasm";

let engine: PdfEngine | null = null;

type Methods = {
  [K in keyof PdfEngine]: PdfEngine[K] extends (...args: any[]) => any ? K : never;
}[keyof PdfEngine];

export async function invoke(
  method: Methods,
  files: File[],
  params: Record<string, unknown> = {},
): Promise<Uint8Array[]> {
  const data = await Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));
  engine ??= await loadPdfCpu();

  const targetFunction = (engine as any)[method];
  if (typeof targetFunction !== "function") {
    throw new TypeError(`Método "${method}" não existe no engine (verifique se foi registrado no Go)`);
  }
  try {
    console.log(params);
    return await targetFunction(data, params);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

type MultiFileNaming<P> = (
  index: number,
  total: number,
  parameters: P,
  files: File[]
) => { name: string; mimeType: string };

type SimpleOutputName<P> = string | ((parameters: P, files: File[]) => string);

export function createCustomProcessor<P>(
  method: Methods,
  naming: SimpleOutputName<P> | MultiFileNaming<P>,
  options: {
    multiFile?: boolean;
    mimeType?: string;
    toParams?: (p: P) => Record<string, unknown>;
  } = {},
) {
  const { multiFile = false, mimeType = "application/pdf", toParams } = options;

  const resolveParams = toParams ?? ((p: P) => p as unknown as Record<string, unknown>);

  return async (parameters: P, files: File[]): Promise<CustomProcessorResult> => {
    const params = resolveParams(parameters);
    const results = await invoke(method, files, params);

    const outFiles = results.map((result, i) => {
      let name: string;
      let finalMime = mimeType;

      if (multiFile) {
        const resolved = (naming as MultiFileNaming<P>)(i, results.length, parameters, files);
        name = resolved.name;
        finalMime = resolved.mimeType;
      } else {
        const simpleName = naming as SimpleOutputName<P>;
        name = typeof simpleName === "function" ? simpleName(parameters, files) : simpleName;
      }

      return new File([result.buffer as ArrayBuffer], name, { type: finalMime });
    });

    return { files: outFiles, consumedAllInputs: true };
  };
}