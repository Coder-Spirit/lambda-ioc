#!/bin/sh

mkdir -p ./deno \
&& cp -r ./src/* ./deno/ \
&& rm -rf ./deno/__tests__ \
&& ts-node ./scripts/adaptDeno.ts
