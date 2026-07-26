import { loadPdfCpu, PdfEngine } from "./wasm";

let engine: Awaited<ReturnType<typeof loadPdfCpu>> | null = null;

// 1. Restringimos `Methods` apenas para as chaves que são FUNÇÕES dentro de PdfEngine
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

  const arrayBuffers = await Promise.all(files.map((f) => f.arrayBuffer()));
  const data: Uint8Array[] = arrayBuffers.map((b) => new Uint8Array(b)); // Ponto e vírgula adicionado

  if (!engine) {
    engine = await loadPdfCpu();
  }

  // 2. Cast explícito da função para contornar a limitação de inferência de spread do TS
  // O TS não consegue correlacionar o tipo T resolvido com a tupla de argumentos no runtime, 
  // mas quem for consumir a função `invoke` continuará tendo 100% de type-safety.
  const targetFunction = engine[method] as Function;
  try {
    return targetFunction(data, ...args);
  } catch (e) {
    console.log(e);
    throw e;
  }
}