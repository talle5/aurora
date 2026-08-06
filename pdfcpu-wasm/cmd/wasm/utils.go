package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"runtime/debug"
	"syscall/js"

	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
)

func baseConf() *model.Configuration {
	conf := mutableConf
	return &conf
}

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

func bytesToReaders(files [][]byte) []io.ReadSeeker {
	readers := make([]io.ReadSeeker, len(files))
	for i, f := range files {
		readers[i] = bytes.NewReader(f)
	}
	return readers
}

func parseInput(args []js.Value, minFiles int) (*Envelope, error) {
	if len(args) < 1 {
		return nil, errors.New("esperado 1 argumento (envelope)")
	}

	jsBuf := args[0]
	rawEnvelope := make([]byte, jsBuf.Get("length").Int())
	js.CopyBytesToGo(rawEnvelope, jsBuf)

	envelope, err := decodeEnvelope(rawEnvelope)
	if err != nil {
		return nil, err
	}

	if len(envelope.Files) < minFiles {
		return nil, fmt.Errorf("são necessários pelo menos %d arquivo(s)", minFiles)
	}

	return envelope, nil
}

func wrapOperation(name string, minFiles int, multiFile bool, fn envelopeOperation) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		return jsPromise(func(resolve, reject js.Value) {
			defer func() {
				if r := recover(); r != nil {
					debug.PrintStack()
					reject.Invoke(fmt.Sprintf("%s: panic recuperado: %v", name, r))
				}
			}()

			envelope, err := parseInput(args, minFiles)
			if err != nil {
				reject.Invoke(fmt.Sprintf("%s: %v", name, err))
				return
			}

			var out bytes.Buffer
			if err := fn(bytesToReaders(envelope.Files), envelope.Params, &out); err != nil {
				reject.Invoke(fmt.Sprintf("%s: %v", name, err))
				return
			}

			var fileList []byte
			if multiFile {
				fileList = out.Bytes() // já é uma lista pronta, só usa direto
			} else {
				fileList = encodeFileList([][]byte{out.Bytes()}) // embrulha o único resultado
			}

			outBytes := wrapWithMagicAndParams(fileList) // adiciona magic+paramsLen no envelope final
			jsResult := js.Global().Get("Uint8Array").New(len(outBytes))
			js.CopyBytesToJS(jsResult, outBytes)
			resolve.Invoke(jsResult)
		})
	})
}

func decodeEnvelope(buf []byte) (*Envelope, error) {
	if len(buf) < 8 || string(buf[:4]) != string(magic) {
		return nil, errors.New("envelope inválido: magic bytes não batem")
	}
	offset := 4

	fileCount := binary.LittleEndian.Uint32(buf[offset:])
	offset += 4

	files := make([][]byte, fileCount)
	for i := uint32(0); i < fileCount; i++ {
		if offset+4 > len(buf) {
			return nil, fmt.Errorf("envelope truncado no arquivo %d", i)
		}
		length := binary.LittleEndian.Uint32(buf[offset:])
		offset += 4
		if offset+int(length) > len(buf) {
			return nil, fmt.Errorf("envelope truncado: arquivo %d declara %d bytes além do buffer", i, length)
		}
		files[i] = buf[offset : offset+int(length)]
		offset += int(length)
	}

	if offset+4 > len(buf) {
		return nil, errors.New("envelope truncado nos parâmetros")
	}
	paramsLen := binary.LittleEndian.Uint32(buf[offset:])
	offset += 4

	var params map[string]interface{}
	if paramsLen > 0 {
		if err := json.Unmarshal(buf[offset:offset+int(paramsLen)], &params); err != nil {
			return nil, fmt.Errorf("params JSON inválido: %w", err)
		}
	}

	return &Envelope{Files: files, Params: params}, nil
}

func encodeFileList(files [][]byte) []byte {
	totalSize := 4
	for _, f := range files {
		totalSize += 4 + len(f)
	}
	buf := make([]byte, 0, totalSize)
	buf = binary.LittleEndian.AppendUint32(buf, uint32(len(files)))
	for _, f := range files {
		buf = binary.LittleEndian.AppendUint32(buf, uint32(len(f)))
		buf = append(buf, f...)
	}
	return buf
}

// fecha o envelope completo — magic + (fileList já pronto) + params
func wrapWithMagicAndParams(fileListBytes []byte) []byte {
	paramsBytes := []byte("{}")
	buf := make([]byte, 0, len(magic)+len(fileListBytes)+4+len(paramsBytes))
	buf = append(buf, magic...)
	buf = append(buf, fileListBytes...)
	buf = binary.LittleEndian.AppendUint32(buf, uint32(len(paramsBytes)))
	buf = append(buf, paramsBytes...)
	return buf
}