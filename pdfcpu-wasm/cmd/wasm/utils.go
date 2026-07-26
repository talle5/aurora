package main

import (
	"bytes"
	"fmt"
	"io"
	"syscall/js"
	"time"

	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

func baseConf() *model.Configuration {
	return &model.Configuration{
		CreationDate:                    time.Now().Format("2006-01-02 15:04"),
		Version:                         "",
		CheckFileNameExt:                true,
		Reader15:                        true,
		DecodeAllStreams:                false,
		ValidationMode:                  1,
		ValidateLinks:                   false,
		Eol:                             types.EolLF,
		WriteObjectStream:               true,
		WriteXRefStream:                 true,
		EncryptUsingAES:                 true,
		EncryptKeyLength:                256,
		Permissions:                     63687,
		TimestampFormat:                 "2006-01-02 15:04",
		DateFormat:                      "2006-01-02",
		Optimize:                        true,
		OptimizeBeforeWriting:           true,
		OptimizeResourceDicts:           true,
		OptimizeDuplicateContentStreams: false,
		CreateBookmarks:                 true,
		MergeBookmarkMode:               "wrap",
		NeedAppearances:                 false,
		Offline:                         false,
		Timeout:                         5,
		PreferredCertRevocationChecker:  0,
		FormFieldListMaxColWidth:        0,
		Limits:                          model.DefaultResourceLimits(),
	}
}

type operation func(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error


func jsPromise(fn func(resolve, reject js.Value)) js.Value {
	var handler js.Func
	handler = js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		defer handler.Release()

		resolve := args[0]
		reject := args[1]
		go fn(resolve, reject)
		return nil
	})
	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

func wrapOperation(name string, minFiles int, fn operation) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return jsPromise(func(resolve, reject js.Value) {
			defer func() {
				if r := recover(); r != nil {
					js.Global().Get("console").Call("error", fmt.Sprintf("%s: panic recuperado: %v", name, r))
					reject.Invoke()
				}
			}()

			// if len(args) < 1 {
			// 	reject.Invoke(fmt.Sprintf("%s: esperado ao menos 1 argumento", name))
			// 	return
			// }

			jsFiles := args[0]
			count := jsFiles.Length()
			// if count < minFiles {
			// 	reject.Invoke(fmt.Sprintf("%s: são necessários pelo menos %d arquivo(s)", name, minFiles))
			// 	return
			// }

			readers := make([]io.ReadSeeker, count)
			for i := 0; i < count; i++ {
				jsBuf := jsFiles.Index(i)
				length := jsBuf.Get("length").Int()
				buf := make([]byte, length)
				js.CopyBytesToGo(buf, jsBuf)
				readers[i] = bytes.NewReader(buf)
			}

			out := &bytes.Buffer{}
			if err := fn(readers, out, args[1:]); err != nil {
				reject.Invoke(fmt.Sprintf("%s falhou: %v", name, err))
				return
			}

			result := out.Bytes()
			jsResult := js.Global().Get("Uint8Array").New(len(result))
			js.CopyBytesToJS(jsResult, result)
			resolve.Invoke(jsResult)
		})
	})
}