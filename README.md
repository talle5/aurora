# Aurora

Editor e suíte de ferramentas PDF **100% client-side**, construído sobre a base de interface do [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) com processamento de documentos executado localmente no navegador via **WebAssembly (Go + `pdfcpu`)**, além de engines nativas em JavaScript/TypeScript.

---

## Visão Geral

O **Aurora** elimina a dependência de um backend Java/Spring tradicional para operações de PDF, movendo o processamento para o cliente através de um módulo Go compilado para WebAssembly (`pdfcpu-merge.wasm`) e integrado ao frontend React por uma camada de comunicação binária em [`src/brain/`](src/brain/).

### Principais características

- **Processamento local via WebAssembly**: manipulação de PDFs diretamente no navegador usando `pdfcpu` compilado em Go WASM, sem envio de arquivos para servidores externos.
- **Protocolo binário JS ↔ Go WASM**: comunicação via envelope binário (`MAGIC: PCPU` em [`src/brain/utils.ts`](src/brain/utils.ts)) para tráfego eficiente de buffers `Uint8Array[]` e parâmetros JSON.
- **Visualização e edição avançada**: integração com `@embedpdf/*`, `pdfjs-dist` e `@cantoo/pdf-lib` para renderização, anotações, redação, miniaturas, busca e assinatura.
- **Arquitetura modular por aliases**: código-base em `src/` utilizando o path alias `@app/*` conforme documentado em [`docs/DeveloperGuide.md`](docs/DeveloperGuide.md).
- **Suporte a Desktop (Tauri 2)**: empacotamento opcional via Tauri em `src-tauri/`.

---

## Ferramentas Disponíveis via WASM (`pdfcpu`)

As operações abaixo são expostas dinamicamente pelo manifesto do módulo Go (`pdfcpuGetManifest`) em [`src/brain/wasm.ts`](src/brain/wasm.ts) e consumidas pelos hooks em `src/hooks/tools/`:

| Operação | Método no Engine | Hook de Operação |
| --- | --- | --- |
| Unir PDFs | `merge` | `useMergeOperation` |
| Girar páginas | `rotate` | `useRotateOperation` |
| Comprimir / Otimizar | `optimize` | `useCompressOperation` |
| Recortar páginas | `crop` | `useCropOperation` |
| Ajustar escala de página | `zoom` | `useAdjustPageScaleOperation` |
| Imposição de livreto | `booklet` | `useBookletImpositionOperation` |
| Adicionar marca d'água | `addWaterMark` | `useAddWatermarkOperation` |
| Proteger com senha | `encrypt` | `useAddPasswordOperation` |
| Remover senha | `removePassword` | `useRemovePasswordOperation` |
| Desbloquear formulários | `unlockForm` | `useUnlockPdfFormsOperation` |
| Remover páginas | `removePages` | `useRemovePagesOperation` |
| Extrair imagens | `extractImages` | `useExtractImagesOperation` |
| Informações do PDF | `getInfo` | `useGetPdfInfoOperation` |
| Validar assinaturas | `validateSignatures` | `useValidateSignatureOperation` |
| Remover assinatura de certificado | `removeSignatures` | `useRemoveCertificateSignOperation` |

---

## Stack Tecnológica

- **Frontend**: React 19, TypeScript, Vite 7, React Router 7
- **UI & Estilo**: Mantine 8, Tailwind CSS 4, Material UI, Iconify
- **PDF & WASM**: Go WebAssembly (`pdfcpu-wasm`), `@embedpdf/*`, `@cantoo/pdf-lib`, `pdfjs-dist`
- **Internacionalização**: `i18next` / `react-i18next` (com backend TOML)
- **Desktop**: Tauri 2 (`src-tauri/`)
- **Qualidade & Testes**: Vitest, Testing Library, Playwright, Storybook, ESLint, Prettier

---

## Estrutura do Repositório

