/* --- script.js --- */

const estructura = {
  name: "📁 raiz",
  path: "index.html",
  children: [
    { name: "📄 index.html", path: "index.html" },
    {
      name: "📁 paginas",
      children: [
        {
          name: "📁 servicios",
          children: [
            { name: "📄 consultoria.html", path: "paginas/servicios/consultoria.html" },
          ],
        },
        {
          name: "📁 productos",
          children: [
            { name: "📄 productoA.html", path: "paginas/productos/productoA.html" },
          ],
        },
        { name: "📄 sobre.html", path: "paginas/sobre.html" },
      ],
    },
  ],
};

const paginas = {
  "index.html": {
    titulo: "Viendo: /index.html",
    contenido: "Esta es la Página Principal",
    links: [
      { texto: "Ir a Sobre Nosotros", href: "paginas/sobre.html" },
      { texto: "Ver Producto A", href: "paginas/productos/productoA.html" },
    ],
  },
  "paginas/sobre.html": {
    titulo: "Viendo: /paginas/sobre.html",
    contenido: "Esta es la Página Sobre Nosotros",
    links: [
      { texto: "Volver a Inicio", href: "../index.html" },
      { texto: "Ir a Consultoría", href: "servicios/consultoria.html" },
      { texto: "Ir a Producto A", href: "productos/productoA.html" },
    ],
  },
  "paginas/servicios/consultoria.html": {
    titulo: "Viendo: /paginas/servicios/consultoria.html",
    contenido: "Página de Consultoría",
    links: [
      { texto: "Volver a Servicios", href: "../" },
      { texto: "Volver a Inicio", href: "../../index.html" },
    ],
  },
  "paginas/productos/productoA.html": {
    titulo: "Viendo: /paginas/productos/productoA.html",
    contenido: "Página del Producto A",
    links: [
      { texto: "Volver a Inicio", href: "../../index.html" },
    ],
  },
};

let paginaActual = "index.html";

function renderNavegador() {
  const { titulo, contenido, links } = paginas[paginaActual];
  const vista = document.getElementById("vista-navegador");
  vista.innerHTML = `<h3>${titulo}</h3><p>${contenido}</p>`;
  links.forEach(({ texto, href }) => {
    const a = document.createElement("a");
    a.href = "#";
    a.textContent = texto;
    a.dataset.href = href;
    a.addEventListener("click", () => {
      const nuevaRuta = resolveRuta(paginaActual, href);
      if (paginas[nuevaRuta]) {
        paginaActual = nuevaRuta;
        renderTodo();
      } else {
        document.getElementById("explicacion").innerText = `Error: ${href} no existe desde ${paginaActual}`;
      }
    });
    a.addEventListener("mouseover", () => explicarRuta(href));
    vista.appendChild(document.createElement("br"));
    vista.appendChild(a);
  });
}

function renderCodigo() {
  const { links } = paginas[paginaActual];
  const pre = document.getElementById("codigo-html");
  const html = [`<h1>${paginaActual}</h1>`, `<p>${paginas[paginaActual].contenido}</p>`];
  links.forEach(({ texto, href }) => {
    html.push(`<a href=\"${href}\">${texto}</a>`);
  });
  pre.innerHTML = html.map(l => l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("\n");
}

function renderArbol() {
  const cont = document.getElementById("arbol-carpetas");
  cont.innerHTML = renderNodo(estructura);
}

function renderNodo(nodo, prefijo = "") {
  const activo = (nodo.path && nodo.path === paginaActual);
  let html = `<div class="${activo ? "activo" : ""}" data-path="${nodo.path || ""}">${prefijo}${nodo.name}</div>`;
  if (nodo.children) {
    nodo.children.forEach(hijo => {
      html += renderNodo(hijo, prefijo + "&nbsp;&nbsp;");
    });
  }
  return html;
}

function explicarRuta(href) {
  const explicacion = document.getElementById("explicacion");
  const origen = paginaActual;
  const destino = resolveRuta(origen, href);

  let mensaje = `Analizando el enlace desde: ${origen} hacia: ${href}\n`;
  if (paginas[destino]) {
    mensaje += `✔️ Ruta válida. Resuelve como: ${destino}`;
  } else {
    mensaje += `❌ Error: El archivo ${destino} no existe.`;
  }
  explicacion.innerText = mensaje;
}

function resolveRuta(base, relativa) {
  const baseArr = base.split("/").slice(0, -1);
  const partes = relativa.split("/");
  for (let parte of partes) {
    if (parte === "..") baseArr.pop();
    else if (parte !== ".") baseArr.push(parte);
  }
  return baseArr.join("/");
}

function renderTodo() {
  renderNavegador();
  renderCodigo();
  renderArbol();
  document.getElementById("explicacion").innerText = "Pasa el ratón sobre un enlace para analizar la ruta.";
}

document.addEventListener("DOMContentLoaded", renderTodo);