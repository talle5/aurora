// src/wasm-loader.ts
import { BASE_PATH } from "@app/constants/app";

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((globalThis as any).Go) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

async function instantiateWasm(
  url: string,
  importObject: Record<string, any>
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      const response = await fetch(url);
      return await WebAssembly.instantiateStreaming(response, importObject);
    } catch (e) {
      console.warn("WebAssembly.instantiateStreaming failed, falling back to arrayBuffer:", e);
    }
  }
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return await WebAssembly.instantiate(buffer, importObject);
}

/**
 * Inicializa e retorna a instância bruta do Go Wasm.
 */
export async function initWasmModule(wasmFileName: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Wasm is only supported in browser environments");
  }

  const origin = window.location.origin;
  const wasmExecUrl = `${origin}${BASE_PATH}/wasm/wasm_exec.js`;
  const wasmUrl = `${origin}${BASE_PATH}/wasm/${wasmFileName}`;

  if (!(globalThis as any).Go) {
    await loadScript(wasmExecUrl);
  }

  if (!(globalThis as any).Go) {
    throw new Error("Failed to load Go WASM execution environment from wasm_exec.js");
  }

  const go = new (globalThis as any).Go();
  const { instance } = await instantiateWasm(wasmUrl, go.importObject);

  // Executa o Go em background (não bloqueia)
  go.run(instance);
}

/**
 * Auxiliar para aguardar uma função global injetada pelo Go ficar pronta.
 */
export async function waitForGlobalFunction(fnName: string, retries = 50, delay = 10): Promise<void> {
  for (let i = 0; i < retries; i++) {
    if (typeof (globalThis as any)[fnName] === "function") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`Function ${fnName} was not registered by Go WebAssembly module`);
}