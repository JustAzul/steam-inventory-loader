.PHONY: test build bench clean

test:
	npx vitest run

build:
	npx tsup

bench:
	node benchmarks/run.js

clean:
	rm -rf dist coverage .tsbuildinfo
