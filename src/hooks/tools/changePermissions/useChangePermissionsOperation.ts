import { useTranslation } from "react-i18next";
import { useToolOperation } from "@app/hooks/tools/shared/useToolOperation";
import { createStandardErrorHandler } from "@app/utils/toolErrorHandler";
import { CustomProcessorResult, defineCustomTool } from "@app/tools/shared/toolOperationTypes";
import { ChangePermissionsParameters } from "@app/hooks/tools/changePermissions/useChangePermissionsParameters";

// BYPASS: operação ainda não portada para o motor local (WASM).
// Devolve o arquivo original sem alteração, só pra não quebrar o fluxo da UI.
// ATENÇÃO: o arquivo original tinha um responseHandler/lógica customizada
// (verificar histórico do git) que foi removida neste bypass.
const customProcessor = async (
  _parameters: ChangePermissionsParameters,
  files: File[],
): Promise<CustomProcessorResult> => {
  console.warn('[changePermissions] operação ainda não implementada localmente — bypass ativo, arquivo devolvido sem alteração');
  return { files, consumedAllInputs: true };
};

export const changePermissionsOperationConfig = defineCustomTool({
  customProcessor,
  operationType: "changePermissions",
  filePrefix: "changePermissions_",
});

export const useChangePermissionsOperation = () => {
  const { t } = useTranslation();

  return useToolOperation<ChangePermissionsParameters>({
    ...changePermissionsOperationConfig,
    getErrorMessage: createStandardErrorHandler(
      t("changePermissions.error.failed", "An error occurred while changing PDF permissions."),
    ),
  });
};
