const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/planilha-tavares.csv");
const text = fs.readFileSync(filePath);
const wb = XLSX.read(text, { type: "buffer", raw: false, FS: ";" });
const matrix = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: null,
  blankrows: false,
});

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

let headerRow = -1;
for (let r = 0; r < 10; r++) {
  if (normalizeHeader(matrix[r]?.[0]) === "produto") {
    headerRow = r;
    break;
  }
}

const dataStart = headerRow + 2;
let products = 0;
let withPrice = 0;

for (let i = dataStart; i < matrix.length; i++) {
  const name = String(matrix[i][0] ?? "").trim();
  if (!name) continue;
  products++;
  const net = matrix[i][16];
  if (net !== null && net !== "") withPrice++;
}

console.log("Header row:", headerRow);
console.log("Data start:", dataStart);
console.log("Products:", products);
console.log("With price col 16:", withPrice);
