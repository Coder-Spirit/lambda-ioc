#!/bin/sh

tsc -p ./tsconfig.esm.json \
&& ts-node ./scripts/adaptESM.ts
