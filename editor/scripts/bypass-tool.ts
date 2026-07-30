// scripts/bypass-tool.ts
import { glob } from "glob";
import * as fs from "fs";

function findParamsTypeName(original: string): string | null {
  // Estratégia 1: useToolOperation<Tipo>(...)
  const strat1 = original.match(/useToolOperation<(\w+)>/);
  if (strat1) return strat1[1];

  // Estratégia 2: alguma variável tipada como ToolOperationConfig<Tipo>
  const strat2 = original.match(/ToolOperationConfig<(\w+)>/);
  if (strat2) return strat2[1];

  // Estratégia 3: procura o import vindo de .../tools/<algo>/use<Algo>Parameters
  // e pega o primeiro named import que pareça ser o tipo (começa maiúsculo,
  // não é "default..."/"DEFAULT_...")
  const importBlockMatch = original.match(
    /import\s*\{([^}]*)\}\s*from\s*["'][^"']*\/use\w+Parameters["'];?/s,
  );
  if (importBlockMatch) {
    const names = importBlockMatch[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    const typeName = names.find(
      (n) => /^[A-Z]/.test(n) && !n.startsWith("DEFAULT"),
    );
    if (typeName) return typeName;
  }

  return null;
}

function bypassFile(filePath: string) {
  const original = fs.readFileSync(filePath, "utf-8");

  if (!original.includes("defineSingleFileTool") && !original.includes("defineMultiFileTool")) {
    return;
  }

  const operationTypeMatch = original.match(/operationType:\s*["']([^"']+)["']/);
  const filePrefixMatch = original.match(/filePrefix:\s*["']([^"']+)["']/);
  if (!operationTypeMatch) {
    console.warn(`[SKIP] ${filePath}: operationType não encontrado`);
    return;
  }
  const operationType = operationTypeMatch[1];
  const filePrefix = filePrefixMatch?.[1] ?? `${operationType}_`;

  const paramsTypeName = findParamsTypeName(original);
  if (!paramsTypeName) {
    console.warn(`[SKIP] ${filePath}: não consegui identificar o tipo de parâmetros por nenhuma estratégia`);
    return;
  }

  const importRegex = new RegExp(
    `import\\s*\\{[^}]*\\b${paramsTypeName}\\b[^}]*\\}\\s*from\\s*["'][^"']+["'];?`,
    "s",
  );
  const importMatch = original.match(importRegex);

  const moduleMatch = importMatch?.[0].match(/from\s*["']([^"']+)["']/);
  const modulePath = moduleMatch?.[1] ?? `@app/hooks/tools/${operationType}/use${capitalize(operationType)}Parameters`;
  const paramsImportLine = `import { ${paramsTypeName} } from "${modulePath}";`;

  const errorMatch = original.match(/t\(\s*(["'][^"']+["'])\s*,\s*(["'][^"']+["'])/);
  const errorKey = errorMatch?.[1] ?? `"${operationType}.error.failed"`;
  const errorMsg = errorMatch?.[2] ?? `"An error occurred while processing the PDF."`;

  const capitalized = capitalize(operationType);

  const stub = `import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
${paramsImportLine}

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: ${paramsTypeName},
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[${operationType}] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const ${operationType}OperationConfig = defineCustomTool({
  customProcessor,
  operationType: "${operationType}",
  filePrefix: "${filePrefix}",
});

export const use${capitalized}Operation = () => {
  const { t } = useTranslation();

  return useToolOperation<${paramsTypeName}>({
    ...${operationType}OperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t(${errorKey}, ${errorMsg}),
    ),
  });
};
`;

  fs.writeFileSync(filePath, stub);
  console.log(`[BYPASS] ${filePath} (operationType=${operationType}, params=${paramsTypeName})`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function main() {
  const testFileOnly = process.argv[2];
  const pattern = testFileOnly || "editor/src/core/hooks/tools/**/use*Operation.ts";
  const files = await glob(pattern, { ignore: ["**/node_modules/**"] });

  console.log(`Encontrados ${files.length} arquivo(s)`);
  const skipped: string[] = [];
  for (const f of files) {
    const before = fs.readFileSync(f, "utf-8");
    bypassFile(f);
    const after = fs.readFileSync(f, "utf-8");
    if (before === after) skipped.push(f);
  }

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} arquivo(s) NÃO tocado(s) — revisar manualmente:`);
    skipped.forEach((f) => console.log(`  - ${f}`));
  }
}

main();