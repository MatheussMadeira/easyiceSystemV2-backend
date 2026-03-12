const xlsx = require("xlsx");

const workbook = xlsx.readFile("./dados.xlsx", { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
// Lemos sem range fixo primeiro para ver o arquivo bruto
const rawData = xlsx.utils.sheet_to_json(sheet, { range: 4, defval: null });

console.log(`\n📊 ANALISANDO ${rawData.length} LINHAS TOTAIS DO EXCEL...`);

let numerosVistos = new Set();
let duplicados = [];
let semNumero = 0;
let semDataAbertura = [];
let validos = [];
let colunasEncontradas = Object.keys(rawData[0] || {});

rawData.forEach((item, index) => {
  const linhaPlanilha = index + 6; // Ajuste para bater com a linha real do Excel
  const numero = item["Número"];
  const dataAbertura = item["Data de abertura"];

  // CASO 1: Linha sem número (O "buraco" mais comum)
  if (numero === null || numero === undefined || String(numero).trim() === "") {
    semNumero++;
    // Se a linha tem solicitante mas não tem número, avisamos
    if (item["Solicitante"]) {
      console.log(
        `⚠️ Linha ${linhaPlanilha}: Tem dados (Solicitante: ${item["Solicitante"]}), mas o campo 'Número' está VAZIO.`
      );
    }
    return;
  }

  const numStr = String(numero).trim();

  // CASO 2: Sem data de abertura (O Mongoose rejeita)
  if (!dataAbertura) {
    semDataAbertura.push({ os: numStr, linha: linhaPlanilha });
    return;
  }

  // CASO 3: Duplicado
  if (numerosVistos.has(numStr)) {
    duplicados.push({ os: numStr, linha: linhaPlanilha });
    return;
  }

  numerosVistos.add(numStr);
  validos.push(numStr);
});

console.log("\n--- 🔎 RESULTADO DETALHADO ---");
console.log(`✅ OS Válidas para importação: ${validos.length}`);
console.log(`👻 Linhas "Fantasmas" (Sem número de OS): ${semNumero}`);
console.log(`👯 Duplicadas ignoradas: ${duplicados.length}`);
duplicados.forEach((d) =>
  console.log(`   -> OS ${d.os} na linha ${d.linha} (já apareceu antes)`)
);

console.log(`📅 Sem Data de Abertura: ${semDataAbertura.length}`);
semDataAbertura.forEach((s) =>
  console.log(`   -> OS ${s.os} na linha ${s.linha} está sem data.`)
);

console.log("\n📋 COLUNAS IDENTIFICADAS NO EXCEL:");
console.log(colunasEncontradas.join(" | "));

const totalMapeado =
  validos.length + duplicados.length + semDataAbertura.length + semNumero;
console.log(
  `\nSoma total verificada: ${totalMapeado} de ${rawData.length} linhas.`
);

if (totalMapeado !== rawData.length) {
  console.log(
    "❗ Ainda há uma diferença. Algumas linhas podem ser nulas ou o cabeçalho mudou."
  );
}
