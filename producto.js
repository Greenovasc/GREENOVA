/* GreeNova SC - ficha de producto.
   ===========================================================================
   Una sola plantilla que se llena con ?id= del catálogo (y ?boca= para abrir
   en esa medida). El carrito, el cajón, el toast y la caja de compra (precios,
   paquete o caja, "Añadir") los maneja tienda.js, que en esta página corre en
   modo solo-carrito; aquí se arma la ficha y se escucha `gn:compra` para poner
   al día lo que depende de la medida elegida.

   Feedback final (2026-09-27): especificaciones y precios de la lista de
   Excel; por paquete o por caja, IVA incluido; "Personalización" solo en lo
   que sí se puede imprimir (papel, kraft y vasos PET/PP, no tapas de plástico).
   =========================================================================== */
(function () {
  "use strict";
  if (!window.GREENOVA) return;

  var G = window.GREENOVA;
  var PRODS = G.PRODUCTOS, CATS = G.CATEGORIAS, MATS = G.MATERIALES;
  var PROMOS = G.PROMOS || {};

  var qs = new URLSearchParams(location.search);
  var id = qs.get("id");
  var p = PRODS.filter(function (x) { return x.id === id; })[0];

  var ficha = document.getElementById("ficha");
  var migas = document.getElementById("migas");
  var rel = document.getElementById("relacionados");

  /* Botón "Volver": si la persona llegó desde el propio sitio, regresa a esa
     misma página (con sus filtros); si entró directo, el href va a la tienda. */
  var volver = document.getElementById("volver");
  if (volver) volver.addEventListener("click", function (e) {
    var ref = document.referrer;
    if (ref && location.origin !== "null" && ref.indexOf(location.origin + "/") === 0 && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  function fmt(n) { return n.toLocaleString("es-MX"); }
  function money(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /* Igual que en tienda.js: las rutas pasan por aquí para que build-single.py
     pueda sustituirlas por data URIs en el archivo autocontenido. */
  function src(name) {
    var path = "assets/prod/" + name + ".webp";
    return (window.GN_ASSETS && window.GN_ASSETS[path]) || path + "?v=20260927b";
  }

  /* ---------- producto inexistente: no dejamos la página en blanco ---------- */
  if (!p) {
    document.title = "Producto no encontrado | GreeNova SC";
    var nx = document.createElement("meta");
    nx.name = "robots";
    nx.content = "noindex, follow";
    document.head.appendChild(nx);
    migas.innerHTML = '<a href="tienda.html">Tienda</a>';
    ficha.innerHTML =
      '<div class="empty" style="grid-column:1/-1">' +
        '<svg class="ico empty__ico" aria-hidden="true"><use href="#i-search"></use></svg>' +
        "<h1>No encontramos ese producto</h1>" +
        "<p>Puede que el enlace esté mal o que el producto haya cambiado de nombre. " +
        "La tienda completa está a un clic.</p>" +
        '<a class="btn btn--primary" href="tienda.html">' +
          '<span class="btn__label">Ir a la tienda</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>' +
      "</div>";
    return;
  }

  var cat = CATS.filter(function (c) { return c.id === p.cat; })[0] || { nombre: "Tienda", id: "" };
  var TAM = (p.venta && p.venta.tam) || [];
  var AGOTADAS = p.agotadas || [];
  function agotada(i) { return AGOTADAS.indexOf(p.v[i]) > -1; }

  /* Medida inicial: la de ?boca= si viene de "Tapas para estos vasos"; si no,
     la primera que no esté agotada. */
  var INI = 0;
  var bocaPedida = Number(qs.get("boca"));
  if (bocaPedida) {
    var k = TAM.map(function (t) { return t.boca; }).indexOf(bocaPedida);
    if (k > -1) INI = k;
  }
  /* ?v= viene de las recomendaciones por uso (asistente y tienda): abre la
     ficha ya en la medida recomendada, p. ej. el vaso de 4 oz para helado. */
  var vPedida = qs.get("v");
  if (vPedida && /^\d+$/.test(vPedida) && Number(vPedida) < p.v.length) INI = Number(vPedida);
  while (INI < p.v.length - 1 && agotada(INI)) INI++;
  var promo = PROMOS[p.id];

  function imgDe(i) { return (TAM[i] && TAM[i].img) || p.img; }

  /* Guía de usos y fotos con comida (agente-criterios.js). */
  var AG = window.GREENOVA_AGENTE || {};
  function ambDe(i) { return AG.fotoUso ? AG.fotoUso(p.id, p.v[i]) : null; }
  var AMB = ambDe(INI);
  var USOS = AG.usosDe ? AG.usosDe(p.id) : [];

  /* ======================= cabecera del documento ======================= */
  var SITIO = "https://www.greenovasc.com.mx";
  var urlFicha = SITIO + "/producto.html?id=" + encodeURIComponent(p.id);
  var urlFoto = SITIO + "/assets/prod/" + p.img + ".webp";
  var titulo = p.nombre + " | " + cat.nombre + " | GreeNova SC";
  var resumen = p.desc + " Por paquete o por caja, IVA incluido.";
  document.title = titulo;

  function meta(clave, valor, attr) {
    var sel = "meta[" + (attr || "property") + '="' + clave + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr || "property", clave);
      document.head.appendChild(el);
    }
    el.setAttribute("content", valor);
  }
  meta("description", resumen, "name");
  meta("og:title", titulo);
  meta("og:description", resumen);
  meta("og:url", urlFicha);
  meta("og:image", urlFoto);
  meta("og:image:alt", p.nombre + " — GreeNova SC");

  var can = document.querySelector('link[rel="canonical"]');
  if (!can) {
    can = document.createElement("link");
    can.rel = "canonical";
    document.head.appendChild(can);
  }
  can.href = urlFicha;

  var ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.desc,
    category: cat.nombre,
    material: p.mat.map(function (m) { return MATS[m]; }).join(", "),
    brand: { "@type": "Brand", name: "GreeNova SC" },
    image: urlFoto,
    url: urlFicha
  });
  document.head.appendChild(ld);

  /* Los chips de medida escriben en el campo oculto y disparan `change` para
     que tienda.js ponga al día precios, foto y botones. */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest(".vchip");
    if (!chip) return;
    Array.prototype.forEach.call(chip.parentElement.children, function (c) {
      c.setAttribute("aria-checked", String(c === chip));
    });
    var campo = document.getElementById("f-variante");
    document.getElementById("variante-actual").textContent = chip.dataset.v;
    /* Si esa medida tiene su propia foto con comida, se cambia también. */
    var amb = document.getElementById("ficha-amb");
    var nueva = ambDe(Number(chip.dataset.i));
    if (amb && nueva && amb.getAttribute("src") !== nueva.src) {
      amb.setAttribute("src", nueva.src);
      amb.setAttribute("alt", nueva.alt);
    }
    if (campo && campo.value !== chip.dataset.v) {
      campo.value = chip.dataset.v;
      campo.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* Producto / Así se ve servido. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".ficha__vistas button");
    if (!b) return;
    Array.prototype.forEach.call(b.parentElement.children, function (x) {
      x.setAttribute("aria-pressed", String(x === b));
    });
    var foto = document.querySelector(".ficha__foto");
    if (foto) foto.dataset.vista = b.dataset.vista;
  });

  /* ======================= migas ======================= */
  migas.innerHTML =
    '<a href="index.html">Inicio</a>' +
    '<span aria-hidden="true">/</span>' +
    '<a href="tienda.html">Tienda</a>' +
    '<span aria-hidden="true">/</span>' +
    '<a href="tienda.html?cat=' + cat.id + '">' + esc(cat.nombre) + "</a>" +
    '<span aria-hidden="true">/</span>' +
    "<b>" + esc(p.nombre) + "</b>";

  /* ======================= ficha ======================= */
  var unica = p.v.length === 1;
  ficha.innerHTML =
    '<div class="ficha__media">' +
      '<div class="ficha__foto' + (p.fotoPropia ? " ficha__foto--propia" : "") + '">' +
        (promo && promo.desc ? '<span class="pcard__flag pcard__flag--off">-' + promo.desc + "%</span>" : "") +
        '<img data-role="foto" src="' + src(imgDe(INI)) + '" alt="' + esc(p.nombre) + '" width="900" height="900" fetchpriority="high">' +
        (AMB ? '<img class="ficha__amb" id="ficha-amb" src="' + AMB.src + '" alt="' + esc(AMB.alt) + '" width="900" height="900" loading="lazy" decoding="async">' : "") +
      "</div>" +
      /* Con foto con comida: dos botones para alternar entre el producto y
         cómo se ve servido. */
      (AMB ? '<div class="ficha__vistas" role="group" aria-label="Qué foto ver">' +
               '<button type="button" data-vista="prod" aria-pressed="true">Producto</button>' +
               '<button type="button" data-vista="uso" aria-pressed="false">Así se ve servido</button>' +
             "</div>" : "") +
      '<p class="ficha__nota">Foto de referencia. El acabado puede variar según la medida.</p>' +
    "</div>" +

    '<div class="ficha__compra" data-id="' + p.id + '">' +
      '<p class="eyebrow"><a href="tienda.html?cat=' + cat.id + '">' + esc(cat.nombre) + "</a></p>" +
      "<h1>" + esc(p.nombre) + "</h1>" +
      '<p class="ficha__lede">' + esc(p.desc) + "</p>" +
      /* Los usos en los que este producto sale recomendado; cada uno abre la
         tienda con la lista completa para ese uso. */
      (USOS.length ? '<p class="ficha__usos"><span>Ideal para</span>' + USOS.map(function (g) {
        return '<a href="tienda.html?q=' + encodeURIComponent(g.dice[0]) + '">' + esc(g.nombre) + "</a>";
      }).join("") + "</p>" : "") +

      '<div class="ficha__bloque">' +
        '<p class="ficha__label" id="lbl-variante">' + (unica ? "Medida" : "Elige la medida") + ': ' +
          '<b class="ficha__variante" id="variante-actual">' + esc(p.v[INI]) + "</b></p>" +
        (unica ? "" :
          '<div class="vchips" role="radiogroup" aria-labelledby="lbl-variante">' +
            p.v.map(function (v, k) {
              return '<button type="button" class="vchip' + (agotada(k) ? " vchip--agotada" : "") +
                     '" role="radio" data-v="' + esc(v) + '" data-i="' + k + '"' +
                     ' aria-checked="' + (k === INI ? "true" : "false") + '">' + esc(v) +
                     (agotada(k) ? " <small>Agotado</small>" : "") + "</button>";
            }).join("") +
          "</div>") +
        '<input type="hidden" id="f-variante" data-role="variant" value="' + esc(p.v[INI]) + '">' +
        '<p class="ficha__agotado" id="nota-agotada" hidden>Esta medida está agotada por ahora. ' +
          "Elige otra o pregúntanos cuándo vuelve.</p>" +
      "</div>" +

      '<div class="ficha__bloque">' +
        '<p class="ficha__label">Precio</p>' +
        '<div class="precios precios--ficha" data-role="precios"></div>' +
      "</div>" +

      '<div class="ficha__bloque">' +
        '<p class="ficha__label">Comprar por</p>' +
        '<div class="seg seg--ficha" data-role="unidad" role="group" aria-label="Comprar por"></div>' +
        '<div class="ficha__cant">' +
          '<label class="ficha__label" for="f-cant">Cantidad</label>' +
          '<div class="stepper stepper--cant" data-role="stepper">' +
            '<button type="button" data-step="-1" aria-label="Quitar uno">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
            '<input id="f-cant" type="number" min="1" max="999" value="1" data-role="qty" aria-label="Cantidad">' +
            '<button type="button" data-step="1" aria-label="Agregar uno">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
          "</div>" +
        "</div>" +
        '<p class="ficha__total" id="total-compra"></p>' +
      "</div>" +

      '<div class="ficha__cta">' +
        '<button class="btn btn--ghost btn--block pcard__add" type="button" data-role="add" data-texto="Añadir al carrito">' +
          '<span class="btn__label">Añadir al carrito</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg>' +
        "</button>" +
        '<button class="btn btn--primary btn--block" type="button" id="btn-comprar">' +
          '<span class="btn__label">Pagar ahora</span>' +
        "</button>" +
        '<small class="ficha__openpay">Pago seguro con Openpay · tarjeta o transferencia SPEI</small>' +
        '<button class="btn btn--ghost btn--block" type="button" ' +
          'data-agente="Cuéntame más sobre ' + esc(p.nombre) + '. ¿Qué medidas hay y para qué se usa?">' +
          '<span class="btn__label">Preguntar por este producto</span>' +
        "</button>" +
      "</div>" +

      '<ul class="ficha__cars" id="cars"></ul>' +
    "</div>";

  var caja = ficha.querySelector(".ficha__compra");
  var cantEl = document.getElementById("f-cant");
  var totalEl = document.getElementById("total-compra");
  var btnComprar = document.getElementById("btn-comprar");

  function selIndex() { return Math.max(0, p.v.indexOf(document.getElementById("f-variante").value)); }
  function unidadSel() {
    var b = caja.querySelector("[data-role='unidad'] [aria-pressed='true']");
    return b ? b.dataset.u : null;
  }

  /* Características: todo sale de la medida elegida (lista de Excel). */
  function pintaCars() {
    var i = selIndex(), t = TAM[i] || {};
    var cars = [];
    cars.push({ ico: "i-package", t: "Material", c: p.mat.map(function (m) { return MATS[m]; }).join(", ") });
    if (t.esp) cars.push({ ico: "i-ruler", t: "Especificaciones", c: t.esp });
    if (p.uso) cars.push({ ico: "i-coffee", t: "Uso", c: p.uso });
    /* Sin "Presentación": las piezas por paquete y por caja ya salen en el
       precio de arriba (Gabriel, 2026-09-28). */
    cars.push({ ico: "i-package", t: "Pedido mínimo",
                c: t.paq && t.pPaq != null ? "1 paquete" : t.caja && t.pCaja != null ? "1 caja" : "Por confirmar" });
    cars.push({ ico: "i-truck", t: "Envío", c: "A nivel nacional, con salida desde la Ciudad de México." });
    if (p.personalizable) {
      cars.push({ ico: "i-paint-brush-broad", t: "Personalización", c: "Se puede imprimir tu logo en serigrafía." });
    }
    document.getElementById("cars").innerHTML = cars.map(function (c) {
      return '<li><svg class="ico" aria-hidden="true"><use href="#' + c.ico + '"></use></svg>' +
             "<div><b>" + c.t + "</b><span>" + esc(c.c) + "</span></div></li>";
    }).join("");
  }

  function pintaTotal() {
    var i = selIndex(), t = TAM[i], u = unidadSel();
    var precio = t && u ? (u === "paq" ? t.pPaq : t.pCaja) : null;
    if (precio != null && promo && promo.desc) precio = precio * (1 - promo.desc / 100);
    var n = Math.min(999, Math.max(1, parseInt(cantEl.value, 10) || 1));
    var piezas = t && u ? (u === "paq" ? t.paq : t.caja) * n : 0;
    var sin = precio == null || agotada(i);
    totalEl.innerHTML = sin ? "" : "Total: <b>" + money(precio * n) + " MXN</b> · " + fmt(piezas) + " piezas · IVA incluido";
    btnComprar.disabled = sin;
    document.getElementById("nota-agotada").hidden = !agotada(i);
  }

  /* Tapas para este vaso: las de su misma boca (se pone al día con la medida). */
  function pintaTapas() {
    var box = document.getElementById("tapas-vaso");
    if (!box || !window.GNTienda) return;
    var tapas = window.GNTienda.tapasPara(p, p.v[selIndex()]);
    var t = TAM[selIndex()] || {};
    box.hidden = !tapas.length;
    box.innerHTML = tapas.length ?
      '<p class="tapas-rel__label">Tapas para este vaso (boca ' + t.boca + " mm)</p>" +
      '<div class="tapas-rel__list">' +
        tapas.map(function (x) {
          return '<a class="tapas-rel__chip" href="producto.html?id=' + x.id + "&boca=" + t.boca + '">' +
            '<img src="' + src(x.img) + '" alt="" loading="lazy">' +
            "<span>" + esc(x.nombre) + "</span></a>";
        }).join("") +
      "</div>" : "";
  }

  document.addEventListener("gn:compra", function (e) {
    if (e.detail.id !== p.id) return;
    pintaCars();
    pintaTotal();
    pintaTapas();
  });
  cantEl.addEventListener("input", pintaTotal);
  cantEl.addEventListener("change", pintaTotal);

  /* Pagar ahora (antes "Comprar ahora", Gabriel 2026-09-29): lo agrega al
     carrito y lleva a pagar.html. Ahí primero elige su paquetería y, al darle
     "Continuar con la compra", se registra si no tiene sesión. */
  btnComprar.addEventListener("click", function () {
    var add = caja.querySelector("[data-role='add']");
    if (!add.disabled) add.click();
    setTimeout(function () { location.href = "pagar.html"; }, 250);
  });

  /* ======================= relacionados ======================= */
  var hermanos = PRODS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);

  rel.innerHTML =
    '<div class="wrap">' +
      '<div class="tapas-rel rv" id="tapas-vaso" hidden></div>' +
      (hermanos.length ?
        '<div class="head rv" style="margin-top:56px">' +
          "<h2>Más " + esc(cat.nombre.toLowerCase()) + "</h2>" +
        "</div>" +
        '<div class="grid-prod">' +
          hermanos.map(function (h, i) {
            return '<a class="pcard pcard--link rv" data-d="' + (i % 4) + '" href="producto.html?id=' + h.id + '">' +
              '<div class="pcard__media"><img src="' + src(h.img) + '" alt="" loading="lazy" decoding="async"></div>' +
              '<div class="pcard__body">' +
                '<div class="pcard__tags">' +
                  h.mat.map(function (m) { return '<span class="tag tag--' + m + '">' + MATS[m] + "</span>"; }).join("") +
                "</div>" +
                "<h3>" + esc(h.nombre) + "</h3>" +
                '<p class="pcard__desc">' + esc(h.desc) + "</p>" +
              "</div></a>";
          }).join("") +
        "</div>" : "") +

      '<div class="band" style="padding-top:56px">' +
        '<div class="band__inner rv">' +
          "<div><h2>¿Necesitas otra medida?</h2>" +
          "<p>Envía tu lista de productos, alguna cotización en particular o lo que estás buscando.</p></div>" +
          '<div class="band__actions">' +
            '<a class="btn btn--primary" href="tienda.html#cotizar-tienda">' +
              '<span class="btn__label">Enviar mi lista</span>' +
              '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg>' +
            "</a>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";

  if (window.GN && window.GN.observe) window.GN.observe(rel.querySelectorAll(".rv"));

  /* tienda.js carga después de este archivo: la caja de compra se llena
     cuando ya está todo en memoria. */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.GNTienda) window.GNTienda.refrescaCompra(caja);
    else { pintaCars(); pintaTotal(); }
  });
})();
