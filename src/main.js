import JsBarcode from "jsbarcode";
import { createIcons, Copy, Download, FileDown, RotateCcw, Rows3 } from "lucide";
import "./styles.css";
import { completeOrValidateEan13, parseBatchLines } from "./ean13.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">Salida vectorial para Illustrator</p>
      <h1>Generador EAN-13 SVG</h1>
      <p class="intro">Crea codigos EAN-13 limpios, validos y listos para importar en programas de diseno.</p>
    </div>
  </header>

  <main class="workspace">
    <section class="control-panel" aria-labelledby="single-title">
      <div class="panel-heading">
        <div>
          <p class="section-kicker">Individual</p>
          <h2 id="single-title">Codigo principal</h2>
        </div>
        <button class="icon-button" type="button" id="resetButton" aria-label="Restablecer formulario" title="Restablecer">
          <i data-lucide="rotate-ccw" aria-hidden="true"></i>
        </button>
      </div>

      <form class="form-grid" id="barcodeForm">
        <label class="field">
          <span>Numero EAN-13</span>
          <input id="codeInput" inputmode="numeric" autocomplete="off" maxlength="24" value="7462842912010" />
          <small>Usa 12 digitos para calcular el verificador o 13 para validarlo.</small>
        </label>

        <label class="field">
          <span>Nombre de archivo</span>
          <input id="fileNameInput" autocomplete="off" value="ean13-7462842912010" />
        </label>

        <div class="range-row">
          <label class="field">
            <span>Ancho barra</span>
            <input id="barWidthInput" type="number" min="1" max="5" step="0.25" value="2" />
          </label>
          <label class="field">
            <span>Alto</span>
            <input id="heightInput" type="number" min="48" max="220" step="1" value="110" />
          </label>
          <label class="field">
            <span>Margen</span>
            <input id="marginInput" type="number" min="0" max="80" step="1" value="12" />
          </label>
        </div>

        <div class="toggle-row">
          <label class="toggle">
            <input id="displayValueInput" type="checkbox" checked />
            <span>Mostrar numeros</span>
          </label>
          <label class="toggle">
            <input id="transparentInput" type="checkbox" checked />
            <span>Fondo transparente</span>
          </label>
        </div>
      </form>

      <div class="status" id="statusMessage" role="status" aria-live="polite"></div>

      <div class="actions">
        <button class="primary-action" type="button" id="downloadButton">
          <i data-lucide="download" aria-hidden="true"></i>
          Descargar SVG
        </button>
        <button type="button" id="copyButton">
          <i data-lucide="copy" aria-hidden="true"></i>
          Copiar SVG
        </button>
      </div>
    </section>

    <section class="preview-panel" aria-labelledby="preview-title">
      <div class="panel-heading">
        <div>
          <p class="section-kicker">Vista previa</p>
          <h2 id="preview-title">Vector generado</h2>
        </div>
        <output id="finalCodeOutput" class="code-pill">7462842912010</output>
      </div>
      <div class="barcode-stage">
        <svg id="barcodeSvg" role="img" aria-label="Codigo de barras EAN-13 generado"></svg>
      </div>
    </section>

    <section class="batch-panel" aria-labelledby="batch-title">
      <div class="panel-heading">
        <div>
          <p class="section-kicker">Lote</p>
          <h2 id="batch-title">Hoja SVG con varios codigos</h2>
        </div>
        <i data-lucide="rows-3" aria-hidden="true"></i>
      </div>

      <label class="field">
        <span>Un codigo por linea</span>
        <textarea id="batchInput" rows="5" spellcheck="false">7462842912010, 800 gramos
7462842912010, 2200 gramos</textarea>
        <small>Puedes separar la etiqueta con coma, punto y coma o tabulador.</small>
      </label>

      <div class="batch-summary" id="batchSummary"></div>

      <div class="actions">
        <button type="button" id="downloadSheetButton">
          <i data-lucide="file-down" aria-hidden="true"></i>
          Descargar hoja SVG
        </button>
      </div>
    </section>
  </main>
