const examples = {
  titulo: '<h1>Hola Mundo</h1>',
  parrafo: '<p style="color:blue; font-size:18px">Este es un párrafo con estilo.</p>',
  lista: '<ul><li>Elemento 1</li><li>Elemento 2</li></ul>',
  imagen: '<img src="https://via.placeholder.com/150" alt="Imagen ejemplo">',
  script: '<script>alert("¡Cuidado!")<\/script>'
};

const htmlSource = document.getElementById('html-source');
const targetDiv = document.getElementById('targetDiv');
const securityWarning = document.getElementById('security-warning');
const currentInnerHtmlDisplay = document.getElementById('current-inner-html-display');
const alternativesInfo = document.getElementById('alternatives-info');
const customInput = document.getElementById('custom-html');
const insertCustomBtn = document.getElementById('insert-custom');
const resetBtn = document.getElementById('reset-btn');

function escapeHTML(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function detectDangerousHTML(html) {
  return /<script|on\w+=/i.test(html);
}

function updatePanels(html) {
  htmlSource.textContent = targetDiv.innerHTML = html;
  securityWarning.style.display = detectDangerousHTML(html) ? 'block' : 'none';
  updateAlternatives(html);
}

function updateAlternatives(html) {
  if (detectDangerousHTML(html)) {
    alternativesInfo.innerHTML = `
      <strong>⚠️ Código peligroso detectado.</strong><br>
      Nunca uses <code>innerHTML</code> con contenido del usuario sin sanitización.<br>
      Usa <code>textContent</code> para insertar texto plano seguro.<br>
      Usa <code>createElement</code>, <code>setAttribute</code>, <code>appendChild</code> para construir HTML dinámico.<br>
      Para HTML de terceros, considera usar <a href="https://github.com/cure53/DOMPurify" target="_blank">DOMPurify</a> para sanitizar.
    `;
  } else {
    alternativesInfo.innerHTML = `
      Este contenido se insertó con <code>innerHTML</code>. Para insertar texto plano usa <code>textContent</code>.<br>
      Para HTML dinámico seguro, usa:
      <pre>
const p = document.createElement('p');
p.textContent = 'Texto seguro';
div.appendChild(p);
      </pre>
    `;
  }
}

function attachExampleButton(id, key) {
  document.getElementById(id).addEventListener('click', () => {
    updatePanels(examples[key]);
  });
}

attachExampleButton('btn-titulo', 'titulo');
attachExampleButton('btn-parrafo', 'parrafo');
attachExampleButton('btn-lista', 'lista');
attachExampleButton('btn-imagen', 'imagen');
attachExampleButton('btn-script', 'script');

insertCustomBtn.addEventListener('click', () => {
  updatePanels(customInput.value);
});

resetBtn.addEventListener('click', () => {
  htmlSource.textContent = '';
  targetDiv.innerHTML = '';
  currentInnerHtmlDisplay.textContent = '';
  customInput.value = '';
  securityWarning.style.display = 'none';
  alternativesInfo.innerHTML = '';
});