all: dev

clean:
	rm -rf ./src/pdfium.js ./src/pdfium.wasm ./src/pdfium.cjs

.PHONY: build
build:
	make clean
	docker buildx build -o docker .