`;

createIcons({ icons: { Copy, Download, FileDown, RotateCcw, Rows3 } });

const elements = {
  form: document.querySelector("#barcodeForm"),
  codeInput: document.querySelector("#codeInput"),
  fileNameInput: document.querySelector("#fileNameInput"),
  barWidthInput: document.querySelector("#barWidthInput"),
  heightInput: document.querySelector("#heightInput"),
  marginInput: document.querySelector("#marginInput"),
  displayValueInput: document.querySelector("#displayValueInput"),
  transparentInput: document.querySelector("#transparentInput"),
  statusMessage: document.querySelector("#statusMessage"),
  finalCodeOutput: document.querySelector("#finalCodeOutput"),
  barcodeSvg: document.querySelector("#barcodeSvg"),
  downloadButton: document.querySelector("#downloadButton"),
  copyButton: document.querySelector("#copyButton"),
  resetButton: document.querySelector("#resetButton"),
  batchInput: document.querySelector("#batchInput"),
  batchSummary: document.querySelector("#batchSummary"),
  downloadSheetButton: document.querySelector("#downloadSheetButton"),
};

function getBarcodeOptions() {
  return {
    format: "EAN13",
    width: Number(elements.barWidthInput.value),
    height: Number(elements.heightInput.value),
    margin: Number(elements.marginInput.value),
    displayValue: elements.displayValueInput.checked,
    font: "Arial",
    fontSize: 18,
    textMargin: 4,
    lineColor: "#111111",
    background: elements.transparentInput.checked ? "transparent" : "#ffffff",
  };
}

function renderBarcode(targetSvg, code, options = getBarcodeOptions()) {
  targetSvg.innerHTML = "";
  JsBarcode(targetSvg, code, options);
  targetSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return targetSvg;
}

function serializeSvg(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function safeFileName(value) {
  return String(value || "ean13")
    .trim()
    .replace(/\.svg$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function downloadTextFile(fileName, content, mimeType = "image/svg+xml;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateSinglePreview() {
  const result = completeOrValidateEan13(elements.codeInput.value);
  elements.finalCodeOutput.value = result.value || "Pendiente";
  elements.finalCodeOutput.textContent = result.value || "Pendiente";
  elements.statusMessage.textContent = result.message;
  elements.statusMessage.dataset.state = result.ok ? "ok" : "error";
  elements.downloadButton.disabled = !result.ok;
  elements.copyButton.disabled = !result.ok;

  if (!result.ok) {
    elements.barcodeSvg.innerHTML = "";
    return;
  }

  try {
    renderBarcode(elements.barcodeSvg, result.value);
  } catch (error) {
    elements.statusMessage.textContent = error.message;
    elements.statusMessage.dataset.state = "error";
    elements.downloadButton.disabled = true;
    elements.copyButton.disabled = true;
  }
}

function updateBatchSummary() {
  const rows = parseBatchLines(elements.batchInput.value);
  const validCount = rows.filter((row) => row.ok).length;
  const invalidCount = rows.length - validCount;

  elements.batchSummary.innerHTML = `
    <span>${validCount} validos</span>
    <span>${invalidCount} con error</span>
  `;
  elements.downloadSheetButton.disabled = validCount === 0;
}

function buildBarcodeFragment(code) {
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  renderBarcode(tempSvg, code, getBarcodeOptions());
  return {
    width: readSvgDimension(tempSvg, "width"),
    height: readSvgDimension(tempSvg, "height"),
    content: tempSvg.innerHTML,
  };
}

function buildSheetSvg() {
  const rows = parseBatchLines(elements.batchInput.value).filter((row) => row.ok);
  if (rows.length === 0) {
    return "";
  }

  const gap = 34;
  const labelHeight = 28;
  const padding = 24;
  const fragments = rows.map((row) => ({ ...row, fragment: buildBarcodeFragment(row.code) }));
  const maxWidth = Math.max(...fragments.map((item) => item.fragment.width));
  const itemHeight = Math.max(...fragments.map((item) => item.fragment.height + labelHeight));
  const width = maxWidth + padding * 2;
  const height = padding * 2 + fragments.length * itemHeight + (fragments.length - 1) * gap;

  const content = fragments
    .map((item, index) => {
      const y = padding + index * (itemHeight + gap);
      const label = item.label ? escapeXml(`${item.code} - ${item.label}`) : item.code;
      return `
        <g transform="translate(${padding}, ${y})">
          <text x="0" y="16" font-family="Arial, sans-serif" font-size="14" fill="#111111">${label}</text>
          <g transform="translate(0, ${labelHeight})">${item.fragment.content}</g>
        </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}
</svg>`;
}

function readSvgDimension(svg, attribute) {
  const parsed = Number.parseFloat(svg.getAttribute(attribute) || "");
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const box = svg.getBBox();
  return attribute === "width" ? box.width : box.height;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

elements.form.addEventListener("input", updateSinglePreview);
elements.codeInput.addEventListener("input", () => {
  const result = completeOrValidateEan13(elements.codeInput.value);
  if (result.value) {
    elements.fileNameInput.value = `ean13-${result.value}`;
  }
});
elements.batchInput.addEventListener("input", updateBatchSummary);

elements.downloadButton.addEventListener("click", () => {
  const result = completeOrValidateEan13(elements.codeInput.value);
  if (!result.ok) return;
  downloadTextFile(`${safeFileName(elements.fileNameInput.value || `ean13-${result.value}`)}.svg`, serializeSvg(elements.barcodeSvg));
});

elements.copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(serializeSvg(elements.barcodeSvg));
  elements.statusMessage.textContent = "SVG copiado al portapapeles.";
  elements.statusMessage.dataset.state = "ok";
});

elements.downloadSheetButton.addEventListener("click", () => {
  downloadTextFile("hoja-ean13.svg", buildSheetSvg());
});

elements.resetButton.addEventListener("click", () => {
  elements.codeInput.value = "7462842912010";
  elements.fileNameInput.value = "ean13-7462842912010";
  elements.barWidthInput.value = "2";
  elements.heightInput.value = "110";
  elements.marginInput.value = "12";
  elements.displayValueInput.checked = true;
  elements.transparentInput.checked = true;
  updateSinglePreview();
});

updateSinglePreview();
updateBatchSummary();
