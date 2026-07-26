package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"syscall/js"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

func merge(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	return api.MergeRaw(readers, out, false, baseConf())
}

func rotate(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	rotation := 90
	if len(extra) > 0 && !extra[0].IsUndefined() && !extra[0].IsNull() {
		rotation = extra[0].Int()
	}
	if rotation%90 != 0 {
		return fmt.Errorf("rotação deve ser múltiplo de 90, recebeu %d", rotation)
	}
	return api.Rotate(readers[0], out, rotation, nil, baseConf())
}

func optimize(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	return api.Optimize(readers[0], out, baseConf())
}

func crop(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	jsObj := extra[0]
	x := jsObj.Get("x").Float()
	y := jsObj.Get("y").Float()
	w := jsObj.Get("width").Float()
	h := jsObj.Get("height").Float()
	crop_region := &model.Box{
		Rect: types.NewRectangle(x, y, x+w, y+h),
	}
	return api.Crop(readers[0], out, []string{"1-"}, crop_region, baseConf())
}

func validate(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	conf := baseConf()
	conf.Cmd = model.VALIDATESIGNATURES

	validateAll := false
	if len(extra) > 0 && !extra[0].IsUndefined() && !extra[0].IsNull() {
		validateAll = extra[0].Bool()
	}

	if err := pdfcpu.LoadCertificates(); err != nil {
		return fmt.Errorf("erro ao carregar certificados: %v", err)
	}

	f := readers[0]
	fAt, ok := f.(io.ReaderAt)
	if !ok {
		return fmt.Errorf("arquivo não suporta leitura aleatória (io.ReaderAt)")
	}

	ctx, err := api.ReadContext(f, conf)
	if err != nil {
		return err
	}
	if err := api.ValidateContext(ctx); err != nil {
		return err
	}
	if err := api.OptimizeContext(ctx); err != nil {
		return err
	}

	if len(ctx.Signatures) == 0 && !ctx.SignatureExist && !ctx.AppendOnly {
		out.Write([]byte("[]"))
		return nil
	}

	results, err := pdfcpu.ValidateSignatures(fAt, ctx, validateAll)
	if err != nil {
		return err
	}

	jsonBytes, err := json.Marshal(results)
	if err != nil {
		return fmt.Errorf("falha ao serializar JSON: %v", err)
	}

	out.Write(jsonBytes)
	return nil
}

func encrypt(readers []io.ReadSeeker, out *bytes.Buffer, extra []js.Value) error {
	conf := baseConf()
	// if extra[0].IsNull() || extra[0].IsUndefined() {
	// 	js.Global().Get("console").Call("error", "problemas")
	// 	return nil
	// }
	viewPass := extra[0].String()
	owberPass := extra[1].String()
	conf.UserPW = viewPass
	conf.UserPWNew = &viewPass
	conf.OwnerPW = owberPass
	conf.OwnerPWNew = &owberPass
	err := api.Encrypt(readers[0], out, conf)
	if err != nil {
		js.Global().Get("console").Call("error", "problemas")
		return err
	}
	return nil
}
