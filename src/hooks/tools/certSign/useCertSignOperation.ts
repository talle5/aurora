import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { CertSignParameters } from "@app/hooks/tools/certSign/useCertSignParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: CertSignParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[certSign] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const certSignOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "certSign",
  filePrefix: "certSign_",
});

export const useCertSignOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<CertSignParameters>({
    ...certSignOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("certSign.error.failed", "An error occurred while processing signatures."),
    ),
  });
};
