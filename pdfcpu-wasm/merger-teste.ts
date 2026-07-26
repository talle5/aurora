// test_wasm.ts
// @ts-ignore - wasm_exec.js não tem tipos
import "./wasm_exec.js";

const go = new (globalThis as any).Go();
const wasmBytes = await Deno.readFile("pdfcpu-merge.wasm");
const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);

go.run(instance); // roda main(), que registra pdfcpuMerge em globalThis

const a = await Deno.readFile("teste_1.pdf");
const b = await Deno.readFile("teste_2.pdf");

const result: Uint8Array = await (globalThis as any).pdfcpuMerge([a, b]);
await Deno.writeFile("saida_wasm.pdf", result);
console.log(`Merge via WASM ok: ${result.length} bytes`);