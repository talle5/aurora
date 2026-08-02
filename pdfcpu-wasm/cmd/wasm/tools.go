package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

func merge(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	return api.MergeRaw(readers, out, false, baseConf())
}

func rotate(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	rotation := 90
	if r, ok := params["rotation"].(float64); ok {
		rotation = int(r)
	}
	if rotation%90 != 0 {
		return fmt.Errorf("rotação deve ser múltiplo de 90, recebeu %d", rotation)
	}

	return api.Rotate(readers[0], out, rotation, nil, baseConf())
}

func optimize(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	return api.Optimize(readers[0], out, baseConf())
}

func crop(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	var x, y, w, h float64
	if v, ok := params["x"].(float64); ok {
		x = v
	}
	if v, ok := params["y"].(float64); ok {
		y = v
	}
	if v, ok := params["width"].(float64); ok {
		w = v
	}
	if v, ok := params["height"].(float64); ok {
		h = v
	}
	crop_region := &model.Box{
		Rect: types.NewRectangle(x, y, x+w, y+h),
	}
	return api.Crop(readers[0], out, []string{"1-"}, crop_region, baseConf())
}

func validate(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	conf := baseConf()
	conf.Cmd = model.VALIDATESIGNATURES

	validateAll := false
	if v, ok := params["validateAll"].(bool); ok {
		validateAll = v
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

func encrypt(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	viewPass, _ := params["password"].(string)
	ownerPass, _ := params["ownerPassword"].(string)
	return Rencrypt(readers[0], out, viewPass, nil, ownerPass, nil)
}

func Rencrypt(readers io.ReadSeeker, out *bytes.Buffer, viewPass string, newviewPass *string, ownerPass string, newOwnerPass *string) error {
	conf := baseConf()
	conf.UserPW = viewPass
	conf.OwnerPW = ownerPass

	if newOwnerPass != nil && newviewPass != nil {
		conf.UserPWNew = newviewPass
		conf.OwnerPWNew = newOwnerPass
	}

	return api.Encrypt(readers, out, conf)
}

func UnlockForm(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	conf := baseConf()
	return api.UnlockFormFields(readers[0], out, nil, conf)
}

func Zoom(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	conf := baseConf()
	escala := params["escala"].(float64)
	zoom := model.Zoom{
		Factor: escala,
	}
	return api.Zoom(readers[0], out, nil, &zoom, conf)
}

func RemovePages(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	conf := baseConf()
	listOfPages := params[""].([]string)
	return api.RemovePages(readers[0], out, listOfPages, conf)
}

func RemoveSignatures(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	return api.RemoveSignatures(readers[0], out, baseConf())
}

func AddWatherMark(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	// paginas := params["paginas"].([]string)
	return api.AddWatermarksSliceMap(readers[0], out, nil, baseConf())
}

func extractImages(readers []io.ReadSeeker, params map[string]interface{}, out *bytes.Buffer) error {
	imagesPerPage, err := api.ExtractImagesRaw(readers[0], nil, baseConf())
	if err != nil {
		return err
	}

	var images [][]byte
	for _, pageImages := range imagesPerPage {
		for _, img := range pageImages {
			data, err := io.ReadAll(img)
			if err != nil {
				return err
			} 
			images = append(images, data)
		}
	}

	out.Write(encodeFileList(images)) // reusa o mesmo encoder de sempre
	return nil
}