// @ts-check

import eslint from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const srcGlobs = ["src/**/*.{js,mjs,jsx,ts,tsx}"];
const nodeGlobs = [
  "scripts/**/*.{js,ts,mjs,mts}",
  "*.config.{js,ts,mjs}",
  ".storybook/*.{js,ts,mjs,mts,tsx}",
];

const baseRestrictedImportPatterns = [
  {
    regex: "^\\.",
    message:
      "Use a workspace alias (@app/*) instead of relative imports.",
  },
  {
    regex: "^src/",
    message: "Use a workspace alias instead of absolute src/ imports.",
  },
];

// Button/SegmentedControl/Chip must come from the shared DS (@app/ui), not Mantine.
// If no variant fits, extend @app/ui — that layer (src/ui) is exempt below.
const mantineComponentImportRestrictions = [
  {
    selector:
      "ImportDeclaration[source.value='@mantine/core'] > ImportSpecifier[imported.name=/^(Button|ActionIcon|UnstyledButton|CloseButton|FileButton)$/]",
    message:
      'Use the shared Button (@app/ui/Button) instead of the Mantine button family. variant=primary|secondary|tertiary, accent=default|neutral|brand|ai|premium|danger|success|warning; an icon-only button is `<Button leftSection={…} aria-label="…" />`. If no variant fits, extend the shared Button rather than importing Mantine.',
  },
  {
    selector:
      "ImportDeclaration[source.value='@mantine/core'] > ImportSpecifier[imported.name='SegmentedControl']",
    message:
      "Use the shared SegmentedControl (@app/ui/SegmentedControl) instead of Mantine's.",
  },
  {
    selector:
      "ImportDeclaration[source.value='@mantine/core'] > ImportSpecifier[imported.name=/^(Chip|Pill)$/]",
    message:
      "Use the shared Chip (@app/ui/Chip) instead of Mantine's Chip/Pill.",
  },
];

// Raw <button> should be a shared Button too — but bespoke CSS-styled controls
// (tabs, nav rows, preset chips) can be exempted from this selector alone.
const rawButtonSyntaxRestriction = {
  selector: "JSXOpeningElement[name.name='button']",
  message:
    "Use the shared Button (@app/ui/Button) instead of a raw <button> element. If no variant fits, extend the shared Button.",
};

const sharedComponentSyntaxRestrictions = [
  ...mantineComponentImportRestrictions,
  rawButtonSyntaxRestriction,
];

export default defineConfig(
  {
    // Everything that contains 3rd party code that we don't want to lint
    ignores: [
      "dist",
      "node_modules",
      "public",
      "src-tauri",
      "pdfcpu-wasm",
      "playwright-report",
      "storybook-static",
      "test-results",
      "tests",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: baseRestrictedImportPatterns,
        },
      ],
      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          // Allow empty extending interfaces because there's no real reason not to, and it makes it obvious where to put extra attributes in the future
          allowInterfaces: "with-single-extends",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off", // Temporarily disabled until codebase conformant
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all", // All function args must be used (or explicitly ignored)
          argsIgnorePattern: "^_", // Allow unused variables beginning with an underscore
          caughtErrors: "all", // Caught errors must be used (or explicitly ignored)
          caughtErrorsIgnorePattern: "^_", // Allow unused variables beginning with an underscore
          destructuredArrayIgnorePattern: "^_", // Allow unused variables beginning with an underscore
          varsIgnorePattern: "^_", // Allow unused variables beginning with an underscore
          ignoreRestSiblings: true, // Allow unused variables when removing attributes from objects (otherwise this requires explicit renaming like `({ x: _x, ...y }) => y`, which is clunky)
        },
      ],
    },
  },
  // Desktop-only packages must not be imported directly in web source.
  {
    files: srcGlobs,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...baseRestrictedImportPatterns,
            {
              regex: "^@tauri-apps/",
              message:
                "Tauri APIs are desktop-only. Review docs/DeveloperGuide.md for structure advice.",
            },
          ],
        },
      ],
    },
  },
  // App code must use shared DS Button/SegmentedControl/Chip.
  {
    files: srcGlobs,
    ignores: [
      "src/ui/**/*.{js,mjs,jsx,ts,tsx}", // the shared DS itself — wraps Mantine/raw elements
      "**/*.stories.{js,mjs,jsx,ts,tsx}", // stories may demo Mantine directly
      "**/*.test.{js,mjs,jsx,ts,tsx}", // tests may use raw elements as fixtures
    ],
    rules: {
      "no-restricted-syntax": ["error", ...sharedComponentSyntaxRestrictions],
    },
  },
  // Intentional exceptions: ARIA tablist tabs and sub-26px segmented header —
  // semantically not buttons; shared Button sizing can't represent them.
  // Do NOT add ordinary buttons here.
  {
    files: [
      "src/components/shared/FileSelectorPicker.tsx",
      "src/components/filesPage/FileManagerView.tsx",
      "src/pages/HomePage.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Stricter rules that not all sub-folders are conformant to yet.
  {
    files: srcGlobs,
    ignores: [
      "src/brain/**/*.{js,mjs,jsx,ts,tsx}",
      "src/components/annotation/**/*.{js,mjs,jsx,ts,tsx}",
      "src/components/pageEditor/*.{js,mjs,jsx,ts,tsx}",
      "src/components/pageEditor/commands/*.{js,mjs,jsx,ts,tsx}",
      "src/components/pageEditor/hooks/*.{js,mjs,jsx,ts,tsx}",
      "src/components/shared/*.{js,mjs,jsx,ts,tsx}",
      "src/components/shared/config/*.{js,mjs,jsx,ts,tsx}",
      "src/components/shared/config/configSections/*.{js,mjs,jsx,ts,tsx}",
      "src/components/shared/pageEditor/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/addStamp/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/automate/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/bookletImposition/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/certSign/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/pdfTextEditor/*.{js,mjs,jsx,ts,tsx}",
      "src/components/tools/shared/*.{js,mjs,jsx,ts,tsx}",
      "src/components/viewer/*.{js,mjs,jsx,ts,tsx}",
      "src/contexts/*.{js,mjs,jsx,ts,tsx}",
      "src/contexts/file/*.{js,mjs,jsx,ts,tsx}",
      "src/contexts/viewer/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/signing/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/tools/adjustContrast/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/tools/convert/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/tools/removePassword/*.{js,mjs,jsx,ts,tsx}",
      "src/hooks/tools/shared/*.{js,mjs,jsx,ts,tsx}",
      "src/services/*.{js,mjs,jsx,ts,tsx}",
      "src/tools/annotate/useAnnotationSelection.ts",
      "src/types/*.{js,mjs,jsx,ts,tsx}",
      "src/utils/*.{js,mjs,jsx,ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Config for browser scripts
  {
    files: srcGlobs,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Config for node scripts
  {
    files: nodeGlobs,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
