import { Stack, Text } from "@mantine/core";
import { Button } from "@app/ui/Button";
import { useTranslation } from "react-i18next";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { useToolWorkflow } from "@app/contexts/ToolWorkflowContext";

/**
 * Content for the optional "Request signatures" step in the Sign tool: a short
 * explanation plus a link to the standalone Shared Signing tool. Renders
 * nothing unless group signing is enabled on the server.
 */
export default function SharedSigningLauncher() {
  const { t } = useTranslation();
  const { handleToolSelect } = useToolWorkflow();


  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t(
          "sign.sharedSigningStepDesc",
          "Send this document to others to sign instead of signing it yourself.",
        )}
      </Text>
      <Button
        fullWidth
        variant="tertiary"
        leftSection={<GroupAddOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
        onClick={() => handleToolSelect("sharedSign")}
      >
        {t("sign.sharedSigningOpen", "Open shared signing")}
      </Button>
    </Stack>
  );
}
