import React, { useState, useEffect } from "react";
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  getAutoOcrLanguage,
} from "@app/utils/languageMapping";
import DropdownListWithFooter, {
  DropdownItem,
} from "@app/components/shared/DropdownListWithFooter";

export interface LanguageOption {
  value: string;
  label: string;
}

export interface LanguagePickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  languagesEndpoint?: string;
  autoFillFromBrowserLanguage?: boolean;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  value,
  onChange,
  placeholder = "Select languages",
  disabled = false,
  label,
  autoFillFromBrowserLanguage = true,
}) => {
  const { t, i18n } = useTranslation();
  const [availableLanguages, setAvailableLanguages] = useState<DropdownItem[]>(
    [{value:"pt",name:""}],
  );
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  // Auto-fill OCR language based on browser language when languages are loaded
  useEffect(() => {
    const shouldAutoFillLanguage =
      autoFillFromBrowserLanguage &&
      availableLanguages.length > 0 &&
      !hasAutoFilled &&
      value.length === 0;

    if (shouldAutoFillLanguage) {
      // Use the comprehensive language mapping from languageMapping.ts
      const suggestedOcrLanguages = getAutoOcrLanguage(i18n.language);

      if (suggestedOcrLanguages.length > 0) {
        // Find the first suggested language that's available in the backend
        const matchingLanguage = availableLanguages.find((lang) =>
          suggestedOcrLanguages.includes(lang.value),
        );

        if (matchingLanguage) {
          onChange([matchingLanguage.value]);
        }
      }

      setHasAutoFilled(true);
    }
  }, [
    autoFillFromBrowserLanguage,
    availableLanguages,
    hasAutoFilled,
    value.length,
    i18n.language,
    onChange,
  ]);

  const footer = (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        <Text size="xs" c="dimmed" className="text-center">
          {t(
            "ocr.languagePicker.additionalLanguages",
            "Looking for additional languages?",
          )}
        </Text>
        <Text
          size="xs"
          style={{
            color: "#3b82f6",
            cursor: "pointer",
            textDecoration: "underline",
            textAlign: "center",
          }}
          onClick={() =>
            window.open(
              "https://docs.stirlingpdf.com/Configuration/OCR",
              "_blank",
            )
          }
        >
          {t("ocr.languagePicker.viewSetupGuide", "View setup guide →")}
        </Text>
      </div>
    </>
  );

  return (
    <DropdownListWithFooter
      value={value}
      onChange={(newValue) => onChange(newValue as string[])}
      items={availableLanguages}
      placeholder={placeholder}
      disabled={disabled}
      label={label}
      footer={footer}
      multiSelect={true}
      maxHeight={300}
      searchable={true}
    />
  );
};

export default LanguagePicker;
