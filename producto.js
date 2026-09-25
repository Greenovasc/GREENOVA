/* GreeNova SC - ficha de producto.
   ===========================================================================
   Una sola plantilla que se llena con ?id= del catálogo. El carrito, el cajón
   y el toast los sigue manejando tienda.js, que en esta página corre en modo
   solo-carrito (no hay #grid), así que no hay dos versiones de esa lógica.

   Los productos con `venta` muestran precio por pieza y pedido mínimo (los
   captura el panel); el resto sigue bajo cotización por caja.
   =========================================================================== */
(function () {
  "use strict";
  if (!window.GREENOVA) return;

  var G = window.GREENOVA;
  var PRODS = G.PRODUCTOS, CATS = G.CATEGORIAS, MATS = G.MATERIALES;
  var PROMOS = G.PROMOS || {};
  var TAPAS_POR_VASO = G.TAPAS_POR_VASO || {};

  var id = new URLSearchParams(location.search).get("id");
  var p = PRODS.filter(function (x) { return x.id === id; })[0];

  var ficha = document.getElementById("ficha");
  var migas = document.getElementById("migas");
  var rel = document.getElementById("relacionados");

  /* Botón "Volver" (Gabriel, 2026-09-24): en el teléfono no había cómo salir
     de la ficha sin el gesto de atrás. Si la persona llegó desde el propio
     sitio, regresa a esa misma página (con sus filtros y su scroll); si
     entró directo (enlace compartido, Google), el href la lleva a la tienda. */
  var volver = document.getElementById("volver");
  if (volver) volver.addEventListener("click", function (e) {
    var ref = document.referrer;
    if (ref && location.origin !== "null" && ref.indexOf(location.origin + "/") === 0 && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  /* Pedido mínimo en piezas (Gabriel, 2026-09-24). Los productos con `venta`
     lo traen por medida en venta.tam[i].min; los de cotización usan este. */
  var MIN_PIEZAS = 10000;
  function fmt(n) { return n.toLocaleString("es-MX"); }

  /* ---------- producto inexistente: no dejamos la página en blanco ---------- */
  if (!p) {
    document.title = "Producto no encontrado | GreeNova SC";
    /* Un ?id= roto no debe quedar indexado como página vacía. */
    var nx = document.createElement("meta");
    nx.name = "robots";
    nx.content = "noindex, follow";
    document.head.appendChild(nx);
    migas.innerHTML = '<a href="tienda.html">Tienda</a>';
    ficha.innerHTML =
      '<div class="empty" style="grid-column:1/-1">' +
        '<svg class="ico empty__ico" aria-hidden="true"><use href="#i-search"></use></svg>' +
        "<h1>No encontramos ese producto</h1>" +
        "<p>Puede que el enlace esté mal o que la referencia haya cambiado de nombre. " +
        "El catálogo completo está a un clic.</p>" +
        '<a class="btn btn--primary" href="tienda.html">' +
          '<span class="btn__label">Ver el catálogo</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>' +
      "</div>";
    return;
  }

  var cat = CATS.filter(function (c) { return c.id === p.cat; })[0] || { nombre: "Catálogo", id: "" };

  /* Medidas agotadas una por una (las marca el panel). La ficha arranca en la
     primera medida que sí hay; si todas están agotadas, en la primera. */
  var AGOTADAS = p.agotadas || [];
  function agotada(i) { return AGOTADAS.indexOf(p.v[i]) > -1; }
  var INI = 0;
  while (INI < p.v.length - 1 && agotada(INI)) INI++;
  var promo = PROMOS[p.id];

  /* Igual que en tienda.js: las rutas pasan por aquí para que build-single.py
     pueda sustituirlas por data URIs en el archivo autocontenido. */
  function src(name) {
    var path = "assets/prod/" + name + ".webp";
    return (window.GN_ASSETS && window.GN_ASSETS[path]) || path;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ======================= cabecera del documento ======================= */

  /* Dominio fijo, no `location.origin`: la ficha también corre desde
     dist/ (origin "null") y desde despliegues de vista previa, y en los dos
     casos el canónico y el og:image tienen que apuntar al sitio de verdad. */
  var SITIO = "https://www.greenovasc.com.mx";
  var urlFicha = SITIO + "/producto.html?id=" + encodeURIComponent(p.id);
  var urlFoto  = SITIO + "/assets/prod/" + p.img + ".webp";

  var titulo = p.nombre + " | " + cat.nombre + " | GreeNova SC";
  var resumen = p.desc + " " + p.v.length +
    (p.v.length === 1 ? " presentación" : " medidas") + " disponibles. Cotización sin compromiso.";

  document.title = titulo;

  /* Las 56 fichas comparten una plantilla; sin estas etiquetas todas se
     anunciaban con el mismo título, la misma foto y sin canónico propio. */
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

  /* Datos estructurados: sin `offers`, porque no hay precio publicado.
     Declarar un precio falso ahí es lo que hace que Google marque la ficha. */
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

  /* Los chips de presentación escriben en el campo oculto y disparan `change`
     para que el carrito de tienda.js se entere igual que con el <select>. */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest(".vchip");
    if (!chip) return;
    var grupo = chip.parentElement;
    Array.prototype.forEach.call(grupo.children, function (c) {
      c.setAttribute("aria-checked", String(c === chip));
    });
    var campo = document.getElementById("f-variante");
    var etiqueta = document.getElementById("variante-actual");
    if (etiqueta) etiqueta.textContent = chip.dataset.v;
    if (campo && campo.value !== chip.dataset.v) {
      campo.value = chip.dataset.v;
      campo.dispatchEvent(new Event("change", { bubbles: true }));
    }
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

  /* ======================= certificaciones ======================= */
  /* Solo se declara lo que el catálogo respalda para ESE material. */
  var COMPOSTABLES = ["pla", "bagazo", "paja-trigo", "fecula", "tapioca"];
  var sellos = [];

  if (p.sello === "SEDEMA") {
    sellos.push({
      img: "assets/cert-sedema-compostable.webp",
      t: "Registro SEDEMA",
      c: "Registrado ante la Secretaría del Medio Ambiente de la Ciudad de México."
    });
  }
  if (p.mat.indexOf("papel") > -1 || p.mat.indexOf("kraft") > -1 || p.mat.indexOf("carton") > -1) {
    sellos.push({
      img: "assets/cert-fsc.webp",
      t: "Papel FSC",
      c: "Fibra con certificación FSC, que acredita manejo forestal responsable."
    });
  }
  var comp = p.mat.filter(function (m) { return COMPOSTABLES.indexOf(m) > -1; });
  if (comp.length) {
    sellos.push({
      ico: "i-leaf",
      t: "Compostable",
      c: "Hecho de " + comp.map(function (m) { return MATS[m].toLowerCase(); }).join(" y ") +
         ". Se degrada con la fracción orgánica."
    });
  }
  if (p.mat.indexOf("pet") > -1) {
    sellos.push({
      ico: "i-recycle",
      t: "PET",
      c: "Plástico transparente para bebida fría. Si necesitas la versión compostable, existe en PLA."
    });
  }

  /* ======================= características ======================= */
  var cars = [];
  cars.push({ ico: "i-package", t: "Material", c: p.mat.map(function (m) { return MATS[m]; }).join(", ") });
  cars.push({ ico: "i-ruler", t: p.v.length === 1 ? "Presentación" : "Medidas disponibles",
              c: p.v.length + (p.v.length === 1 ? " presentación" : " medidas") + ": " + p.v.join(" · ") });
  if (p.p) cars.push({ ico: "i-shopping-bag", t: "Piezas por caja", c: p.p.toLocaleString("es-MX") + " piezas" });
  var minimos = p.venta
    ? p.venta.tam.map(function (t) { return t.min || MIN_PIEZAS; })
    : [MIN_PIEZAS];
  var minMenor = Math.min.apply(null, minimos);
  cars.push({ ico: "i-package", t: "Pedido mínimo",
              c: minimos.every(function (m) { return m === minMenor; })
                ? fmt(minMenor) + " piezas"
                : "Desde " + fmt(minMenor) + " piezas, según la medida" });
  cars.push({ ico: "i-truck", t: "Envío", c: "A nivel nacional, con salida desde la Ciudad de México." });
  cars.push({ ico: "i-paint-brush-broad", t: "Personalización",
              c: "Se puede imprimir tu logo en serigrafía. También producimos formatos a medida." });
  if (p.servicio) cars.push({ ico: "i-sparkle", t: "Producción bajo pedido",
              c: "Esta referencia se fabrica para tu pedido; no sale de inventario estándar." });

  /* ======================= ficha ======================= */
  var opciones = p.v.map(function (v) {
    return '<option value="' + esc(v) + '">' + esc(v) + "</option>";
  }).join("");

  /* Papel/PET/Kraft ya se venden por pieza con precio y existencia reales
     (ver `venta` en productos.js): esas fichas cambian el bloque de compra
     entero. El resto del catálogo sigue exactamente como siempre, bajo
     cotización por caja. No hay pasarela de pago todavía, así que "Comprar
     ahora" abre al agente de ventas con la pieza y cantidad ya escritas —
     es un camino real hoy, no un botón muerto a falta de Openpay. */
  var bloqueCompra;
  if (p.venta) {
    bloqueCompra =
      '<div class="ficha__bloque">' +
        '<p class="ficha__label">Precio</p>' +
        '<p class="ficha__preciogrande" id="precio-unidad">Cargando…</p>' +
        '<p class="ficha__sku" id="sku-actual"></p>' +
      "</div>" +

      '<div class="ficha__bloque">' +
        '<label class="ficha__label" for="f-cant">Cantidad</label>' +
        /* data-min/data-max: los lee también el `change` de tienda.js, que
           antes recortaba cualquier cantidad a 999 (tope pensado para cajas). */
        '<div class="stepper stepper--cant stepper--pz" data-role="stepper-venta" data-min="' +
            (p.venta.tam[INI].min || MIN_PIEZAS) + '" data-max="10000000">' +
          '<button type="button" data-vstep="-1" aria-label="Quitar piezas">' +
            '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
          '<input id="f-cant" type="number" min="' + (p.venta.tam[INI].min || MIN_PIEZAS) + '" value="' +
            (p.venta.tam[INI].min || MIN_PIEZAS) + '" data-role="qty" aria-label="Piezas">' +
          '<button type="button" data-vstep="1" aria-label="Agregar piezas">' +
            '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
        "</div>" +
        '<p class="ficha__hint" id="hint-min"></p>' +
        '<p class="ficha__total" id="total-compra"></p>' +
      "</div>" +

      '<div class="ficha__cta">' +
        '<button class="btn btn--ghost btn--block pcard__add" type="button" data-role="add">' +
          '<span class="btn__label">Añadir al carrito</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg>' +
        "</button>" +
        '<button class="btn btn--primary btn--block" type="button" id="btn-comprar">' +
          '<span class="btn__label">Comprar ahora</span>' +
        "</button>" +
        '<button class="btn btn--ghost btn--block" type="button" ' +
          'data-agente="Cuéntame más sobre ' + esc(p.nombre) + '. ¿Qué medidas hay y para qué se usa?">' +
          '<span class="btn__label">Preguntar por este producto</span>' +
        "</button>" +
      "</div>" +

      '<p class="ficha__precio">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-seal-check"></use></svg>' +
        "Pago en línea próximamente. Por ahora nuestro agente cierra la compra contigo." +
      "</p>";
  } else {
    bloqueCompra =
      '<div class="ficha__bloque">' +
        '<label class="ficha__label" for="f-cant">Cajas</label>' +
        '<div class="ficha__acciones">' +
          '<div class="stepper" data-role="stepper">' +
            '<button type="button" data-step="-1" aria-label="Quitar una caja">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
            '<input id="f-cant" type="number" min="1" max="999" value="1" data-role="qty" aria-label="Cajas">' +
            '<button type="button" data-step="1" aria-label="Agregar una caja">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
          "</div>" +
          '<button class="btn btn--primary pcard__add" type="button" data-role="add">' +
            '<span class="btn__label">Añadir al carrito</span>' +
            '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg>' +
          "</button>" +
        "</div>" +
        '<button class="btn btn--ghost btn--block" type="button" ' +
          'data-agente="Cuéntame más sobre ' + esc(p.nombre) + '. ¿Qué medidas hay y para qué se usa?">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-sparkle"></use></svg>' +
          '<span class="btn__label">Preguntar por este producto</span>' +
        "</button>" +
      "</div>" +

      '<p class="ficha__precio">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-seal-check"></use></svg>' +
        "Precio bajo cotización. Depende de la medida y del volumen; ventas te contesta sin compromiso." +
      "</p>";
  }

  ficha.innerHTML =
    /* --- galería --- */
    '<div class="ficha__media">' +
      '<div class="ficha__foto' + (p.placa ? " ficha__foto--placa" : "") + (p.fotoPropia ? " ficha__foto--propia" : "") + '">' +
        (promo && promo.desc ? '<span class="pcard__flag pcard__flag--off">-' + promo.desc + "%</span>" : "") +
        (p.destacado ? '<span class="pcard__flag">Más pedido</span>' : "") +
        '<img src="' + src(p.img) + '" alt="' + esc(p.nombre) + '" width="800" height="600" fetchpriority="high">' +
      "</div>" +
      '<p class="ficha__nota">Foto de referencia del catálogo 2026. El acabado final puede variar según la medida.</p>' +
    "</div>" +

    /* --- columna de compra --- */
    '<div class="ficha__compra" data-id="' + p.id + '">' +
      '<p class="eyebrow"><a href="tienda.html?cat=' + cat.id + '">' + esc(cat.nombre) + "</a></p>" +
      "<h1>" + esc(p.nombre) + "</h1>" +
      '<p class="ficha__lede">' + esc(p.desc) + "</p>" +

      '<div class="ficha__tags">' +
        p.mat.map(function (m) {
          return '<span class="tag tag--' + m + '">' + MATS[m] + "</span>";
        }).join("") +
      "</div>" +

      '<div class="ficha__bloque">' +
        '<p class="ficha__label" id="lbl-variante">Presentación: ' +
          '<b class="ficha__variante" id="variante-actual">' + esc(p.v[INI]) + "</b></p>" +
        /* Chips visibles + un campo oculto con el valor: el carrito lee
           `[data-role="variant"]`.value, así que el contrato con tienda.js no
           cambia y no hubo que tocar su lógica. */
        '<div class="vchips" role="radiogroup" aria-labelledby="lbl-variante">' +
          p.v.map(function (v, k) {
            return '<button type="button" class="vchip' + (agotada(k) ? " vchip--agotada" : "") +
                   '" role="radio" data-v="' + esc(v) + '" data-i="' + k + '"' +
                   ' aria-checked="' + (k === INI ? "true" : "false") + '">' + esc(v) +
                   (agotada(k) ? ' <small>Agotado</small>' : "") + "</button>";
          }).join("") +
        "</div>" +
        '<input type="hidden" id="f-variante" data-role="variant" value="' + esc(p.v[INI]) + '">' +
        '<p class="ficha__agotado" id="nota-agotada" hidden>Esta medida está agotada por ahora. ' +
          "Elige otra o pregúntanos cuándo vuelve.</p>" +
        (p.p && !p.venta ? '<p class="ficha__hint">Cada caja trae ' + p.p.toLocaleString("es-MX") + " piezas.</p>" : "") +
        (!p.venta ? '<p class="ficha__hint">Pedido mínimo: ' + fmt(MIN_PIEZAS) + " piezas.</p>" : "") +
      "</div>" +

      bloqueCompra +

      '<ul class="ficha__cars">' +
        cars.map(function (c) {
          return '<li><svg class="ico" aria-hidden="true"><use href="#' + c.ico + '"></use></svg>' +
                 "<div><b>" + c.t + "</b><span>" + esc(c.c) + "</span></div></li>";
        }).join("") +
      "</ul>" +
    "</div>";

  /* ======================= precio y pedido mínimo (venta en línea) =======================
     Solo corre para las fichas con `venta`. Lee precio y pedido mínimo de
     productos.js (los captura el panel de admin). La cantidad arranca en el
     mínimo de la medida elegida y avanza de caja en caja (o de 1,000 en 1,000
     si el producto no declara piezas por caja); no hay tope, porque ya no se
     publican existencias. Sin pasarela de pago todavía: "Comprar ahora" abre
     al agente con la pieza y la cantidad ya escritas. */
  if (p.venta) (function () {
    var TAM = p.venta.tam;
    var PASO = p.p || 1000;
    var sel = INI;
    var cantEl = document.getElementById("f-cant");
    var stepper = document.querySelector('[data-role="stepper-venta"]');
    var precioEl = document.getElementById("precio-unidad");
    var skuEl = document.getElementById("sku-actual");
    var hintEl = document.getElementById("hint-min");
    var totalEl = document.getElementById("total-compra");
    var btnComprar = document.getElementById("btn-comprar");

    function money(n) {
      return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function minimo() { return (TAM[sel] && TAM[sel].min) || MIN_PIEZAS; }

    /* Lo que se cobra nunca baja del mínimo, aunque el campo tenga un número
       a medio escribir: el campo se corrige al salir de él (`change`). */
    function cantidad() { return Math.max(minimo(), parseInt(cantEl.value, 10) || 0); }

    /* Si el producto tiene una oferta activa (mismo mecanismo que ya usa el
       resto del sitio, capturado en el panel de admin), el precio por pieza
       se muestra con el tachado y el % de descuento, igual que cualquier
       otra oferta de la tienda. precioFinal() da el numero ya con el
       descuento aplicado, para no repetir la cuenta al armar el total. */
    function precioFinal(t) {
      if (t.precio == null) return null;
      return promo && promo.desc ? t.precio * (1 - promo.desc / 100) : t.precio;
    }

    function precioHTML(t) {
      var final = precioFinal(t);
      if (final == null) return "Aún sin precio para esta presentación";
      if (promo && promo.desc) {
        return money(final) + " MXN <span class=\"ficha__preciotachado\">" + money(t.precio) +
               "</span> <span class=\"ficha__preciodesc\">-" + promo.desc + "%</span>";
      }
      return money(final) + " MXN <span class=\"ficha__preciounidad\">por pieza</span>";
    }

    function actualizar() {
      var t = TAM[sel] || { precio: null };
      var min = minimo();
      var cant = cantidad();
      precioEl.innerHTML = precioHTML(t);
      skuEl.textContent = t.sku ? "Código: " + t.sku : "";
      stepper.dataset.min = min;
      cantEl.min = min;

      var final = precioFinal(t);
      totalEl.textContent = final != null ? "Total: " + money(final * cant) + " MXN" : "";
      hintEl.textContent = "Pedido mínimo: " + fmt(min) + " piezas.";

      btnComprar.disabled = final == null || agotada(sel);
      if (agotada(sel)) totalEl.textContent = "";
      if (final != null && !agotada(sel)) {
        btnComprar.dataset.agente = "Quiero comprar " + fmt(cant) + " piezas de " + p.nombre +
          " en presentación " + p.v[sel] + " (total " + money(final * cant) + " MXN). ¿Cómo completo el pago?";
      } else {
        delete btnComprar.dataset.agente;
      }
    }

    ficha.addEventListener("click", function (e) {
      var chip = e.target.closest(".vchip");
      if (!chip || chip.dataset.i == null) return;
      sel = parseInt(chip.dataset.i, 10);
      cantEl.value = cantidad();   /* otra medida puede tener otro mínimo */
      actualizar();
    });

    stepper.addEventListener("click", function (e) {
      var b = e.target.closest("[data-vstep]"); if (!b) return;
      cantEl.value = Math.max(minimo(), cantidad() + parseInt(b.dataset.vstep, 10) * PASO);
      actualizar();
    });
    cantEl.addEventListener("input", actualizar);
    cantEl.addEventListener("change", function () { cantEl.value = cantidad(); actualizar(); });

    actualizar();
  })();

  /* Medida agotada: se avisa y no se puede añadir ni comprar. Sirve igual
     para los productos por pieza y los de cotización por caja. */
  function marcarAgotada(i) {
    var nota = document.getElementById("nota-agotada");
    var sin = agotada(i);
    nota.hidden = !sin;
    ficha.querySelectorAll('[data-role="add"], #btn-comprar').forEach(function (b) {
      if (sin) b.disabled = true;
      else if (b.id !== "btn-comprar") b.disabled = false;
    });
  }
  ficha.addEventListener("click", function (e) {
    var chip = e.target.closest(".vchip");
    if (chip && chip.dataset.i != null) marcarAgotada(parseInt(chip.dataset.i, 10));
  });
  marcarAgotada(INI);

  /* ======================= certificaciones + relacionados ======================= */
  /* Los relacionados son del mismo grupo del catálogo, tal como el catálogo
     los divide: no se arman kits ni combinaciones inventadas. */
  var hermanos = PRODS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);

  /* Tapas para este vaso: mismo cruce boca/oz que ya usa la tienda
     (ver TAPAS_POR_VASO en productos.js), no una lista aparte. */
  var tapasVaso = (TAPAS_POR_VASO[p.id] || [])
    .map(function (tid) { return PRODS.filter(function (x) { return x.id === tid; })[0]; })
    .filter(Boolean);

  rel.innerHTML =
    '<div class="wrap">' +
      (sellos.length ?
        '<div class="certs-ficha rv">' +
          '<h2>Lo que respalda este producto</h2>' +
          '<div class="certs-ficha__grid">' +
            sellos.map(function (s) {
              return '<div class="certs-ficha__item">' +
                (s.img ? '<img src="' + s.img + '" alt="" height="54" loading="lazy">' :
                         '<svg class="ico" aria-hidden="true"><use href="#' + s.ico + '"></use></svg>') +
                "<div><b>" + s.t + "</b><span>" + esc(s.c) + "</span></div></div>";
            }).join("") +
          "</div>" +
        "</div>" : "") +

      (tapasVaso.length ?
        '<div class="tapas-rel rv" style="margin-top:56px">' +
          '<p class="tapas-rel__label">Tapas para este vaso</p>' +
          '<div class="tapas-rel__list">' +
            tapasVaso.map(function (t) {
              return '<a class="tapas-rel__chip" href="producto.html?id=' + t.id + '">' +
                '<img src="' + src(t.img) + '" alt="" loading="lazy">' +
                "<span>" + esc(t.nombre) + "</span></a>";
            }).join("") +
          "</div>" +
        "</div>" : "") +

      (hermanos.length ?
        '<div class="head rv" style="margin-top:56px">' +
          "<h2>Más de " + esc(cat.nombre.toLowerCase()) + "</h2>" +
          "<p>El resto del grupo, tal como viene dividido en el catálogo.</p>" +
        "</div>" +
        '<div class="grid-prod">' +
          hermanos.map(function (h, i) {
            return '<a class="pcard pcard--link rv" data-d="' + (i % 4) + '" href="producto.html?id=' + h.id + '">' +
              '<div class="pcard__media' + (h.placa ? " pcard__media--placa" : "") + '">' +
                '<img src="' + src(h.img) + '" alt="" loading="lazy" decoding="async"></div>' +
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
          "<p>El catálogo es el punto de partida. Si buscas un formato, material o volumen " +
          "que no aparece aquí, lo cotizamos.</p></div>" +
          '<div class="band__actions">' +
            '<button class="btn btn--primary" type="button" ' +
              'data-agente="Necesito una medida que no está en el catálogo. ¿Qué opciones hay?">' +
              '<span class="btn__label">Preguntar por más modelos</span>' +
              '<svg class="ico" aria-hidden="true"><use href="#i-sparkle"></use></svg>' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";

  if (window.GN && window.GN.observe) window.GN.observe(rel.querySelectorAll(".rv"));

  /* Si el producto ya está en el carrito, el botón arranca en "Actualizar"
     y con la medida y las cajas que se eligieron antes. Se lee la misma llave
     que escribe tienda.js. No aplica a `venta`: esas fichas compran por pieza
     a través del agente, no arman una cotización por caja en este carrito. */
  if (!p.venta) try {
    var guardado = JSON.parse(localStorage.getItem("greenova.cotizacion.v1") || "[]");
    var linea = guardado.filter(function (l) { return l && l.id === p.id; })[0];
    if (linea) {
      var caja = ficha.querySelector(".ficha__compra");
      caja.dataset.in = "true";
      caja.querySelector(".pcard__add .btn__label").textContent = "Actualizar";
      caja.querySelector(".pcard__add use").setAttribute("href", "#i-check");
      var sel = document.getElementById("f-variante");
      if (p.v.indexOf(linea.v) > -1) sel.value = linea.v;
      document.getElementById("f-cant").value = linea.qty;
    }
  } catch (e) { /* modo privado */ }
})();
