package main

import (
	"syscall/js"
)

type Api struct {
	Name     string
	ArgCount int
	Fn       envelopeOperation
}

func main() {
	apis := []Api{
		{"pdfcpuMerge", 2, merge},
		{"pdfcpuRotate", 1, rotate},
		{"pdfcpuOptimize", 1, optimize},
		{"pdfcpuCrop", 1, crop},
		{"pdfcpuValidateSignatures", 1, validate},
		{"pdfcpuEncrypt", 1, encrypt},
		{"pdfcpuUnlockForm", 1, UnlockForm},
		{"pdfcpuZoom", 1, Zoom},
		{"pdfcpuRemoveSignatures", 1, RemoveSignatures},
	}
	
	manifest := make(map[string]interface{})

	for _, value := range apis {
		manifest[value.Name] = value.ArgCount
		js.Global().Set(value.Name, wrapOperation(value.Name, value.ArgCount, value.Fn))
	}

	js.Global().Set("pdfcpuGetManifest", js.FuncOf(func(this js.Value, args []js.Value) any {
		return manifest
	}))

	js.Global().Get("console").Call("log", "🚀 WASM RECOMPILADO E CARREGADO COM SUCESSO!")

	select {}
}