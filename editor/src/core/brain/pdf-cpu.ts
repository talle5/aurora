import { loadPdfCpu, PdfEngine } from "./wasm";

let engine: PdfEngine | null = null;

type Methods = {
  [K in keyof PdfEngine]: PdfEngine[K] extends (...args: any[]) => any ? K : never;
}[keyof PdfEngine];

type Fn<T extends Methods> = Extract<PdfEngine[T], (...args: any[]) => any>;
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : [];

export async function invoke<T extends Methods>(
  method: T,
  files: File[],
  ...args: Tail<Parameters<Fn<T>>>
): Promise<Awaited<ReturnType<Fn<T>>>> {
  const data: Uint8Array[] = await Promise.all(
    files.map(async (f) => new Uint8Array(await f.arrayBuffer()))
  );

  engine ??= await loadPdfCpu();

  const targetFunction = engine[method] as (...args: any[]) => any;
  try {
    return await targetFunction(data, ...args);
  } catch (e) {
    console.error(`Erro ao executar a operação ${method}:`, e);
    throw e;
  }
}

export interface PdfEnvelope {
  files: Uint8Array[];
  params?: Record<string, unknown>;
}

export const MAGIC = new Uint8Array([0x50, 0x43, 0x50, 0x55]); // "PCPU"[cite: 2]

class BufferWriter {
  private buf: Uint8Array;
  private view: DataView;
  private offset = 0;

  constructor(size: number) {
    this.buf = new Uint8Array(size);
    this.view = new DataView(this.buf.buffer);
  }

  writeBytes(bytes: Uint8Array) {
    this.buf.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  writeUint32(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  getBuffer() {
    return this.buf;
  }
}

class BufferReader {
  private offset = 0;
  private view: DataView;

  constructor(private buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  readUint32(): number {
    const val = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readBytes(length: number): Uint8Array {
    const slice = this.buf.slice(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  readMagic(expected: Uint8Array): boolean {
    const magic = this.readBytes(expected.length);
    return magic.every((b, i) => b === expected[i]);
  }
}

// --- Funções de Envelope Simplificadas ---

export function encodeEnvelope({ files, params = {} }: PdfEnvelope): Uint8Array {
  const paramsBytes = new TextEncoder().encode(JSON.stringify(params));

  const totalSize = 8 + files.reduce((acc, f) => acc + 4 + f.length, 0) + 4 + paramsBytes.length;
  
  const writer = new BufferWriter(totalSize);
  
  writer.writeBytes(MAGIC);
  writer.writeUint32(files.length);
  
  for (const f of files) {
    writer.writeUint32(f.length);
    writer.writeBytes(f);
  }

  writer.writeUint32(paramsBytes.length);
  writer.writeBytes(paramsBytes);

  return writer.getBuffer();
}

export function decodeEnvelope(buf: Uint8Array): PdfEnvelope {
  const reader = new BufferReader(buf);

  if (!reader.readMagic(MAGIC)) {
    throw new Error("envelope inválido: magic bytes não batem");
  }

  const fileCount = reader.readUint32();
  const files: Uint8Array[] = [];
  
  for (let i = 0; i < fileCount; i++) {
    const len = reader.readUint32();
    files.push(reader.readBytes(len));
  }

  const paramsLen = reader.readUint32();
  const paramsBytes = reader.readBytes(paramsLen);
  const paramsJson = new TextDecoder().decode(paramsBytes);
  
  const params = paramsJson ? JSON.parse(paramsJson) as Record<string, unknown> : {};

  return { files, params };
}