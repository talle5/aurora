import { loadPdfCpu, PdfEngine } from "./wasm";

let engine: PdfEngine | null = null;

type Methods = {
  [K in keyof PdfEngine]: PdfEngine[K] extends (...args: any[]) => any ? K : never;
}[keyof PdfEngine];

type Fn<T extends Methods> = Extract<PdfEngine[T], (...args: any[]) => any>;

type Tail<T extends any[]> = T extends [any, ...infer R] ? R : [];

export async function invoke<
  T extends Methods
>(
  method: T,
  files: File[],
  ...args: Tail<Parameters<Fn<T>>>
): Promise<Awaited<ReturnType<Fn<T>>>> {

  const data: Uint8Array[] = await Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));

  if (!engine) {
    engine = await loadPdfCpu();
  }

  const targetFunction = engine[method] as Function;
  try {
    return await targetFunction(data, ...args);
  } catch (e) {
    console.log(e);
    throw e;
  }
}

export interface PdfEnvelope {
  files: Uint8Array[];
  params?: Record<string, unknown>;
}

export const MAGIC = new Uint8Array([0x50, 0x43, 0x50, 0x55]); // "PCPU"

export function encodeEnvelope({ files, params = {} }: PdfEnvelope): Uint8Array {
  const paramsBytes = new TextEncoder().encode(JSON.stringify(params));

  let totalSize = 4 + 4; // magic + fileCount
  for (const f of files) totalSize += 4 + f.length;
  totalSize += 4 + paramsBytes.length;

  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);
  let offset = 0;

  buf.set(MAGIC, offset); offset += 4;
  view.setUint32(offset, files.length, true); offset += 4;

  for (const f of files) {
    view.setUint32(offset, f.length, true); offset += 4;
    buf.set(f, offset); offset += f.length;
  }

  view.setUint32(offset, paramsBytes.length, true); offset += 4;
  buf.set(paramsBytes, offset);

  return buf;
}

export function decodeEnvelope(buf: Uint8Array): PdfEnvelope {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let offset = 0;

  const magic = buf.slice(0, 4);
  if (!magic.every((b, i) => b === MAGIC[i])) {
    throw new Error("envelope inválido: magic bytes não batem");
  }
  offset += 4;

  const fileCount = view.getUint32(offset, true); offset += 4;
  const files: Uint8Array[] = [];
  for (let i = 0; i < fileCount; i++) {
    const len = view.getUint32(offset, true); offset += 4;
    files.push(buf.slice(offset, offset + len)); offset += len;
  }

  const paramsLen = view.getUint32(offset, true); offset += 4;
  const paramsJson = new TextDecoder().decode(buf.slice(offset, offset + paramsLen));
  const params = JSON.parse(paramsJson || "{}");

  return { files, params };
}