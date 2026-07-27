package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
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

type envelopeOperation func(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error

func bytesToReaders(files [][]byte) []io.ReadSeeker {
	readers := make([]io.ReadSeeker, len(files))
	for i, f := range files {
		readers[i] = bytes.NewReader(f)
	}
	return readers
}

func wrapOperation(name string, minFiles int, fn envelopeOperation) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return jsPromise(func(resolve, reject js.Value) {
			defer func() {
				if r := recover(); r != nil {
					reject.Invoke(fmt.Sprintf("%s: panic recuperado: %v", name, r))
				}
			}()

			if len(args) < 1 {
				reject.Invoke(fmt.Sprintf("%s: esperado 1 argumento (envelope)", name))
				return
			}

			jsBuf := args[0]
			length := jsBuf.Get("length").Int()
			rawEnvelope := make([]byte, length)
			js.CopyBytesToGo(rawEnvelope, jsBuf)

			envelope, err := decodeEnvelope(rawEnvelope)
			if err != nil {
				reject.Invoke(fmt.Sprintf("%s: %v", name, err))
				return
			}

			if len(envelope.Files) < minFiles {
				reject.Invoke(fmt.Sprintf("%s: são necessários pelo menos %d arquivo(s)", name, minFiles))
				return
			}
			readers := bytesToReaders(envelope.Files)
			out := bytes.NewBuffer(make([]byte, 0))
			err = fn(readers, envelope.Params, out)
			if err != nil {
				reject.Invoke(fmt.Sprintf("%s falhou: %v", name, err))
				return
			}

			outEnvelope := encodeEnvelope(out.Bytes())
			jsResult := js.Global().Get("Uint8Array").New(len(outEnvelope))
			js.CopyBytesToJS(jsResult, outEnvelope)
			resolve.Invoke(jsResult)
		})
	})
}

var magic = []byte{0x50, 0x43, 0x50, 0x55}

type Envelope struct {
	Files  [][]byte
	Params map[string]interface{}
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

func encodeEnvelope(result []byte) []byte {
	// resultado de saída: 1 arquivo só, sem params — envelope simplificado
	paramsBytes := []byte("{}")
	buf := make([]byte, 0, 4+4+4+len(result)+4+len(paramsBytes))

	buf = append(buf, magic...)
	buf = binary.LittleEndian.AppendUint32(buf, 1) // fileCount = 1

	buf = binary.LittleEndian.AppendUint32(buf, uint32(len(result)))
	buf = append(buf, result...)

	buf = binary.LittleEndian.AppendUint32(buf, uint32(len(paramsBytes)))
	buf = append(buf, paramsBytes...)

	return buf
}
