.PHONY: test build bench clean

test:
	npx vitest run

build:
	npx tsup

bench: build
	node --expose-gc benchmarks/run.js

clean:
	rm -rf dist coverage .tsbuildinfo
