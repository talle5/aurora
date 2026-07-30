import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { RemoveCertificateSignParameters } from "@app/hooks/tools/removeCertificateSign/useRemoveCertificateSignParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
const customProcessor = async (
  _parameters: RemoveCertificateSignParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[removeCertSign] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const removeCertificateSignOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "removeCertSign",
  filePrefix: "removeCertSign_",
});

export const useRemoveCertSignOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<RemoveCertificateSignParameters>({
    ...removeCertificateSignOperationConfig ,
    getErrorMessage: createStandardErrorHandler(
      t("removeCertSign.error.failed", "An error occurred while removing certificate signatures."),
    ),
  });
};
