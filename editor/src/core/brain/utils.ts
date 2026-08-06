export const MAGIC = new Uint8Array([0x50, 0x43, 0x50, 0x55]);

export interface PdfEnvelope {
  files: Uint8Array[];
  params?: Record<string, unknown>;
}

class BufferWriter {
  private buf: Uint8Array;
  private view: DataView;
  private offset = 0;

  constructor(size: number) {
    this.buf = new Uint8Array(size);
    this.view = new DataView(this.buf.buffer);
  }

  writeUint32(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  writeRaw(bytes: Uint8Array) {
    this.buf.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  writeBlock(bytes: Uint8Array) {
    this.writeUint32(bytes.length);
    this.writeRaw(bytes);
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

  readBlock(): Uint8Array {
    const length = this.readUint32();
    const slice = this.buf.subarray(this.offset, this.offset + length); // era .slice()
    this.offset += length;
    return slice;
  }

  readMagic(expected: Uint8Array): boolean {
    const length = expected.length;
    const magic = this.buf.slice(this.offset, this.offset + length);
    this.offset += length;
    return magic.every((b, i) => b === expected[i]);
  }
}

export function encodeEnvelope({ files, params = {} }: PdfEnvelope): Uint8Array {
  const paramsBytes = new TextEncoder().encode(JSON.stringify(params));
  const totalSize = 4 + 4 + files.reduce((acc, f) => acc + 4 + f.length, 0) + 4 + paramsBytes.length;

  const writer = new BufferWriter(totalSize);
  writer.writeRaw(MAGIC);
  writer.writeUint32(files.length);
  for (const f of files) writer.writeBlock(f);
  writer.writeBlock(paramsBytes);

  return writer.getBuffer();
}

export function decodeEnvelope(buf: Uint8Array): PdfEnvelope {
  const reader = new BufferReader(buf);

  if (!reader.readMagic(MAGIC)) {
    throw new Error("envelope inválido: magic bytes não batem");
  }

  const fileCount = reader.readUint32();
  const files = Array.from({ length: fileCount }, () => reader.readBlock());

  const paramsBytes = reader.readBlock();
  const paramsJson = new TextDecoder().decode(paramsBytes);
  const params = paramsJson ? (JSON.parse(paramsJson) as Record<string, unknown>) : {};

  return { files, params };
}