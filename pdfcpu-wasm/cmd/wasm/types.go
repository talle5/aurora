package main

import (
	"bytes"
	"io"
	"time"

	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

var magic = []byte{0x50, 0x43, 0x50, 0x55}

var mutableConf = model.Configuration{
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

type envelopeOperation func(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error

type Envelope struct {
	Files  [][]byte
	Params map[string]interface{}
}

type Api struct {
	Name     string
	ArgCount int
	MultiFile bool
	Fn       envelopeOperation
}