```text
aurora/
├── docs/                       # Guias de arquitetura e documentação (DeveloperGuide.md)
├── pdfcpu-wasm/                # Módulo Go/WASM do pdfcpu (fonte + pdfcpu-merge.wasm + wasm_exec.js)
├── public/                     # Assets estáticos, locales, samples e vendor
├── scripts/                    # Scripts auxiliares (ícones, licenças, OG, lint de tema)
├── src/
│   ├── assets/                 # Ícones gerados, licenças e assets de marca/login
│   ├── brain/                  # Ponte JS <-> Go WASM (loader, envelope binário, engine)
│   ├── components/             # Componentes de UI, visualizador, chat e ferramentas
│   ├── constants/              # Constantes da aplicação
│   ├── contexts/               # Contextos React (arquivos, viewer, ferramentas, etc.)
│   ├── data/                   # Registro e taxonomia das ferramentas
│   ├── hooks/                  # Hooks das ferramentas e operações PDF
│   ├── i18n/                   # Auditoria e testes de internacionalização
│   ├── pages/                  # Páginas da aplicação
│   ├── platform/               # Abstrações de plataforma
│   ├── services/               # Serviços (IndexedDB, PDFium, etc.)
│   ├── styles/                 # Estilos globais
│   ├── testing/                # Setup e utilitários de testes unitários
│   ├── theme/                  # Primitives e tokens de tema
│   ├── tools/                  # Definições e lógica das ferramentas
│   ├── types/                  # Tipos TypeScript
│   ├── ui/                     # Design system compartilhado
│   ├── utils/                  # Utilitários
│   ├── workers/                # Web Workers
│   ├── App.tsx
│   └── index.tsx
├── src-tauri/                  # Configuração e código Rust do wrapper Tauri 2
├── tests/
│   └── e2e/                    # Testes E2E (Playwright) e fixtures
├── eslint.config.mjs           # Configuração do ESLint
├── package.json                # Dependências e scripts na raiz
├── playwright.config.ts        # Configuração de testes E2E
├── tsconfig.json               # Configuração única do TypeScript (@app/* -> ./src/*)
├── vite.config.ts              # Configuração do Vite (build, cópia do WASM, compressão, OG)
└── vitest.config.ts            # Configuração de testes unitários
```

---

## Primeiros Passos

### Pré-requisitos

- **Node.js** (compatível com Vite 7 / TypeScript) e **npm**
- **Git** (para clonar o submódulo `pdfcpu-wasm`, caso vá recompilar o WASM)
- **Go** *(opcional, apenas para recompilar o módulo `pdfcpu-wasm`)*
- **Rust / Cargo** *(opcional, apenas para builds desktop com Tauri)*

### Instalação

1. Clone o repositório com seus submódulos:

   ```bash
   git clone --recurse-submodules https://github.com/talle5/aurora.git
   cd aurora
   ```

   Se já clonou sem os submódulos, inicialize-os com:

   ```bash
   git submodule update --init --recursive
   ```

2. Instale as dependências Node na raiz do repositório:

   ```bash
   npm install
   ```

### Executando em Desenvolvimento

Para subir o servidor de desenvolvimento Vite (os arquivos de `pdfcpu-wasm/` são servidos automaticamente em `/wasm/` pelo `vite-plugin-static-copy`):

```bash
npm run dev
```

Para recompilar o binário Go WebAssembly (`pdfcpu-wasm/pdfcpu-merge.wasm`):

```bash
npm run wasm:build
```

### Build de Produção

```bash
npm run build
npm run preview
```

---

## Testes, Lint e Qualidade

Execute diretamente da raiz do repositório:

```bash
# Typecheck
npm run typecheck

# Testes unitários (Vitest)
npm test

# Testes E2E (Playwright - suite stubbed)
npm run test:e2e

# Lint e tema
npm run lint
npm run lint:theme
npm run format:check
```

---

## Build Desktop (Tauri)

```bash
npm run tauri:dev
npm run tauri:build
```

---

## Documentação Adicional

- [`docs/DeveloperGuide.md`](docs/DeveloperGuide.md) — Convenções de arquitetura do frontend, alias `@app` e criação de módulos.

---

## Licença

Consulte o campo `license` em [`package.json`](package.json) e o arquivo [`LICENCE`](LICENCE).
