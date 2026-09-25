/* GreeNova SC - tienda.
   Catálogo filtrable + carrito persistente en localStorage. El envío pide
   cotización por correo. Los productos con `venta` muestran precio por pieza
   y se piden desde su pedido mínimo; el resto va por caja.
   Sin dependencias, sin listeners de scroll: los reveals los maneja app.js. */
(function () {
  "use strict";
  if (!window.GREENOVA) return;

  var CATS = window.GREENOVA.CATEGORIAS;
  var MATS = window.GREENOVA.MATERIALES;
  var PRODS = window.GREENOVA.PRODUCTOS;
  var PROMOS = window.GREENOVA.PROMOS || {};
  var TAPAS_POR_VASO = window.GREENOVA.TAPAS_POR_VASO || {};

  /* "todo" = catálogo completo (tienda.html) | "ofertas" = outlet (ofertas.html) */
  var MODO = document.body.dataset.modo || "todo";
  var BASE = MODO === "ofertas"
    ? PRODS.filter(function (p) { return PROMOS[p.id]; })
    : PRODS;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KEY = "greenova.cotizacion.v1";

  var $ = function (id) { return document.getElementById(id); };

  /* Las rutas de imagen se resuelven por aquí para que build-single.py pueda
     sustituirlas por data URIs en el archivo autocontenido. */
  function src(name) {
    var path = "assets/prod/" + name + ".webp";
    return (window.GN_ASSETS && window.GN_ASSETS[path]) || path;
  }

  /* ============================ estado ============================ */
  var state = { cat: "todo", mats: [], oz: [], q: "", sort: "destacado", stock: "todo", linea: "" };
  /* Todo material puede traer venta en línea (ver LINEAS_VENTA en main.py):
     se arma de MATERIALES en vez de una lista fija para no desalinearse. */
  var LINEAS = Object.keys(MATS).map(function (k) { return [k, MATS[k]]; });
  var cart = [];

  /* ---------- unidades del carrito ----------
     Pedido mínimo (Gabriel, 2026-09-24): los productos con `venta` se piden
     por PIEZA, desde el `min` de cada medida (10,000 por omisión) y en pasos
     de una caja (o de 1,000 si el producto no declara piezas por caja). Los de
     cotización se siguen contando en CAJAS, de 1 a 999, como siempre. */
  var MIN_PIEZAS = 10000;
  function prodDe(id) { return PRODS.filter(function (x) { return x.id === id; })[0]; }
  function porPieza(p) { return !!(p && p.venta); }
  function minDe(p, v) {
    if (!porPieza(p)) return 1;
    var t = p.venta.tam[Math.max(0, p.v.indexOf(v))];
    return (t && t.min) || MIN_PIEZAS;
  }
  function pasoDe(p) { return porPieza(p) ? (p.p || 1000) : 1; }
  function maxDe(p) { return porPieza(p) ? 10000000 : 999; }
  function cantidadTexto(p, n) {
    return porPieza(p)
      ? n.toLocaleString("es-MX") + (n === 1 ? " pieza" : " piezas")
      : n + (n === 1 ? " caja" : " cajas");
  }
  /* El stepper lleva sus propios límites: así el mismo manejador de clics
     sirve para cajas (1 en 1) y para piezas (de caja en caja). */
  function stepperAttrs(p, v) {
    return ' data-min="' + minDe(p, v) + '" data-paso="' + pasoDe(p) + '" data-max="' + maxDe(p) + '"';
  }
  function limites(el) {
    var w = el.closest("[data-min]");
    return {
      min: w ? Number(w.dataset.min) : 1,
      paso: w ? Number(w.dataset.paso) || 1 : 1,
      max: w ? Number(w.dataset.max) : 999
    };
  }

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(saved)) cart = saved.filter(function (l) { return l && l.id && l.qty > 0; });
    /* Carritos guardados antes del pedido mínimo traían cajas (1, 2, 3…) en
       productos que ahora van por pieza: se suben al mínimo de su medida. */
    cart.forEach(function (l) {
      var p = prodDe(l.id);
      if (porPieza(p) && l.qty < minDe(p, l.v)) l.qty = minDe(p, l.v);
    });
  } catch (e) { cart = []; }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* modo privado */ }
  }

  function fecha(iso) {
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  }

  function money(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MXN";
  }

  /* ============================ filtros ============================ */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function haystack(p) {
    if (!p._h) {
      p._h = norm([p.nombre, p.desc, p.v.join(" "),
                   p.mat.map(function (m) { return MATS[m]; }).join(" "),
                   (CATS.filter(function (c) { return c.id === p.cat; })[0] || {}).nombre || ""
                  ].join(" "));
    }
    return p._h;
  }

  /* Equivalencias del asistente, reutilizadas aquí: quien busca "vasos para
     café" no encuentra nada, porque en el catálogo se llaman "vaso de papel".
     La tabla se edita en un solo lugar, agente-criterios.js (SINONIMOS). */
  /* Se arma en la primera búsqueda, no al cargar: agente-criterios.js está
     después de este script en el HTML, así que al iniciar todavía no existe. */
  var SINON = null;

  function sinonimos() {
    if (SINON) return SINON;
    var tabla = (window.GREENOVA_AGENTE || {}).SINONIMOS;
    /* Si todavía no carga, se devuelve vacío SIN memorizar: la primera
       búsqueda puede ocurrir en el arranque, cuando el archivo de criterios
       aún no existe, y memorizar ahí dejaría la tabla vacía para siempre. */
    if (!tabla) return [];
    SINON = tabla.map(function (g) {
      return {
        dice: g.dice.map(function (t) {
          return new RegExp("(^| )" + norm(t).replace(/[^a-z0-9 ]/g, " ").trim() + "(e?s)?( |$)");
        }),
        /* Frases del catálogo que satisfacen esa intención. Se prueban como
           substring, así que "vaso de papel" no arrastra a los PET. */
        frases: (g.busca || [g.es]).map(norm)
      };
    });
    return SINON;
  }

  function frasesSinonimo(q) {
    var n = norm(q).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    var out = [];
    sinonimos().forEach(function (g) {
      for (var i = 0; i < g.dice.length; i++) {
        if (g.dice[i].test(n)) { out = out.concat(g.frases); return; }
      }
    });
    return out;
  }

  /* Capacidad: no es un campo aparte, son las "N oz" que cada variante ya
     trae en `v` (p.ej. "12 oz · boca 90 mm"). Se lee de ahí en vez de
     inventar un dato de capacidad que el catálogo no declara aparte. */
  function ozDe(p) {
    if (!p._oz) {
      var out = [];
      p.v.forEach(function (v) {
        var m = v.match(/(\d+)\s*oz/i);
        if (m && out.indexOf(m[1]) === -1) out.push(m[1]);
      });
      p._oz = out;
    }
    return p._oz;
  }

  function pasaFiltros(p) {
    if (state.linea && (!p.venta || p.venta.linea !== state.linea)) return false;
    if (state.cat !== "todo" && p.cat !== state.cat) return false;
    if (state.stock === "disponible" && (PROMOS[p.id] || {}).agotado) return false;
    if (state.stock === "agotado" && !(PROMOS[p.id] || {}).agotado) return false;
    if (state.mats.length && !state.mats.some(function (m) { return p.mat.indexOf(m) > -1; })) return false;
    if (state.oz.length && !ozDe(p).some(function (o) { return state.oz.indexOf(o) > -1; })) return false;
    return true;
  }

  function filtered() {
    var q = norm(state.q.trim());
    var terms = q ? q.split(/\s+/) : [];
    var out = BASE.filter(function (p) {
      if (!pasaFiltros(p)) return false;
      if (terms.length) {
        var h = haystack(p);
        return terms.every(function (t) { return h.indexOf(t) > -1; });
      }
      return true;
    });

    /* Segunda pasada por equivalencias, que se suma a la literal en vez de
       reemplazarla: "frappé" aparece escrito en la ficha del PET pero no en la
       del PLA, y quien pregunta por frappé quiere ver los dos. */
    if (terms.length) {
      var frases = frasesSinonimo(state.q);
      if (frases.length) {
        BASE.forEach(function (p) {
          if (out.indexOf(p) > -1 || !pasaFiltros(p)) return;
          var h = haystack(p);
          if (frases.some(function (f) { return h.indexOf(f) > -1; })) out.push(p);
        });
      }
    }

    var order = CATS.map(function (c) { return c.id; });
    out.sort(function (a, b) {
      if (state.sort === "az") return a.nombre.localeCompare(b.nombre, "es");
      if (state.sort === "za") return b.nombre.localeCompare(a.nombre, "es");
      if (state.sort === "cat") {
        var d = order.indexOf(a.cat) - order.indexOf(b.cat);
        return d || a.nombre.localeCompare(b.nombre, "es");
      }
      var da = a.destacado ? 0 : 1, db = b.destacado ? 0 : 1;
      return (da - db) || (order.indexOf(a.cat) - order.indexOf(b.cat)) ||
             a.nombre.localeCompare(b.nombre, "es");
    });
    return out;
  }

  /* ============================ chips ============================ */
  function countFor(catId) {
    return BASE.filter(function (p) { return catId === "todo" || p.cat === catId; }).length;
  }

  function buildChips() {
    var conVenta = BASE.filter(function (p) { return p.venta; });
    var bloqueLineas = $("bloque-lineas");
    if (bloqueLineas) {
      bloqueLineas.hidden = conVenta.length === 0;
      if (conVenta.length) {
        $("lineas").innerHTML = LINEAS.map(function (l) {
          var n = conVenta.filter(function (p) { return p.venta.linea === l[0]; }).length;
          if (!n) return "";
          return '<button class="chip chip--sm" data-linea="' + l[0] + '" aria-pressed="false">' +
                 l[1] + '<span class="chip__n">' + n + "</span></button>";
        }).join("");
      }
    }

    var cats = $("cats");
    var html = ['<button class="chip" data-cat="todo" aria-pressed="true">Todo' +
                '<span class="chip__n">' + BASE.length + "</span></button>"];
    CATS.forEach(function (c) {
      html.push('<button class="chip" data-cat="' + c.id + '" aria-pressed="false">' +
                '<svg class="ico" aria-hidden="true"><use href="#' + c.icono + '"></use></svg>' +
                c.nombre + '<span class="chip__n">' + countFor(c.id) + "</span></button>");
    });
    cats.innerHTML = html.join("");

    var mats = $("mats");
    var used = {};
    BASE.forEach(function (p) { p.mat.forEach(function (m) { used[m] = (used[m] || 0) + 1; }); });
    mats.innerHTML = Object.keys(used).sort(function (a, b) { return used[b] - used[a]; })
      .map(function (m) {
        return '<button class="chip chip--sm" data-mat="' + m + '" aria-pressed="false">' +
               MATS[m] + '<span class="chip__n">' + used[m] + "</span></button>";
      }).join("");

    var bloqueCap = $("bloque-cap");
    if (bloqueCap) {
      var usedOz = {};
      BASE.forEach(function (p) { ozDe(p).forEach(function (o) { usedOz[o] = (usedOz[o] || 0) + 1; }); });
      var ozKeys = Object.keys(usedOz).sort(function (a, b) { return Number(a) - Number(b); });
      bloqueCap.hidden = ozKeys.length === 0;
      if (ozKeys.length) {
        $("caps").innerHTML = ozKeys.map(function (o) {
          return '<button class="chip chip--sm" data-oz="' + o + '" aria-pressed="false">' +
                 o + " oz" + '<span class="chip__n">' + usedOz[o] + "</span></button>";
        }).join("");
      }
    }
  }

  function syncChips() {
    if (!$("cats")) return;
    Array.prototype.forEach.call($("cats").children, function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat));
    });
    Array.prototype.forEach.call($("mats").children, function (b) {
      b.setAttribute("aria-pressed", String(state.mats.indexOf(b.dataset.mat) > -1));
    });
    if ($("lineas")) {
      Array.prototype.forEach.call($("lineas").children, function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.linea === state.linea));
      });
    }
    if ($("caps")) {
      Array.prototype.forEach.call($("caps").children, function (b) {
        b.setAttribute("aria-pressed", String(state.oz.indexOf(b.dataset.oz) > -1));
      });
    }
    var dot = $("filter-dot");
    if (dot) dot.hidden = state.mats.length === 0 && state.oz.length === 0 && !state.linea;
  }

  /* ============================ tarjetas ============================ */
  /* Precio: si no hay lista, "bajo cotización". Con `precio` y promo activa,
     se tacha el de lista y se muestra el de oferta. */
  function precioHTML(p, vi) {
    var promo = PROMOS[p.id];
    /* Papel/PET/Kraft se venden por pieza (ver `venta` en productos.js): el
       precio de la tarjeta sigue la medida elegida en el <select>, igual que
       en la ficha del producto. */
    if (p.venta) {
      var t = p.venta.tam[vi || 0];
      if (!t || t.precio == null) return "Aún sin precio para esta medida";
      var precioPza = promo && promo.desc ? t.precio * (1 - promo.desc / 100) : t.precio;
      return (promo && promo.desc
        ? "<s>" + money(t.precio) + "</s> <b>" + money(precioPza) + "</b>"
        : money(precioPza)) + " por pieza";
    }
    if (!p.precio) {
      return promo && promo.desc
        ? '<b>-' + promo.desc + '%</b> sobre el precio de lista'
        : "Precio bajo cotización";
    }
    if (promo && promo.desc) {
      var off = p.precio * (1 - promo.desc / 100);
      return '<s>' + money(p.precio) + "</s> <b>" + money(off) + "</b> por caja";
    }
    return money(p.precio) + " por caja";
  }

  function card(p, i) {
    var line = cart.filter(function (l) { return l.id === p.id; })[0];
    var promo = PROMOS[p.id];
    var badges = p.mat.map(function (m) {
      return '<span class="tag tag--' + m + '">' + MATS[m] + "</span>";
    }).join("");
    if (p.sello) badges = '<span class="tag tag--sello"><svg class="ico" aria-hidden="true">' +
      '<use href="#i-seal-check"></use></svg>' + p.sello + "</span>" + badges;

    /* Medidas agotadas una por una (panel): salen en el selector pero no se
       pueden elegir, y la tarjeta arranca en la primera que sí hay. */
    var agotadas = p.agotadas || [];
    var libres = p.v.filter(function (v) { return agotadas.indexOf(v) === -1; });
    var todasAgotadas = libres.length === 0;
    var selIdx = line ? Math.max(0, p.v.indexOf(line.v)) : Math.max(0, p.v.indexOf(libres[0]));
    var opts = p.v.map(function (v, k) {
      var ag = agotadas.indexOf(v) > -1;
      return '<option value="' + v + '"' + (k === selIdx ? " selected" : "") + (ag ? " disabled" : "") + ">" +
             v + (ag ? " — agotado" : "") + "</option>";
    }).join("");
    var selV = p.v[selIdx];
    var pz = porPieza(p);
    var minimo = pz ? minDe(p, selV) : MIN_PIEZAS;

    return '' +
      '<article class="pcard rv" data-d="' + (i % 4) + '" data-id="' + p.id + '"' +
        (line ? ' data-in="true"' : "") + '>' +
        '<a class="pcard__media' + (p.placa ? " pcard__media--placa" : "") +
          '" href="producto.html?id=' + p.id + '" aria-label="Ver la ficha de ' + p.nombre + '">' +
          '<img src="' + src(p.img) + '" alt="' + p.nombre + '" loading="lazy" decoding="async">' +
          (promo && promo.desc ? '<span class="pcard__flag pcard__flag--off">-' + promo.desc + '%</span>' :
            p.destacado ? '<span class="pcard__flag">Más pedido</span>' :
            p.servicio ? '<span class="pcard__flag pcard__flag--srv">Pocas unidades</span>' : "") +
          '<span class="pcard__spec">' + p.v.length + (p.v.length === 1 ? " presentación" : " medidas") + "</span>" +
          ((promo && promo.agotado) || todasAgotadas ? '<span class="pcard__out">Agotado</span>' : "") +
        "</a>" +
        '<div class="pcard__body">' +
          '<div class="pcard__tags">' + badges + "</div>" +
          '<h3><a href="producto.html?id=' + p.id + '">' + p.nombre + "</a></h3>" +
          '<p class="pcard__price">' + precioHTML(p, selIdx) + "</p>" +
          '<p class="pcard__desc">' + p.desc + "</p>" +
          (promo && (promo.nota || promo.hasta)
            ? '<p class="pcard__promo">' +
              (promo.nota ? promo.nota : "Oferta vigente") +
              (promo.hasta ? " · hasta el " + fecha(promo.hasta) : "") + "</p>"
            : "") +
          '<div class="pcard__meta">' +
            (p.p ? '<span><svg class="ico" aria-hidden="true"><use href="#i-package"></use></svg>' +
                   p.p.toLocaleString("es-MX") + " pzs por caja</span>" : "") +
            '<span data-role="min">Mínimo ' + minimo.toLocaleString("es-MX") + " pzs</span>" +
          "</div>" +
        "</div>" +
        '<div class="pcard__buy">' +
          '<label class="pcard__pick">' +
            '<span class="sr-only">Medida de ' + p.nombre + "</span>" +
            "<select data-role=\"variant\">" + opts + "</select>" +
            '<svg class="ico" aria-hidden="true"><use href="#i-caret-down"></use></svg>' +
          "</label>" +
          '<div class="pcard__row">' +
            '<div class="stepper' + (pz ? " stepper--pz" : "") + '" data-role="stepper"' + stepperAttrs(p, selV) + '>' +
              '<button type="button" data-step="-1" aria-label="' + (pz ? "Quitar piezas" : "Quitar una caja") + '">' +
                '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
              '<input type="number" min="' + minDe(p, selV) + '" max="' + maxDe(p) + '" value="' +
                (line ? line.qty : minDe(p, selV)) +
                '" data-role="qty" aria-label="' + (pz ? "Piezas de " : "Cajas de ") + p.nombre + '">' +
              '<button type="button" data-step="1" aria-label="' + (pz ? "Agregar piezas" : "Agregar una caja") + '">' +
                '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
            "</div>" +
            '<button class="btn btn--primary btn--sm pcard__add" type="button" data-role="add">' +
              '<span class="btn__label">' + (line ? "Actualizar" : "Añadir") + "</span>" +
              '<svg class="ico" aria-hidden="true"><use href="#' + (line ? "i-check" : "i-plus") + '"></use></svg>' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</article>";
  }

  /* Tapas relacionadas: la unión de TAPAS_POR_VASO de todos los vasos de la
     categoría activa (no de la lista ya filtrada por búsqueda/material, para
     que la barra no aparezca y desaparezca mientras el cliente escribe). */
  function tapasDeCategoria(catId) {
    var ids = [];
    BASE.filter(function (p) { return p.cat === catId && TAPAS_POR_VASO[p.id]; })
      .forEach(function (v) {
        TAPAS_POR_VASO[v.id].forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
      });
    return ids.map(function (id) { return PRODS.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
  }

  function renderTapasRel() {
    var box = $("tapas-rel");
    if (!box) return;
    var tapas = tapasDeCategoria(state.cat);
    box.hidden = tapas.length === 0;
    if (!tapas.length) return;
    box.innerHTML =
      '<p class="tapas-rel__label">Tapas para estos vasos</p>' +
      '<div class="tapas-rel__list">' +
      tapas.map(function (t) {
        return '<a class="tapas-rel__chip" href="producto.html?id=' + t.id + '">' +
          '<img src="' + src(t.img) + '" alt="" loading="lazy" decoding="async">' +
          "<span>" + t.nombre + "</span></a>";
      }).join("") +
      "</div>";
  }

  function render() {
    var grid = $("grid");
    if (!grid) return;
    var list = filtered();
    grid.innerHTML = list.map(card).join("");
    $("empty").hidden = list.length > 0;
    renderTapasRel();

    var n = list.length;
    $("result-line").textContent = n === 0 ? "" :
      n + (n === 1 ? " producto" : " productos") +
      (state.cat === "todo" ? "" : " en " + (CATS.filter(function (c) { return c.id === state.cat; })[0] || {}).nombre) +
      (state.q.trim() ? ' para "' + state.q.trim() + '"' : "");

    if (reduce) {
      grid.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
    } else if (window.GN && window.GN.observe) {
      window.GN.observe(grid.querySelectorAll(".rv"));
    }
    syncChips();
  }

  /* ============================ carrito ============================ */
  /* Productos distintos en la lista. Antes sumaba cajas, pero ya hay líneas
     que se cuentan en piezas (10,000+) y el globito del carrito explotaba. */
  function total() {
    return cart.length;
  }

  function paintCount() {
    var n = total();
    var el = $("cart-count");
    el.textContent = n;
    el.dataset.empty = String(n === 0);
    if (n > 0 && !reduce) {
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }
  }

  function paintCart() {
    var list = $("cart-list");
    $("cart-empty").hidden = cart.length > 0;
    $("drawer-foot").hidden = cart.length === 0;

    list.innerHTML = cart.map(function (l) {
      var p = PRODS.filter(function (x) { return x.id === l.id; })[0];
      if (!p) return "";
      return '<li class="cart__item" data-id="' + l.id + '">' +
        '<img src="' + src(p.img) + '" alt="" loading="lazy">' +
        '<div class="cart__info">' +
          "<h4>" + p.nombre + "</h4>" +
          '<p class="cart__var">' + l.v + (porPieza(p) ? " · en piezas" : " · en cajas") + "</p>" +
          '<div class="stepper stepper--sm' + (porPieza(p) ? " stepper--pz" : "") + '" data-role="stepper"' + stepperAttrs(p, l.v) + '>' +
            '<button type="button" data-step="-1" aria-label="' + (porPieza(p) ? "Quitar piezas" : "Quitar una caja") + '">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
            '<input type="number" min="' + minDe(p, l.v) + '" max="' + maxDe(p) + '" value="' + l.qty +
              '" data-role="qty" aria-label="' + (porPieza(p) ? "Piezas" : "Cajas") + '">' +
            '<button type="button" data-step="1" aria-label="' + (porPieza(p) ? "Agregar piezas" : "Agregar una caja") + '">' +
              '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
          "</div>" +
        "</div>" +
        '<button class="cart__del" type="button" data-role="del" aria-label="Quitar ' + p.nombre + '">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        "</li>";
    }).join("");

    paintCount();
    paintSummary();
    persist();
  }

  function paintSummary() {
    var box = $("quote-summary");
    if (!box) return;
    box.hidden = cart.length === 0;
    if (!cart.length) return;
    box.innerHTML = "<h3>" + cart.length + (cart.length === 1 ? " producto en tu lista" : " productos en tu lista") + "</h3><ul>" +
      cart.map(function (l) {
        var p = PRODS.filter(function (x) { return x.id === l.id; })[0];
        return p ? "<li><b>" + cantidadTexto(p, l.qty) + "</b> " + p.nombre + " <span>" + l.v + "</span></li>" : "";
      }).join("") + "</ul>";
  }

  function add(id, v, qty) {
    var line = cart.filter(function (l) { return l.id === id && l.v === v; })[0];
    if (line) line.qty = qty;
    else {
      /* misma referencia, otra medida -> reemplaza la línea anterior de ese producto */
      cart = cart.filter(function (l) { return l.id !== id; });
      cart.push({ id: id, v: v, qty: qty });
    }
    paintCart();
  }

  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.dataset.on = "true";
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.dataset.on = "false"; }, 2600);
  }

  /* ============================ drawer ============================ */
  var lastFocus = null;
  function setDrawer(open) {
    var d = $("drawer");
    d.dataset.open = String(open);
    d.setAttribute("aria-hidden", String(!open));
    $("drawer-scrim").hidden = !open;
    document.body.dataset.locked = String(open);
    if (open) { lastFocus = document.activeElement; $("cart-close").focus(); }
    else if (lastFocus) lastFocus.focus();
  }

  /* ============================ eventos ============================ */

  /* El carrito y su cajón viven en las tres páginas de catálogo Y en la ficha
     de producto. El catálogo (chips, buscador, rejilla) solo existe donde hay
     #grid, así que todo eso se monta nada más si la rejilla está presente.
     Así producto.html reutiliza este mismo carrito sin duplicar su lógica. */
  paintCart();

  var HAY_CATALOGO = !!$("grid");

  if (HAY_CATALOGO) {

  /* El mega menú enlaza con ?cat= y ?q=; la tienda arranca ya filtrada. */
  (function () {
    var qs = new URLSearchParams(location.search);
    var cat = qs.get("cat");
    var q = qs.get("q");
    var linea = qs.get("linea");
    if (cat && CATS.some(function (c) { return c.id === cat; })) state.cat = cat;
    if (linea && LINEAS.some(function (l) { return l[0] === linea; })) state.linea = linea;
    if (q) {
      state.q = q; $("q").value = q; $("q-clear").hidden = false;
      /* La primera pintura ocurre antes de que cargue la tabla de
         equivalencias; se repinta una vez que ya está todo en memoria. */
      window.addEventListener("DOMContentLoaded", function () { render(); });
    }
  })();

  buildChips();
  render();

  $("cats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = b.dataset.cat; render();
    document.getElementById("catalogo").scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  });

  $("mats").addEventListener("click", function (e) {
    var b = e.target.closest("[data-mat]"); if (!b) return;
    var m = b.dataset.mat, i = state.mats.indexOf(m);
    if (i > -1) state.mats.splice(i, 1); else state.mats.push(m);
    render();
  });

  if ($("caps")) {
    $("caps").addEventListener("click", function (e) {
      var b = e.target.closest("[data-oz]"); if (!b) return;
      var o = b.dataset.oz, i = state.oz.indexOf(o);
      if (i > -1) state.oz.splice(i, 1); else state.oz.push(o);
      render();
    });
  }

  if ($("lineas")) {
    $("lineas").addEventListener("click", function (e) {
      var b = e.target.closest("[data-linea]"); if (!b) return;
      state.linea = state.linea === b.dataset.linea ? "" : b.dataset.linea;
      render();
    });
  }

  var clearBtn = $("facets-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      state.mats = []; state.oz = []; state.cat = "todo"; state.q = ""; state.stock = "todo"; state.linea = "";
      $("q").value = ""; $("q-clear").hidden = true;
      var sb = $("stock");
      if (sb) Array.prototype.forEach.call(sb.children, function (x) {
        x.setAttribute("aria-pressed", String(x.dataset.stock === "todo"));
      });
      render();
    });
  }

  var filterBtn = $("filter-open");
  if (filterBtn) {
    var panel = $("facets") || $("side");
    var angosto = window.matchMedia("(max-width: 900px)");

    /* En móvil el panel arranca plegado y el botón lo abre; en escritorio la
       barra lateral está siempre a la vista y el botón no se muestra.
       El CSS ya trae `.side[hidden] { display: none }`, pero el marcado nunca
       ponía el atributo: la barra salía desplegada en el teléfono y empujaba la
       rejilla ~860 px hacia abajo antes de que se viera un solo producto. */
    function sincronizaPanel() {
      panel.hidden = angosto.matches;
      filterBtn.setAttribute("aria-expanded", String(!panel.hidden));
    }
    sincronizaPanel();
    angosto.addEventListener("change", sincronizaPanel);

    filterBtn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      this.setAttribute("aria-expanded", String(!panel.hidden));
    });
  }

  var qt;
  $("q").addEventListener("input", function () {
    var v = this.value;
    $("q-clear").hidden = !v;
    clearTimeout(qt);
    qt = setTimeout(function () { state.q = v; render(); }, 140);
  });
  $("q-clear").addEventListener("click", function () {
    $("q").value = ""; this.hidden = true; state.q = ""; render(); $("q").focus();
  });

  $("sort").addEventListener("change", function () { state.sort = this.value; render(); });

  /* Solo existen en ofertas.html; en la tienda simplemente no están. */
  var stockBox = $("stock");
  if (stockBox) {
    stockBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-stock]"); if (!b) return;
      state.stock = b.dataset.stock;
      Array.prototype.forEach.call(stockBox.children, function (x) {
        x.setAttribute("aria-pressed", String(x.dataset.stock === state.stock));
      });
      render();
    });
  }

  var colsBox = $("cols");
  if (colsBox) {
    var savedCols = null;
    try { savedCols = localStorage.getItem("greenova.columnas"); } catch (e) { /* modo privado */ }
    function setCols(n) {
      $("grid").style.setProperty("--cols", n);
      Array.prototype.forEach.call(colsBox.children, function (x) {
        x.setAttribute("aria-pressed", String(x.dataset.cols === String(n)));
      });
      try { localStorage.setItem("greenova.columnas", n); } catch (e) { /* modo privado */ }
    }
    colsBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cols]"); if (b) setCols(b.dataset.cols);
    });
    setCols(savedCols || colsBox.dataset.def || 4);
  }

  }   /* fin del bloque de catálogo */

  /* steppers y botones: sirven igual en la rejilla, en el cajón y en la ficha */
  function stepperOf(el) { return el.closest("[data-role='stepper']"); }

  document.addEventListener("click", function (e) {
    var stepBtn = e.target.closest("[data-step]");
    if (stepBtn) {
      var wrap = stepperOf(stepBtn);
      var input = wrap.querySelector("[data-role='qty']");
      var lim = limites(wrap);
      var next = Math.min(lim.max, Math.max(lim.min,
        (parseInt(input.value, 10) || lim.min) + Number(stepBtn.dataset.step) * lim.paso));
      input.value = next;
      var item = stepBtn.closest(".cart__item");
      if (item) {
        var l = cart.filter(function (x) { return x.id === item.dataset.id; })[0];
        if (l) { l.qty = next; paintCount(); paintSummary(); persist(); }
      }
      return;
    }

    var del = e.target.closest("[data-role='del']");
    if (del) {
      var li = del.closest(".cart__item");
      cart = cart.filter(function (x) { return x.id !== li.dataset.id; });
      var c = document.querySelector('.pcard[data-id="' + li.dataset.id + '"]');
      if (c) {
        c.removeAttribute("data-in");
        c.querySelector(".pcard__add .btn__label").textContent = "Añadir";
        c.querySelector(".pcard__add use").setAttribute("href", "#i-plus");
      }
      paintCart();
      return;
    }

    var addBtn = e.target.closest("[data-role='add']");
    if (addBtn) {
      var pc = addBtn.closest(".pcard, .ficha__compra");
      var v = pc.querySelector("[data-role='variant']").value;
      var prod = PRODS.filter(function (x) { return x.id === pc.dataset.id; })[0];
      if ((prod.agotadas || []).indexOf(v) > -1) { toast("Esa medida está agotada por ahora"); return; }
      var qty = Math.min(maxDe(prod), Math.max(minDe(prod, v),
        parseInt(pc.querySelector("[data-role='qty']").value, 10) || 0));
      add(pc.dataset.id, v, qty);
      pc.dataset.in = "true";
      addBtn.querySelector(".btn__label").textContent = "Actualizar";
      addBtn.querySelector("use").setAttribute("href", "#i-check");
      if (!reduce) { addBtn.classList.remove("did"); void addBtn.offsetWidth; addBtn.classList.add("did"); }
      toast(cantidadTexto(prod, qty) + " de " + prod.nombre.toLowerCase() + " en tu carrito");
      return;
    }

    /* clic en cualquier parte de la tarjeta (fuera de la franja de compra y de
       los enlaces que ya navegan solos) también manda a la ficha del producto */
    var body = e.target.closest(".pcard__body");
    if (body && !e.target.closest("a") && !(window.getSelection() + "")) {
      window.location.href = "producto.html?id=" + body.closest(".pcard").dataset.id;
      return;
    }
  });

  document.addEventListener("change", function (e) {
    var input = e.target.closest("[data-role='qty']");
    if (input) {
      var lim = limites(input);
      input.value = Math.min(lim.max, Math.max(lim.min, parseInt(input.value, 10) || lim.min));
      var item = input.closest(".cart__item");
      if (item) {
        var l = cart.filter(function (x) { return x.id === item.dataset.id; })[0];
        if (l) { l.qty = Number(input.value); paintCount(); paintSummary(); persist(); }
      }
    }
    /* cambiar de medida en una tarjeta ya agregada obliga a confirmar de nuevo */
    var sel = e.target.closest("[data-role='variant']");
    if (sel) {
      var pc = sel.closest(".pcard");
      /* En la ficha de producto el selector NO vive dentro de una .pcard.
         Sin esta guarda, cambiar de medida con el carrito lleno reventaba con
         "Cannot read properties of null (reading 'dataset')". No saltaba con el
         carrito vacío porque `filter` no llega a ejecutar el callback. */
      if (pc) {
        var prodSel = PRODS.filter(function (x) { return x.id === pc.dataset.id; })[0];
        var precioEl = pc.querySelector(".pcard__price");
        if (prodSel && precioEl) {
          var vi = prodSel.v.indexOf(sel.value);
          precioEl.innerHTML = precioHTML(prodSel, vi < 0 ? 0 : vi);
        }
        /* Cada medida puede tener su propio pedido mínimo. */
        if (porPieza(prodSel)) {
          var m = minDe(prodSel, sel.value);
          var st = pc.querySelector("[data-role='stepper']");
          var q = st.querySelector("[data-role='qty']");
          st.dataset.min = m; q.min = m;
          if ((parseInt(q.value, 10) || 0) < m) q.value = m;
          var etq = pc.querySelector("[data-role='min']");
          if (etq) etq.textContent = "Mínimo " + m.toLocaleString("es-MX") + " pzs";
        }
      }
      var l2 = pc && cart.filter(function (x) { return x.id === pc.dataset.id; })[0];
      if (l2 && l2.v !== sel.value) {
        pc.querySelector(".pcard__add .btn__label").textContent = "Actualizar";
        pc.querySelector(".pcard__add use").setAttribute("href", "#i-check");
      }
    }
  });

  $("cart-open").addEventListener("click", function () { setDrawer(true); });
  $("cart-close").addEventListener("click", function () { setDrawer(false); });
  $("drawer-scrim").addEventListener("click", function () { setDrawer(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("drawer").dataset.open === "true") setDrawer(false);
  });

  $("cart-clear").addEventListener("click", function () {
    cart = [];
    document.querySelectorAll('[data-in="true"]').forEach(function (c) {
      if (!c.querySelector(".pcard__add")) return;
      c.removeAttribute("data-in");
      c.querySelector(".pcard__add .btn__label").textContent = "Añadir";
      c.querySelector(".pcard__add use").setAttribute("href", "#i-plus");
    });
    paintCart();
    toast("Lista vacía");
  });

  $("cart-send").addEventListener("click", function () {
    setDrawer(false);
    /* En la ficha de producto no hay formulario: el enlace lleva a la tienda. */
    setTimeout(function () {
      var n = $("s-nombre");
      if (n) n.focus({ preventScroll: true });
    }, 400);
  });

  /* enlaces del footer que saltan a una categoría */
  document.querySelectorAll("[data-cat][href]").forEach(function (a) {
    a.addEventListener("click", function () {
      state.cat = this.dataset.cat; state.q = ""; $("q").value = ""; render();
    });
  });

  /* ============================ envío ============================ */
  var form = $("shop-form");
  if (form) {
    var status = $("shop-status"), submit = $("shop-submit");
    var label = submit.querySelector(".btn__label");

    function setError(id, message) {
      var input = $(id);
      var slot = form.querySelector('[data-err="' + id + '"]');
      input.closest(".field").dataset.invalid = message ? "true" : "false";
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (slot) slot.textContent = message || "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";

      var ok = true;
      setError("s-nombre", $("s-nombre").value.trim() ? "" : (ok = false, "Escribe tu nombre."));
      setError("s-correo",
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("s-correo").value.trim()) ? "" : (ok = false, "Escribe un correo válido."));
      if (!ok) {
        status.textContent = "Revisa los campos marcados.";
        form.querySelector('[data-invalid="true"] input').focus();
        return;
      }
      if (!cart.length) {
        status.dataset.state = "warn";
        status.textContent = "Tu lista está vacía. Agrega al menos un producto del catálogo.";
        document.getElementById("catalogo").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        return;
      }

      submit.dataset.loading = "true";
      label.textContent = "Preparando";

      var d = Object.fromEntries(new FormData(form).entries());
      var lines = cart.map(function (l) {
        var p = PRODS.filter(function (x) { return x.id === l.id; })[0];
        return "- " + (p ? cantidadTexto(p, l.qty) : l.qty) + " de " + (p ? p.nombre : l.id) + " (" + l.v + ")";
      }).join("\n");

      var body = [
        "Nombre: " + d.nombre,
        "Negocio: " + (d.negocio || "No indicado"),
        "Correo: " + d.correo,
        "Telefono: " + (d.telefono || "No indicado"),
        "",
        "PRODUCTOS SOLICITADOS (" + total() + (total() === 1 ? " producto" : " productos") + "):",
        lines,
        "",
        "Notas:",
        d.mensaje || "Sin notas."
      ].join("\n");

      /* PENDIENTE: sustituir por un POST a un endpoint real (ver README). */
      window.location.href = "mailto:ventas@greenovasc.com.mx?subject=" +
        encodeURIComponent("Cotización desde la tienda (" + cart.length + " productos)") +
        "&body=" + encodeURIComponent(body);

      setTimeout(function () {
        submit.dataset.loading = "false";
        label.textContent = "Enviar pedido";
        status.dataset.state = "ok";
        status.textContent = "Listo. Abrimos tu correo con la lista completa. Si no se abrió, escribe a ventas@greenovasc.com.mx";
        if (!reduce && window.GN && window.GN.burst) window.GN.burst(submit);
      }, 420);
    });

    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.dataset.invalid === "true") setError(e.target.id, "");
    });
  }

  /* El editor del panel abre esta misma página dentro de un iframe y, cuando
     cambias un precio o marcas un agotado, muta el catálogo y llama a repintar.
     Así lo que ves editando es exactamente lo que ve el cliente: no hay una
     segunda plantilla que se pueda desincronizar. */
  window.GNTienda = { repintar: render };
})();
