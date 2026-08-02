package main

import (
	"syscall/js"
)

func main() {
	apis := []Api{
		{"pdfcpuMerge", 2, false, merge},
		{"pdfcpuRotate", 1, false, rotate},
		{"pdfcpuOptimize", 1, false, optimize},
		{"pdfcpuCrop", 1, false, crop},
		{"pdfcpuValidateSignatures", 1, false, validate},
		{"pdfcpuEncrypt", 1, false, encrypt},
		{"pdfcpuUnlockForm", 1, false, UnlockForm},
		{"pdfcpuZoom", 1, false, Zoom},
		{"pdfcpuRemoveSignatures", 1, false, RemoveSignatures},
		{"pdfcpuRemovePages", 1, false, RemovePages},
		{"pdfcpuextractImages", 1, true, extractImages},
	}

	manifest := make(map[string]interface{})

	for _, value := range apis {
		manifest[value.Name] = value.ArgCount
		js.Global().Set(value.Name, wrapOperation(value.Name, value.ArgCount, value.MultiFile, value.Fn))
	}

	js.Global().Set("pdfcpuGetManifest", js.FuncOf(func(this js.Value, args []js.Value) any {
		return manifest
	}))

	js.Global().Get("console").Call("log", "🚀 WASM RECOMPILADO E CARREGADO COM SUCESSO!")

	select {}
}
