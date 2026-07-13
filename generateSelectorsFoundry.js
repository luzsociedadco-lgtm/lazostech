// generateSelectorsFoundry.js
import fs from "fs";
import path from "path";
import { execFileSync } from "node:child_process";

const FACETS_DIR = path.join(process.cwd(), "src/facets");
const OUT_FILE = path.join(process.cwd(), "selectors_output.sol");

let output = `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.30;\n\n`;

// Filtramos solo archivos .sol y saltamos directorios
const facetFiles = fs.readdirSync(FACETS_DIR, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith(".sol"))
    .map(f => f.name);

for (const file of facetFiles) {
    const filePath = path.join(FACETS_DIR, file);
    const source = fs.readFileSync(filePath, "utf8");

    // Detectamos el nombre del contrato
    const contractMatch = source.match(/contract\s+(\w+)/);
    if (!contractMatch) continue;
    const contractName = contractMatch[1];

    // Ejecutamos forge inspect con --json
    let abiJson;
    try {
        const abiRaw = execFileSync("forge", ["inspect", filePath, "abi", "--json"], {
            encoding: "utf-8",
        });
        abiJson = JSON.parse(abiRaw);
    } catch (err) {
        console.warn(`⚠️  No se pudo inspeccionar ${contractName}: ${err.message}`);
        continue;
    }

    const functions = abiJson.filter(item =>
        item.type === "function" &&
        (item.stateMutability === "nonpayable" || item.stateMutability === "view" || item.stateMutability === "pure")
    );

    output += `function get${contractName}Selectors() internal pure returns (bytes4[] memory selectors) {\n`;
    output += `    selectors = new bytes4[](${functions.length});\n`;
    functions.forEach((fn, idx) => {
        output += `    selectors[${idx}] = ${contractName}.${fn.name}.selector;\n`;
    });
    output += `}\n\n`;
}


fs.writeFileSync(OUT_FILE, output);
console.log(`✅ Selectors generados en ${OUT_FILE}`);
