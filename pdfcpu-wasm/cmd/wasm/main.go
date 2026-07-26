package main

import (
	"syscall/js"
)

func main() {
	var apis = []struct {
		Name string
		ArgCount   int
		Fn   operation
	}{
		{"pdfcpuMerge", 2, merge},
		{"pdfcpuRotate", 1, rotate},
		{"pdfcpuOptimize", 1, optimize},
		{"pdfcpuCrop", 1, crop},
		{"pdfcpuValidateSignatures", 1, validate},
		{"pdfcpuEncrypt", 1, encrypt},
	}
	js.Global().Get("console").Call("log", "🚀 WASM RECOMPILADO E CARREGADO COM SUCESSO!")

	for _, value := range apis {
		js.Global().Set(value.Name, wrapOperation(value.Name, value.ArgCount, value.Fn))
	}
	select {}
}
