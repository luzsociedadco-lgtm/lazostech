#!/bin/bash

echo "=============================="
echo "🔍 NUDOS SUPPLY AUDIT"
echo "=============================="

if [ -z "$RPC_URL" ]; then
  echo "❌ RPC_URL no está seteado"
  exit 1
fi

TOTAL=$(cast call $NUDOS_TOKEN "totalSupply()(uint256)" --rpc-url $RPC_URL | cast to-dec)
DIAMOND_BAL=$(cast call $NUDOS_TOKEN "balanceOf(address)(uint256)" $DIAMOND --rpc-url $RPC_URL | cast to-dec)
LAZOS_BAL=$(cast call $NUDOS_TOKEN "balanceOf(address)(uint256)" $LAZOSTECH_WALLET --rpc-url $RPC_URL | cast to-dec)
USER_BAL=$(cast call $NUDOS_TOKEN "balanceOf(address)(uint256)" $USER_TEST --rpc-url $RPC_URL | cast to-dec)

# 👉 usar python para evitar overflow
SUM=$(python3 - <<EOF
print($DIAMOND_BAL + $LAZOS_BAL + $USER_BAL)
EOF
)

DIFF=$(python3 - <<EOF
print($TOTAL - $SUM)
EOF
)

echo ""
echo "📦 TOTAL SUPPLY: $TOTAL"
echo ""
echo "🏦 DIAMOND: $DIAMOND_BAL"
echo "🏢 LAZOSTECH: $LAZOS_BAL"
echo "👤 USER: $USER_BAL"
echo ""
echo "➕ SUMA: $SUM"
echo ""
echo "⚠️ DIFERENCIA: $DIFF"
echo ""
echo "=============================="
