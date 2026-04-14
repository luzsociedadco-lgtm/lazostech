#!/bin/bash

START=39275000
END=39277200
STEP=10

echo "🔍 Scanning transfers from DIAMOND..."

for ((i=$START; i<$END; i+=$STEP))
do
  FROM_BLOCK=$i
  TO_BLOCK=$((i+STEP-1))

  echo "Checking blocks $FROM_BLOCK → $TO_BLOCK"

  cast logs \
  --address $NUDOS_TOKEN \
  --from-block $FROM_BLOCK \
  --to-block $TO_BLOCK \
  "Transfer(address,address,uint256)" \
  --rpc-url $RPC_URL 2>/dev/null | grep -i 23433c04

done
