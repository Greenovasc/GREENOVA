/* GreeNova SC - tienda.
   Catálogo filtrable + carrito persistente en localStorage.

   Feedback final (2026-09-27): se vende por PAQUETE o por CAJA, con los
   precios de la lista de Excel (IVA incluido) y el mínimo es un paquete.
   Cada medida trae en venta.tam[i] sus piezas por paquete y por caja, sus
   precios, su boca en mm y, si la tiene, su propia foto.
   Sin dependencias, sin listeners de scroll: los reveals los maneja greenova.js. */
(function () {
  "use strict";
  if (!window.GREENOVA) return;

  var CATS = window.GREENOVA.CATEGORIAS;
  var MATS = window.GREENOVA.MATERIALES;
  var PRODS = window.GREENOVA.PRODUCTOS;
  var PROMOS = window.GREENOVA.PROMOS || {};

  /* "todo" = catálogo completo (tienda.html) | "ofertas" = outlet (ofertas.html) */
  var MODO = document.body.dataset.modo || "todo";
  var BASE = MODO === "ofertas"
    ? PRODS.filter(function (p) { return PROMOS[p.id]; })
    : PRODS;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* v2: el carrito de antes contaba piezas y cajas de otro catálogo. */
  var KEY = "greenova.carrito.v2";

  /* Qué tapas le quedan a qué vasos: misma boca, familia correspondiente. */
  var FAMILIA_TAPAS = { "vasos-papel": "tapas-papel", "vasos-pet": "tapas-pet", "contenedores": "tapas-contenedor" };

  /* Secciones de la tienda (Gabriel, 2026-10-03): "que venga ordenado: vasos
     (todos los vasos), tapas (todas las tapas), etc." Cada sección junta
     categorías del catálogo; el orden de aquí es el orden de la tienda. Una
     categoría nueva que no esté en ninguna sale al final, en "Más productos". */
  var SECCIONES = [
    { id: "vasos", nombre: "Vasos", cats: ["vasos-papel", "vasos-pet"] },
    { id: "tapas", nombre: "Tapas", cats: ["tapas-papel", "tapas-pet", "tapas-contenedor"] },
    { id: "comida", nombre: "Comida para llevar", cats: ["contenedores", "cajas-charolas", "ensaladeras", "souffles"] },
    { id: "accesorios", nombre: "Accesorios para bebida", cats: ["fajillas", "removedores", "popotes", "portavasos"] },
    { id: "bolsas", nombre: "Bolsas, servilletas y envoltura", cats: ["bolsas", "servilletas-papel"] }
  ];
  (function () {
    var usadas = [];
    SECCIONES.forEach(function (s) { usadas = usadas.concat(s.cats); });
    var resto = CATS.map(function (c) { return c.id; }).filter(function (id) { return usadas.indexOf(id) === -1; });
    if (resto.length) SECCIONES.push({ id: "mas", nombre: "Más productos", cats: resto });
  })();
  function seccionDe(cat) {
    return SECCIONES.filter(function (s) { return s.cats.indexOf(cat) > -1; })[0] || null;
  }
  /* Orden de la tienda: el de las secciones y, dentro, el de sus categorías. */
  var ORDEN_CATS = [];
  SECCIONES.forEach(function (s) { ORDEN_CATS = ORDEN_CATS.concat(s.cats); });

  var $ = function (id) { return document.getElementById(id); };

  /* Las rutas de imagen se resuelven por aquí para que build-single.py pueda
     sustituirlas por data URIs en el archivo autocontenido. */
  function src(name) {
    var path = "assets/prod/" + name + ".webp";
    /* ?v= obliga al navegador a bajar la foto nueva si se reemplazó */
    return (window.GN_ASSETS && window.GN_ASSETS[path]) || path + "?v=20260927b";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function money(n) {
    return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmt(n) { return n.toLocaleString("es-MX"); }

  /* ============================ venta ============================ */
  function prodDe(id) { return PRODS.filter(function (x) { return x.id === id; })[0]; }
  function tamDe(p, v) {
    var i = p ? p.v.indexOf(v) : -1;
    return i > -1 && p.venta ? p.venta.tam[i] : null;
  }
  /* Con oferta activa (panel), el precio baja ese porcentaje. */
  function conPromo(p, precio) {
    var promo = PROMOS[p.id];
    return precio != null && promo && promo.desc ? precio * (1 - promo.desc / 100) : precio;
  }
  /* Presentaciones que sí se pueden comprar: con piezas y con precio. */
  function unidades(t) {
    var out = [];
    if (t && t.paq && t.pPaq != null) out.push("paq");
    if (t && t.caja && t.pCaja != null) out.push("caja");
    return out;
  }
  function precioDe(p, t, u) { return conPromo(p, u === "paq" ? t.pPaq : t.pCaja); }
  function piezasDe(t, u) { return u === "paq" ? t.paq : t.caja; }
  function unidadTexto(u, n) {
    return u === "paq" ? (n === 1 ? "paquete" : "paquetes") : (n === 1 ? "caja" : "cajas");
  }
  function cantidadTexto(l) {
    var t = tamDe(prodDe(l.id), l.v);
    var pz = t ? piezasDe(t, l.u) * l.qty : 0;
    return l.qty + " " + unidadTexto(l.u, l.qty) + (pz ? " (" + fmt(pz) + " pzs)" : "");
  }
  function subtotal(l) {
    var p = prodDe(l.id), t = tamDe(p, l.v);
    var precio = t ? precioDe(p, t, l.u) : null;
    return precio == null ? null : precio * l.qty;
  }
  function imgDe(p, v) {
    var t = tamDe(p, v);
    return (t && t.img) || p.img;
  }

  /* Bloque de precios de una medida: paquete y caja, con la presentación
     elegida resaltada. Sirve a la tarjeta y al carrito. */
  function preciosHTML(p, t, uSel) {
    var us = unidades(t);
    /* Sin precio en la lista (popotes, portavasos, servilletas…): se cotiza. */
    if (!us.length) return '<p class="precios__nada"><b>Se cotiza.</b> Lo surtimos sobre pedido: dinos cuánto ' +
      "necesitas y te mandamos precio y tiempo de entrega.</p>";
    var promo = PROMOS[p.id];
    return us.map(function (u) {
      var base = u === "paq" ? t.pPaq : t.pCaja;
      var final = precioDe(p, t, u);
      return '<p class="precios__fila" data-u="' + u + '"' + (u === uSel ? ' data-sel="true"' : "") + ">" +
        "<span>" + (u === "paq" ? "Paquete" : "Caja") + " · " + fmt(piezasDe(t, u)) + (piezasDe(t, u) === 1 ? " pz" : " pzs") + "</span>" +
        "<b>" + (promo && promo.desc ? "<s>" + money(base) + "</s> " : "") + money(final) + "</b></p>";
    }).join("") + '<p class="precios__iva">IVA incluido</p>';
  }

  function unidadesHTML(t, uSel) {
    var us = unidades(t);
    return us.map(function (u) {
      return '<button type="button" data-u="' + u + '" aria-pressed="' + (u === uSel) + '">' +
        (u === "paq" ? "Paquete" : "Caja") + "</button>";
    }).join("");
  }

  /* ============================ carrito ============================ */
  var cart = [];
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(saved)) {
      cart = saved.filter(function (l) {
        var t = l && tamDe(prodDe(l.id), l.v);
        return t && unidades(t).indexOf(l.u) > -1 && l.qty > 0;
      });
    }
  } catch (e) { cart = []; }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* modo privado */ }
  }
  function lineaDe(id, v, u) {
    return cart.filter(function (l) { return l.id === id && l.v === v && l.u === u; })[0];
  }

  /* ============================ estado ============================ */
  var state = { sec: "todo", cat: "todo", oz: [], q: "", sort: "todos" };

  /* "Mostrar más" (Gabriel, 2026-10-03): no todo de golpe. Se ven PASO
     productos y el botón de en medio trae los siguientes. */
  var PASO = 12;
  var ver = PASO, firmaAntes = "";
  /* "Más vendidos": ids ordenados por cuántos pedidos los llevan (/api/populares). */
  var POPULARES = null;
  /* "Nuestros mejores precios": el precio por pieza más bajo de sus medidas. */
  function precioPieza(p) {
    var min = null;
    (p.venta ? p.venta.tam : []).forEach(function (t) {
      [[t.pPaq, t.paq], [t.pCaja, t.caja]].forEach(function (x) {
        if (x[0] != null && x[1]) { var v = x[0] / x[1]; if (min === null || v < min) min = v; }
      });
    });
    return min;
  }

  /* ============================ filtros ============================ */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function haystack(p) {
    if (!p._h) {
      p._h = norm([p.nombre, p.desc, p.uso || "", p.v.join(" "),
                   p.venta ? p.venta.tam.map(function (t) { return t.esp || ""; }).join(" ") : "",
                   p.mat.map(function (m) { return MATS[m]; }).join(" "),
                   (CATS.filter(function (c) { return c.id === p.cat; })[0] || {}).nombre || ""
                  ].join(" "));
    }
    return p._h;
  }

  /* Equivalencias del asistente, reutilizadas aquí: quien busca "vasos para
     café" no encuentra nada, porque en el catálogo se llaman "vaso de papel".
     La tabla se edita en un solo lugar, agente-criterios.js (SINONIMOS). Se
     arma en la primera búsqueda, por si algún día ese archivo carga después. */
  var SINON = null;
  function sinonimos() {
    if (SINON) return SINON;
    var tabla = (window.GREENOVA_AGENTE || {}).SINONIMOS;
    if (!tabla) return [];
    SINON = tabla.map(function (g) {
      return {
        dice: g.dice.map(function (t) {
          return new RegExp("(^| )" + norm(t).replace(/[^a-z0-9 ]/g, " ").trim() + "(e?s)?( |$)");
        }),
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

  /* Capacidad: las "N oz" que cada medida ya trae en `v`. */
  function ozDeV(v) { var m = v.match(/(\d+)\s*oz/i); return m ? m[1] : null; }
  function ozDe(p) {
    if (!p._oz) {
      var out = [];
      p.v.forEach(function (v) { var o = ozDeV(v); if (o && out.indexOf(o) === -1) out.push(o); });
      p._oz = out;
    }
    return p._oz;
  }

  function enSeleccion(p) {
    if (state.cat !== "todo") return p.cat === state.cat;
    if (state.sec !== "todo") {
      var s = SECCIONES.filter(function (x) { return x.id === state.sec; })[0];
      return !!s && s.cats.indexOf(p.cat) > -1;
    }
    return true;
  }

  function pasaFiltros(p) {
    if (!enSeleccion(p)) return false;
    if (state.oz.length && !ozDe(p).some(function (o) { return state.oz.indexOf(o) > -1; })) return false;
    return true;
  }

  /* ---------- búsqueda que entiende faltas de ortografía ----------
     Gabriel (2026-09-29): "aunque el usuario escriba mal, la página lo tiene
     que entender" ("vacho" -> vaso). Cada palabra buscada que no aparece tal
     cual se cambia por la palabra del catálogo que más se le parece:
     - se comparan "como suenan": b = v, s = z = c(e, i), y = ll, k = c = qu,
       sin h muda; y sin plural (vasos = vaso);
     - se permiten 1 cambio en palabras de 4 letras, 2 de 5 a 7 y 3 de 8 o más
       (letra de más, de menos, cambiada o dos letras volteadas);
     - primero se busca en nombres y categorías y luego en lo demás.
     Los números no se corrigen (12 no es 16). */
  var VACIAS = { de: 1, del: 1, la: 1, el: 1, los: 1, las: 1, para: 1, con: 1, un: 1, una: 1, y: 1, o: 1, en: 1, por: 1 };
  /* Cómo lo dice la gente -> cómo se llama en el catálogo. */
  var EQUIV = {
    onza: "oz", onzas: "oz", ozs: "oz", tapadera: "tapa", tapaderas: "tapa", vasito: "vaso", vasitos: "vaso",
    termico: "doble pared", termicos: "doble pared", agitador: "removedor", agitadores: "removedor",
    mezclador: "removedor", mezcladores: "removedor", palito: "removedor", palitos: "removedor",
    manga: "fajilla", mangas: "fajilla", funda: "fajilla", fundas: "fajilla", cinturon: "fajilla",
    transparente: "pet", desechable: "", desechables: "", biodegradable: "", biodegradables: "",
    bowl: "ensaladera", bowls: "ensaladera", salsero: "souffle", salseros: "souffle", sufle: "souffle"
  };
  function suena(w) {
    w = w.replace(/ll/g, "y").replace(/qu/g, "k").replace(/c([ei])/g, "s$1").replace(/z/g, "s")
         .replace(/c(?!h)/g, "k").replace(/v/g, "b").replace(/w/g, "u").replace(/(^|[^c])h/g, "$1");
    if (w.length > 4 && /[^aeiou]es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && /s$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  function distancia(a, b, tope) {
    if (Math.abs(a.length - b.length) > tope) return tope + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var minFila = tope + 1;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < minFila) minFila = d[i][j];
      }
      if (minFila > tope) return tope + 1;
    }
    return d[a.length][b.length];
  }
  function palabras(t) { return norm(t).replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2").split(/[^a-z0-9ñ]+/).filter(Boolean); }
  /* Lo que se cotiza pero no está en la tienda: si lo buscan (aunque sea mal
     escrito) no se confunde con otra palabra; sale "Sin resultados" con el
     botón para pedirlo. */
  var FUERA = ["plato", "cuchara", "tenedor", "cuchillo", "cubierto", "almeja", "bisagra",
               "domo pastel", "bagazo", "helado", "pizza"]
    .map(function (w) { return { w: w, s: suena(w) }; });
  var VOCAB = null;
  function vocab() {
    if (VOCAB) return VOCAB;
    var fuerte = {}, resto = {};
    BASE.forEach(function (p) {
      palabras(p.nombre + " " + ((CATS.filter(function (c) { return c.id === p.cat; })[0] || {}).nombre || "") + " " +
               p.mat.map(function (m) { return MATS[m]; }).join(" ")).forEach(function (w) { fuerte[w] = 1; });
      palabras(haystack(p)).forEach(function (w) { if (!fuerte[w]) resto[w] = 1; });
    });
    function lista(o) {
      return Object.keys(o).filter(function (w) { return w.length > 2 && !/^\d+$/.test(w) && !VACIAS[w]; })
        .map(function (w) { return { w: w, s: suena(w) }; });
    }
    VOCAB = [lista(fuerte), lista(resto)];
    return VOCAB;
  }
  function tope(n) { return n <= 3 ? 0 : n === 4 ? 1 : 2; }
  /* La palabra del catálogo que corresponde a lo que escribió, o la misma si ya está. */
  function corrige(t) {
    if (/^\d+$/.test(t) || t.length < 3) return t;
    var grupos = vocab();
    if (grupos[0].concat(grupos[1]).some(function (v) { return v.w.indexOf(t) > -1; })) return t;
    var st = suena(t), max = tope(st.length);
    function cercana(lista) {
      var mejor = null, dm = max + 1;
      lista.forEach(function (v) {
        var d = v.s === st ? 0 : distancia(st, v.s, max);
        if (d < dm || (d === dm && mejor && v.w.length < mejor.length)) { dm = d; mejor = v.w; }
      });
      return { w: mejor, d: dm };
    }
    var fuera = cercana(FUERA), c0 = cercana(grupos[0]), c1 = cercana(grupos[1]);
    /* Si suena igual a una palabra del resto (plural, b/v…), gana esa. */
    var c = c1.d === 0 && c0.d > 0 ? c1 : (c0.w && c0.d <= max ? c0 : c1);
    if (fuera.w && fuera.d <= max && fuera.d <= c.d) return t;   // pide algo que no vendemos en línea
    return c.w && c.d <= max ? c.w : t;
  }
  var ultimaCorreccion = "";

  /* ---------- búsqueda por uso ----------
     Gabriel (2026-10-03): quien abrió una heladería busca "vasos para helado"
     y le tienen que salir las opciones que sirven para helado. Si lo que se
     escribió describe un uso o un negocio (tabla GIROS de agente-criterios.js,
     la misma del asistente), la rejilla enseña lo recomendado para ese uso,
     en ese orden, y arriba sale la lista con medida y para qué sirve cada cosa. */
  function agente() { return window.GREENOVA_AGENTE || {}; }
  function usoActual() {
    var A = agente();
    return state.q.trim() && A.usoDe ? A.usoDe(state.q) : null;
  }
  function deUso(uso) {
    var ids = [];
    uso.recs.forEach(function (r) { if (r.id && ids.indexOf(r.id) === -1) ids.push(r.id); });
    var out = ids.map(prodDe).filter(function (p) { return p && BASE.indexOf(p) > -1 && pasaFiltros(p); });
    /* "vasos para helado": si pidió vasos, la rejilla trae solo vasos (las
       tapas siguen en la lista de arriba); igual con "tapas para frappé". */
    var n = norm(state.q);
    var solo = /\bvas/.test(n) ? "vasos" : /\btap/.test(n) ? "tapas" : "";
    var tipo = solo ? out.filter(function (p) { return p.cat.indexOf(solo) === 0; }) : out;
    return tipo.length ? tipo : out;
  }

  function filtered() {
    var uso = usoActual();
    if (uso) {
      ultimaCorreccion = "";
      return ordena(deUso(uso), true);
    }
    var crudos = [];
    palabras(state.q.trim()).forEach(function (t) {
      var e = Object.prototype.hasOwnProperty.call(EQUIV, t) ? EQUIV[t] : t;
      if (e) crudos = crudos.concat(e.split(" "));
    });
    var utiles = crudos.filter(function (t) { return !VACIAS[t]; });
    var terms = (utiles.length ? utiles : crudos).map(corrige);
    /* Se avisa la corrección solo si cambió algo más que el plural. */
    var escrito = (utiles.length ? utiles : crudos).join(" ");
    ultimaCorreccion = terms.join(" ").replace(/e?s\b/g, "") !== escrito.replace(/e?s\b/g, "") ? terms.join(" ") : "";
    var out = BASE.filter(function (p) {
      if (!pasaFiltros(p)) return false;
      if (terms.length) {
        var h = haystack(p);
        return terms.every(function (t) { return h.indexOf(t) > -1; });
      }
      return true;
    });
    if (terms.length) {
      var frases = frasesSinonimo(state.q).concat(ultimaCorreccion ? frasesSinonimo(ultimaCorreccion) : []);
      if (frases.length) {
        BASE.forEach(function (p) {
          if (out.indexOf(p) > -1 || !pasaFiltros(p)) return;
          var h = haystack(p);
          if (frases.some(function (f) { return h.indexOf(f) > -1; })) out.push(p);
        });
      }
    }
    /* Lo que se llama como lo buscado va primero: quien busca "popote" quiere
       popotes antes que las tapas que dicen "con ranura para popote". */
    var porNombre = terms.length ? out.filter(function (p) {
      var n = norm(p.nombre);
      return terms.every(function (t) { return n.indexOf(t) > -1; });
    }) : [];
    return ordena(out, false, porNombre);
  }

  /* El orden que eligió la persona. En "todos", la búsqueda por uso respeta
     el orden de la recomendación (lo más útil primero). */
  function ordena(out, porUso, porNombre) {
    var order = ORDEN_CATS;
    var base = out.slice();
    function relevancia(a, b) {
      if (porUso) return base.indexOf(a) - base.indexOf(b);
      return ((b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)) ||
             (order.indexOf(a.cat) - order.indexOf(b.cat)) || (PRODS.indexOf(a) - PRODS.indexOf(b));
    }
    function catalogo(a, b) {
      return (order.indexOf(a.cat) - order.indexOf(b.cat)) || (PRODS.indexOf(a) - PRODS.indexOf(b));
    }
    var primero = porNombre || [];
    out.sort(function (a, b) {
      if (state.sort === "todos") {
        if (porUso) return relevancia(a, b);
        return ((primero.indexOf(b) > -1) - (primero.indexOf(a) > -1)) || catalogo(a, b);
      }
      if (state.sort === "az") return a.nombre.localeCompare(b.nombre, "es");
      if (state.sort === "za") return b.nombre.localeCompare(a.nombre, "es");
      if (state.sort === "precio") {
        var pa = precioPieza(a), pb = precioPieza(b);
        if (pa === null || pb === null) return (pa === null) - (pb === null) || relevancia(a, b);
        return (pa - pb) || relevancia(a, b);
      }
      if (state.sort === "vendidos" && POPULARES) {
        var ia = POPULARES.indexOf(a.id), ib = POPULARES.indexOf(b.id);
        ia = ia < 0 ? 1e6 : ia; ib = ib < 0 ? 1e6 : ib;
        return (ia - ib) || relevancia(a, b);
      }
      return relevancia(a, b);
    });
    return out;
  }

  /* ============================ barra lateral ============================
     Productos (las categorías del menú) y Capacidad. Sin conteos: Gabriel no
     quiere que se diga cuántos productos hay. La capacidad se arma con lo que
     hay en la categoría elegida, para no ofrecer onzas que no existen ahí. */
  function buildChips() {
    var cats = $("cats");
    var html = ['<button class="chip" data-sec="todo" aria-pressed="true">Todos los productos</button>'];
    SECCIONES.forEach(function (sec) {
      var suyas = CATS.filter(function (c) {
        return sec.cats.indexOf(c.id) > -1 && BASE.some(function (p) { return p.cat === c.id; });
      });
      if (!suyas.length) return;
      html.push('<div class="chips__sec" data-grupo="' + sec.id + '">' +
        '<button class="chip chip--sec" data-sec="' + sec.id + '" aria-pressed="false">' + esc(sec.nombre) + "</button>" +
        (suyas.length > 1 ? '<div class="chips__sub">' + suyas.map(function (c) {
          return '<button class="chip chip--sm" data-cat="' + c.id + '" aria-pressed="false">' + esc(c.nombre) + "</button>";
        }).join("") + "</div>" : "") +
        "</div>");
    });
    cats.innerHTML = html.join("");
    buildCaps();
  }

  function buildCaps() {
    var bloque = $("bloque-cap");
    if (!bloque) return;
    var usados = {};
    BASE.forEach(function (p) {
      if (!enSeleccion(p)) return;
      ozDe(p).forEach(function (o) { usados[o] = true; });
    });
    var ozs = Object.keys(usados).sort(function (a, b) { return Number(a) - Number(b); });
    state.oz = state.oz.filter(function (o) { return usados[o]; });
    bloque.hidden = ozs.length === 0;
    $("caps").innerHTML = ozs.map(function (o) {
      return '<button class="chip chip--sm" data-oz="' + o + '" aria-pressed="' + (state.oz.indexOf(o) > -1) + '">' +
             o + " oz</button>";
    }).join("");
  }

  function syncChips() {
    if (!$("cats")) return;
    /* La sección elegida se abre y enseña sus categorías; las demás, cerradas. */
    /* La sección se marca cuando se ve completa; si se eligió una categoría
       suya, se marca la categoría y la sección queda abierta. */
    Array.prototype.forEach.call($("cats").querySelectorAll("[data-sec]"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.sec === state.sec && state.cat === "todo"));
    });
    Array.prototype.forEach.call($("cats").querySelectorAll(".chips__sec"), function (g) {
      g.classList.toggle("chips__sec--abierta", g.dataset.grupo === state.sec);
    });
    Array.prototype.forEach.call($("cats").querySelectorAll("[data-cat]"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat));
    });
    if ($("caps")) {
      Array.prototype.forEach.call($("caps").children, function (b) {
        b.setAttribute("aria-pressed", String(state.oz.indexOf(b.dataset.oz) > -1));
      });
    }
    var dot = $("filter-dot");
    if (dot) dot.hidden = state.sec === "todo" && state.cat === "todo" && state.oz.length === 0;
  }

  /* ============================ tarjetas ============================
     Gabriel (2026-09-27): afuera, la tarjeta solo dice qué es el producto
     (vasos, tapas o accesorios, y de qué material: si es PET dice PET) y sus
     especificaciones. Paquete, caja y precio van dentro, en la ficha. */
  var TIPO = { "vasos-papel": "Vasos", "vasos-pet": "Vasos", "tapas-papel": "Tapas",
               "tapas-pet": "Tapas", "fajillas": "Accesorios", "removedores": "Accesorios",
               "popotes": "Accesorios", "portavasos": "Accesorios", "servilletas-papel": "Accesorios",
               "tapas-contenedor": "Tapas", "contenedores": "Contenedores", "cajas-charolas": "Contenedores",
               "ensaladeras": "Contenedores", "souffles": "Contenedores", "bolsas": "Bolsas" };

  /* Lo que no tiene ningún precio en la lista se cotiza (Gabriel, 2026-10-03:
     los popotes tienen que salir en la tienda aunque no tengan precio). */
  function seCotiza(p) {
    return !(p.venta && p.venta.tam.some(function (t) { return unidades(t).length > 0; }));
  }

  function lista(xs) {
    return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1];
  }

  function specs(p) {
    var out = [];
    var ozs = ozDe(p).slice().sort(function (a, b) { return a - b; });
    var bocas = [];
    (p.venta ? p.venta.tam : []).forEach(function (t) { if (t.boca && bocas.indexOf(t.boca) === -1) bocas.push(t.boca); });
    bocas.sort(function (a, b) { return a - b; });
    if (ozs.length) out.push(["Capacidad", lista(ozs) + " oz"]);
    if (bocas.length) out.push(["Boca", bocas.length > 3 ? bocas[0] + " a " + bocas[bocas.length - 1] + " mm" : lista(bocas.map(String)) + " mm"]);
    if (!ozs.length && p.cat.indexOf("tapas") === 0 && p.uso) out.push(["Para", p.uso.replace(/^Tapa para /, "")]);
    if (!ozs.length && !bocas.length && p.v.length > 1 && p.v.length <= 4) out.push(["Opciones", lista(p.v.map(function (v) { return v.toLowerCase(); }))]);
    if (!ozs.length && !bocas.length && p.v.length === 1) out.push(["Medida", p.v[0]]);
    return out;
  }

  function card(p, i) {
    var promo = PROMOS[p.id];
    var agotadas = p.agotadas || [];
    var tipo = TIPO[p.cat];
    var tags = (tipo ? '<span class="tag tag--tipo">' + tipo + "</span>" : "") +
      p.mat.map(function (m) { return '<span class="tag tag--' + m + '">' + esc(MATS[m]) + "</span>"; }).join("") +
      (seCotiza(p) ? '<span class="tag tag--cotiza">Se cotiza</span>' : "");
    var url = "producto.html?id=" + p.id;
    /* La foto con comida (FOTOS_USO), si ya la tiene: sale al pasar el cursor,
       como en las tarjetas de la portada. */
    var amb = agente().fotoUso ? agente().fotoUso(p.id) : null;
    return '' +
      '<article class="pcard pcard--info rv" data-d="' + (i % 4) + '" data-id="' + p.id + '">' +
        '<a class="pcard__media" href="' + url + '" aria-label="Ver ' + esc(p.nombre) + '">' +
          '<img src="' + src(p.img) + '" alt="' + esc(p.nombre) + '" loading="lazy" decoding="async">' +
          (amb ? '<img class="pcard__amb" src="' + amb.src + '" alt="" loading="lazy" decoding="async">' : "") +
          (promo && promo.desc ? '<span class="pcard__flag pcard__flag--off">-' + promo.desc + "%</span>" : "") +
          (agotadas.length === p.v.length || (promo && promo.agotado) ? '<span class="pcard__out">Agotado</span>' : "") +
        "</a>" +
        '<div class="pcard__body">' +
          '<div class="pcard__tags">' + tags + "</div>" +
          '<h3><a href="' + url + '">' + esc(p.nombre) + "</a></h3>" +
          '<p class="pcard__desc">' + esc(p.desc) + "</p>" +
          '<dl class="pcard__specs">' + specs(p).map(function (x) {
            return "<div><dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd></div>";
          }).join("") + "</dl>" +
        "</div>" +
        /* Con precio en la lista: "Comprar ahora" (elige medida y cantidad en
           su ficha). Sin precio: "Pedir cotización" (Gabriel, 2026-10-03). */
        '<div class="pcard__buy">' +
          (seCotiza(p)
            ? '<a class="btn btn--ghost btn--sm btn--block" href="tienda.html?cotiza=' + p.id + '#cotizar-tienda" data-cotiza="' + p.id + '">' +
                '<span class="btn__label">Pedir cotización</span>' +
                '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>'
            : '<a class="btn btn--primary btn--sm btn--block" href="' + url + '">' +
                '<span class="btn__label">Comprar ahora</span>' +
                '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>') +
        "</div>" +
      "</article>";
  }

  /* Al cambiar la medida o la presentación, la tarjeta (o la ficha) se pone
     al día: foto, precios, botones de paquete/caja y "Añadir"/"Actualizar". */
  function refrescaCompra(caja) {
    var p = prodDe(caja.dataset.id);
    if (!p) return;
    var v = caja.querySelector("[data-role='variant']").value;
    var t = tamDe(p, v);
    var us = unidades(t);
    var seg = caja.querySelector("[data-role='unidad']");
    var actual = seg && seg.querySelector("[aria-pressed='true']");
    var u = actual && us.indexOf(actual.dataset.u) > -1 ? actual.dataset.u : (us[0] || "paq");
    if (seg) seg.innerHTML = unidadesHTML(t, u);
    var precios = caja.querySelector("[data-role='precios']") ||
                  (caja.closest(".pcard") || document).querySelector("[data-role='precios']");
    if (precios) precios.innerHTML = preciosHTML(p, t, u);
    var foto = (caja.closest(".pcard") || document).querySelector("[data-role='foto']");
    if (foto) {
      var nueva = src(imgDe(p, v));
      if (foto.getAttribute("src") !== nueva) foto.setAttribute("src", nueva);
    }
    var line = lineaDe(p.id, v, u);
    var qty = caja.querySelector("[data-role='qty']");
    if (qty && line) qty.value = line.qty;
    var add = caja.querySelector("[data-role='add']");
    if (add) {
      var agotada = (p.agotadas || []).indexOf(v) > -1;
      add.disabled = !us.length || agotada;
      add.querySelector(".btn__label").textContent = agotada ? "Agotado" : !us.length ? "Por confirmar" :
        (line ? "Actualizar" : (add.dataset.texto || "Añadir"));
      add.querySelector("use").setAttribute("href", line ? "#i-check" : "#i-plus");
    }
    if (line) caja.dataset.in = "true"; else caja.removeAttribute("data-in");
    document.dispatchEvent(new CustomEvent("gn:compra", { detail: { id: p.id, v: v, u: u } }));
  }

  /* ============================ tapas relacionadas ============================
     "Cada tipo de vaso se relaciona con sus tapas" (Gabriel, 2026-09-27): con
     vasos en pantalla, arriba de la rejilla salen las tapas de su misma boca.
     Respeta el filtro de onzas: 12 oz de papel solo trae tapas de boca 90. */
  function tapasPara(vasos) {
    var porFamilia = {};
    vasos.forEach(function (p) {
      var fam = FAMILIA_TAPAS[p.cat];
      if (!fam || !p.venta) return;
      p.v.forEach(function (v, k) {
        if (state.oz.length && state.oz.indexOf(ozDeV(v)) === -1) return;
        var b = p.venta.tam[k].boca;
        if (b) (porFamilia[fam] = porFamilia[fam] || {})[b] = true;
      });
    });
    var out = [];
    PRODS.forEach(function (tp) {
      var bocas = porFamilia[tp.cat];
      if (!bocas || !tp.venta) return;
      var coinciden = tp.venta.tam.map(function (t) { return t.boca; })
        .filter(function (b, k, a) { return b && bocas[b] && a.indexOf(b) === k; });
      if (coinciden.length) out.push({ p: tp, bocas: coinciden });
    });
    return out;
  }

  function renderTapasRel(list) {
    var box = $("tapas-rel");
    if (!box) return;
    var vasos = list.filter(function (p) { return FAMILIA_TAPAS[p.cat]; });
    var soloVasos = vasos.length && vasos.length === list.length;
    var tapas = soloVasos ? tapasPara(vasos) : [];
    box.hidden = tapas.length === 0;
    if (!tapas.length) { box.innerHTML = ""; return; }
    box.innerHTML =
      '<p class="tapas-rel__label">Tapas para estos vasos</p>' +
      '<div class="tapas-rel__list">' +
      tapas.map(function (x) {
        return '<a class="tapas-rel__chip" href="producto.html?id=' + x.p.id + "&boca=" + x.bocas[0] + '">' +
          '<img src="' + src(x.p.img) + '" alt="" loading="lazy" decoding="async">' +
          "<span>" + esc(x.p.nombre) + "<small>Boca " + x.bocas.join(" / ") + " mm</small></span></a>";
      }).join("") +
      "</div>";
  }

  /* La lista de arriba de la rejilla en la búsqueda por uso: cada cosa con su
     medida y para qué sirve, incluidas las que se cotizan (que no están en la
     rejilla porque no se venden en línea). */
  function pintaUso(uso) {
    var box = $("uso");
    if (!box) return;
    box.hidden = !uso;
    if (!uso) return;
    var A = agente();
    $("uso-t").textContent = uso.intro.replace(/:\s*$/, "");
    $("uso-lista").innerHTML = uso.recs.map(function (r) {
      var nombre, medida, href, foto;
      if (r.cotiza) {
        var c = (A.COTIZA || {})[r.cotiza];
        if (!c) return "";
        var fc = A.fotoUso(r.cotiza);
        nombre = c.nombre; medida = c.v + " · se cotiza";
        href = "tienda.html?pide=" + encodeURIComponent(c.pide);
        foto = fc ? fc.src : src(c.img);
      } else {
        var p = prodDe(r.id);
        if (!p) return "";
        var k = A.medidaDe(p, r.v);
        var f = A.fotoUso(p.id, p.v[k]);
        nombre = p.nombre; medida = r.v;
        href = "producto.html?id=" + p.id + "&v=" + k;
        foto = f ? f.src : src(imgDe(p, p.v[k]));
      }
      return '<li><a class="uso__item" href="' + href + '">' +
        '<img src="' + foto + '" alt="" loading="lazy" decoding="async" width="52" height="52">' +
        "<span><b>" + esc(nombre) + '</b><em>' + esc(medida) + "</em><small>" + esc(r.por) + "</small></span></a></li>";
    }).join("");
  }

  /* El título de cada grupo en la rejilla: sección en "Todos los productos",
     categoría dentro de una sección. Solo en el orden de la tienda y sin
     búsqueda: con otro orden o con texto buscado, los grupos no aplican. */
  function grupoDe(p) {
    if (state.sort !== "todos" || state.q.trim() || state.cat !== "todo") return null;
    if (state.sec === "todo") {
      var sec = seccionDe(p.cat);
      return sec ? { id: "s-" + sec.id, t: sec.nombre } : null;
    }
    var c = CATS.filter(function (x) { return x.id === p.cat; })[0];
    return c ? { id: "c-" + c.id, t: c.nombre } : null;
  }

  function botonMas() {
    var box = $("mas");
    if (!box) {
      box = document.createElement("div");
      box.className = "mas";
      box.id = "mas";
      box.innerHTML = '<button class="btn btn--ghost" type="button" id="mas-btn">' +
        '<span class="btn__label">Mostrar más</span>' +
        '<svg class="ico" aria-hidden="true"><use href="#i-caret-down"></use></svg></button>';
      $("grid").insertAdjacentElement("afterend", box);
      $("mas-btn").addEventListener("click", function () {
        var desde = ver;
        ver += PASO;
        render(desde);
      });
    }
    return box;
  }

  function render(desde) {
    var grid = $("grid");
    if (!grid) return;
    var list = filtered();
    var uso = usoActual();

    /* Cualquier cambio de filtro, búsqueda u orden vuelve a los primeros. */
    var firma = [state.sec, state.cat, state.oz.join(","), state.q, state.sort].join("|");
    if (firma !== firmaAntes) { ver = PASO; firmaAntes = firma; desde = 0; }

    var visibles = list.slice(0, ver);
    var html = [], ultimo = null;
    visibles.forEach(function (p, i) {
      var g = grupoDe(p);
      if (g && (!ultimo || g.id !== ultimo)) {
        html.push('<h3 class="grid-sec">' + esc(g.t) + "</h3>");
      }
      if (g) ultimo = g.id;
      html.push(card(p, i));
    });
    grid.innerHTML = html.join("");
    var mas = botonMas();
    mas.hidden = list.length <= ver;
    pintaUso(uso);
    /* Un uso sin nada en la tienda (tortas, tacos) no es "sin resultados":
       la lista de arriba trae lo que se cotiza. */
    $("empty").hidden = list.length > 0 || !!uso;
    renderTapasRel(list);

    /* Sin cuántos productos hay (Feedback final): solo qué se está viendo. */
    var secNombre = state.sec === "todo" ? "" : ((SECCIONES.filter(function (x) { return x.id === state.sec; })[0] || {}).nombre || "");
    $("result-line").textContent = list.length === 0 ? "" :
      (state.cat === "todo" ? secNombre : (CATS.filter(function (c) { return c.id === state.cat; })[0] || {}).nombre) +
      (state.oz.length ? (state.cat === "todo" ? "" : " · ") + state.oz.map(function (o) { return o + " oz"; }).join(", ") : "") +
      (state.q.trim() ? ((state.cat === "todo" && !state.oz.length) ? "Resultados" : "") +
        (ultimaCorreccion ? ' para "' + ultimaCorreccion + '" (escribiste "' + state.q.trim() + '")'
                          : ' para "' + state.q.trim() + '"') : "");

    /* Al "Mostrar más", lo que ya se veía no vuelve a animarse. */
    var cards = grid.querySelectorAll(".rv");
    if (reduce || desde) {
      Array.prototype.forEach.call(cards, function (el, i) {
        if (reduce || i < desde) el.classList.add("in");
      });
    }
    if (!reduce && window.GN && window.GN.observe) {
      window.GN.observe(Array.prototype.filter.call(cards, function (el) { return !el.classList.contains("in"); }));
    }
    syncChips();
    var quitar = $("filtros-quitar");
    if (quitar) quitar.hidden = !(state.sec !== "todo" || state.cat !== "todo" || state.oz.length || state.q.trim());
  }

  /* ============================ carrito (cajón) ============================ */
  function paintCount() {
    var n = cart.length;
    var el = $("cart-count");
    if (!el) return;
    el.textContent = n;
    el.dataset.empty = String(n === 0);
    if (n > 0 && !reduce) {
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }
  }

  function total() {
    return cart.reduce(function (s, l) { return s + (subtotal(l) || 0); }, 0);
  }

  function paintTotal() {
    var el = $("cart-total");
    if (el) el.innerHTML = cart.length ? "<span>Total</span><b>" + money(total()) + " MXN</b><small>IVA incluido</small>" : "";
  }

  function paintCart() {
    var list = $("cart-list");
    $("cart-empty").hidden = cart.length > 0;
    $("drawer-foot").hidden = cart.length === 0;

    list.innerHTML = cart.map(function (l, k) {
      var p = prodDe(l.id);
      if (!p) return "";
      var st = subtotal(l);
      return '<li class="cart__item" data-k="' + k + '">' +
        '<img src="' + src(imgDe(p, l.v)) + '" alt="" loading="lazy">' +
        '<div class="cart__info">' +
          "<h4>" + esc(p.nombre) + "</h4>" +
          '<p class="cart__var">' + esc(l.v) + " · " + (l.u === "paq" ? "por paquete" : "por caja") + "</p>" +
          '<div class="cart__fila">' +
            '<div class="stepper stepper--sm" data-role="stepper">' +
              '<button type="button" data-step="-1" aria-label="Quitar uno">' +
                '<svg class="ico" aria-hidden="true"><use href="#i-minus"></use></svg></button>' +
              '<input type="number" min="1" max="999" value="' + l.qty + '" data-role="qty" aria-label="Cantidad">' +
              '<button type="button" data-step="1" aria-label="Agregar uno">' +
                '<svg class="ico" aria-hidden="true"><use href="#i-plus"></use></svg></button>' +
            "</div>" +
            '<b class="cart__sub" data-role="sub">' + (st == null ? "" : money(st)) + "</b>" +
          "</div>" +
          '<p class="cart__pzs" data-role="pzs">' + esc(cantidadTexto(l)) + "</p>" +
        "</div>" +
        '<button class="cart__del" type="button" data-role="del" aria-label="Quitar ' + esc(p.nombre) + '">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
        "</li>";
    }).join("");

    paintCount();
    paintTotal();
    persist();
    /* pagar.html repinta su resumen con esto. */
    document.dispatchEvent(new CustomEvent("gn:carrito"));
  }

  /* Cambió la cantidad de una línea en el cajón: solo se repinta esa línea. */
  function lineaCambio(item, qty) {
    var l = cart[Number(item.dataset.k)];
    if (!l) return;
    l.qty = qty;
    var st = subtotal(l);
    item.querySelector("[data-role='sub']").textContent = st == null ? "" : money(st);
    item.querySelector("[data-role='pzs']").textContent = cantidadTexto(l);
    paintTotal();
    persist();
    document.dispatchEvent(new CustomEvent("gn:carrito"));
  }

  function add(id, v, u, qty) {
    var line = lineaDe(id, v, u);
    if (line) line.qty = qty;
    else cart.push({ id: id, v: v, u: u, qty: qty });
    paintCart();
  }

  function toast(msg) {
    var t = $("toast");
    if (!t) return;
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

  /* El carrito y su cajón viven en la tienda, en ofertas Y en la ficha de
     producto. El catálogo (chips, buscador, rejilla) solo existe donde hay
     #grid, así que todo eso se monta nada más si la rejilla está presente. */
  paintCart();

  var HAY_CATALOGO = !!$("grid");

  if (HAY_CATALOGO) {

  /* El menú Productos enlaza con ?cat= y ?q=; la tienda arranca ya filtrada. */
  (function () {
    var qs = new URLSearchParams(location.search);
    var cat = qs.get("cat");
    var q = qs.get("q");
    var oz = qs.get("oz");
    /* Del menú Productos llegan con ?pide= los que no se venden en línea
       (Gabriel, 2026-10-03): aviso arriba de la rejilla y el formulario
       "Envía tu lista" ya trae el producto escrito. */
    var PIDE = [];
    /* Todo lo del catálogo ya está en la tienda (Gabriel, 2026-10-03): los
       enlaces viejos de "cotiza ya" abren su categoría. */
    var YA_EN_TIENDA = { "Popotes": "popotes", "Portavasos": "portavasos",
                         "Servilletas": "servilletas-papel", "Papel grado alimenticio": "servilletas-papel",
                         "Contenedores kraft": "cajas-charolas", "Contenedores de papel": "contenedores",
                         "Charolas y cajas": "cajas-charolas", "Ensaladeras": "ensaladeras", "Bolsas kraft": "bolsas",
                         "Conos para crepa": "souffles", "Soufflés": "souffles" };
    var pide = qs.get("pide");
    if (pide && YA_EN_TIENDA[pide] && !cat) cat = YA_EN_TIENDA[pide];
    /* ?cotiza=<id>&v=<medida>: viene del botón "Pedir cotización" de la ficha.
       El formulario de abajo ya trae el producto escrito. */
    var cotiza = prodDe(qs.get("cotiza") || "");
    if (cotiza) {
      var vc = Number(qs.get("v")) || 0;
      var medida = cotiza.v[vc] || cotiza.v[0];
      var nota = $("s-mensaje");
      if (nota && !nota.value) nota.value = "Me interesa: " + cotiza.nombre + " (" + medida + "). Necesito: ";
      /* El #cotizar-tienda del enlace a veces llega antes de que la rejilla
         termine de pintarse; se baja al formulario ya con todo en su lugar. */
      window.addEventListener("load", function () {
        var form = document.getElementById("cotizar-tienda");
        if (form) form.scrollIntoView({ block: "start" });
      });
    }
    if (pide && PIDE.indexOf(pide) > -1 && $("pide")) {
      $("pide-t").textContent = pide + ": cotiza ya";
      $("pide").hidden = false;
      var msj = $("s-mensaje");
      if (msj && !msj.value) msj.value = "Me interesa: " + pide + ". ";
      window.addEventListener("DOMContentLoaded", function () {
        var c = document.getElementById("catalogo");
        if (c) c.scrollIntoView({ block: "start" });
      });
    }
    if (cat && CATS.some(function (c) { return c.id === cat; })) {
      state.cat = cat;
      state.sec = (seccionDe(cat) || { id: "todo" }).id;
    }
    var sec = qs.get("sec");
    if (!cat && sec && SECCIONES.some(function (x) { return x.id === sec; })) state.sec = sec;
    if (oz && /^\d+$/.test(oz)) state.oz = [oz];
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
    var b = e.target.closest("[data-sec], [data-cat]"); if (!b) return;
    if (b.dataset.sec) {
      state.sec = b.dataset.sec;
      state.cat = "todo";
    } else {
      state.cat = b.dataset.cat;
      state.sec = (seccionDe(state.cat) || { id: "todo" }).id;
    }
    buildCaps();
    render();
    document.getElementById("catalogo").scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  });

  if ($("caps")) {
    $("caps").addEventListener("click", function (e) {
      var b = e.target.closest("[data-oz]"); if (!b) return;
      var o = b.dataset.oz, i = state.oz.indexOf(o);
      if (i > -1) state.oz.splice(i, 1); else state.oz.push(o);
      render();
    });
  }

  var clearBtn = $("facets-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      state.oz = []; state.sec = "todo"; state.cat = "todo"; state.q = "";
      $("q").value = ""; $("q-clear").hidden = true;
      buildCaps();
      render();
    });
  }

  var filterBtn = $("filter-open");
  if (filterBtn) {
    var panel = $("facets") || $("side");
    var angosto = window.matchMedia("(max-width: 900px)");
    /* En el teléfono el panel arranca plegado y el botón lo abre; en
       escritorio la barra lateral está siempre a la vista. */
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

  $("sort").addEventListener("change", function () {
    state.sort = this.value;
    /* "Todos" (Gabriel, 2026-09-29): todo el inventario en el orden del
       catálogo, sin filtros ni búsqueda. */
    if (state.sort === "todos" && clearBtn) { clearBtn.click(); return; }
    if (state.sort === "vendidos" && !POPULARES) {
      fetch("/api/populares").then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (j) { POPULARES = (j && j.ids) || []; render(); });
    }
    render();
  });

  /* Quitar filtros (arriba del catálogo): lo mismo que el de la barra lateral. */
  if ($("filtros-quitar") && clearBtn) {
    $("filtros-quitar").addEventListener("click", function () { clearBtn.click(); });
  }

  /* Mostrar / ocultar filtros (computadora). En celular sigue el botón
     "Filtros" de siempre. */
  var fToggle = $("filtros-toggle");
  if (fToggle) {
    var layout = document.querySelector(".shop-layout");
    var CLAVE_F = "greenova.filtros.ocultos";
    function ponFiltros(ocultos) {
      layout.classList.toggle("shop-layout--sin-filtros", ocultos);
      fToggle.setAttribute("aria-expanded", String(!ocultos));
      fToggle.querySelector("span").textContent = ocultos ? "Mostrar filtros" : "Ocultar filtros";
      try { localStorage.setItem(CLAVE_F, ocultos ? "1" : "0"); } catch (e) { /* modo privado */ }
    }
    var ocultosAntes = false;
    try { ocultosAntes = localStorage.getItem(CLAVE_F) === "1"; } catch (e) { /* modo privado */ }
    ponFiltros(ocultosAntes);
    fToggle.addEventListener("click", function () {
      ponFiltros(!layout.classList.contains("shop-layout--sin-filtros"));
    });
  }

  /* Columnas: el cliente elige 3, 4 o 5 (en celular siempre 2). */
  var colsEl = $("cols");
  if (colsEl) {
    var CLAVE_C = "greenova.columnas";
    function ponCols(n) {
      var grid = $("grid");
      grid.classList.remove("grid-prod--c3", "grid-prod--c4", "grid-prod--c5");
      grid.classList.add("grid-prod--c" + n);
      Array.prototype.forEach.call(colsEl.querySelectorAll("[data-cols]"), function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.cols === String(n)));
      });
      try { localStorage.setItem(CLAVE_C, String(n)); } catch (e) { /* modo privado */ }
    }
    var colsAntes = "3";
    try { colsAntes = localStorage.getItem(CLAVE_C) || "3"; } catch (e) { /* modo privado */ }
    ponCols(/^[345]$/.test(colsAntes) ? colsAntes : "3");
    colsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cols]");
      if (b) ponCols(b.dataset.cols);
    });
  }

  }   /* fin del bloque de catálogo */

  /* "Pedir cotización" de una tarjeta: en la misma página, el formulario
     "Envía tu lista" se llena con el producto y se baja a él. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cotiza]");
    var nota = $("s-mensaje");
    if (!a || !nota) return;
    var p = prodDe(a.dataset.cotiza);
    if (!p) return;
    e.preventDefault();
    var linea = "Me interesa: " + p.nombre + (p.v.length === 1 ? " (" + p.v[0] + ")" : "") + ". Necesito: ";
    if (nota.value.indexOf(p.nombre) === -1) nota.value = (nota.value ? nota.value.replace(/\s*$/, "\n") : "") + linea;
    var form = $("cotizar-tienda");
    if (form) form.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    setTimeout(function () { try { nota.focus({ preventScroll: true }); } catch (err) { nota.focus(); } }, reduce ? 0 : 500);
  });

  /* La caja de compra: una tarjeta de la rejilla o la columna de la ficha. */
  function cajaDe(el) { return el.closest(".pcard, .ficha__compra"); }

  document.addEventListener("click", function (e) {
    var stepBtn = e.target.closest("[data-step]");
    if (stepBtn) {
      var wrap = stepBtn.closest("[data-role='stepper']");
      var input = wrap.querySelector("[data-role='qty']");
      var next = Math.min(999, Math.max(1, (parseInt(input.value, 10) || 1) + Number(stepBtn.dataset.step)));
      input.value = next;
      var item = stepBtn.closest(".cart__item");
      if (item) lineaCambio(item, next);
      else input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    /* Tocar el renglón de precio (paquete o caja) también lo elige. */
    var fila = e.target.closest(".precios__fila[data-u]");
    if (fila) {
      var cajaF = cajaDe(fila) || fila.closest(".pcard");
      var boton = cajaF && cajaF.querySelector("[data-role='unidad'] [data-u='" + fila.dataset.u + "']");
      if (boton) boton.click();
      return;
    }

    var uBtn = e.target.closest("[data-role='unidad'] [data-u]");
    if (uBtn) {
      Array.prototype.forEach.call(uBtn.parentElement.children, function (b) {
        b.setAttribute("aria-pressed", String(b === uBtn));
      });
      refrescaCompra(cajaDe(uBtn));
      return;
    }

    var del = e.target.closest("[data-role='del']");
    if (del) {
      var li = del.closest(".cart__item");
      cart.splice(Number(li.dataset.k), 1);
      paintCart();
      document.querySelectorAll(".pcard, .ficha__compra").forEach(refrescaCompra);
      return;
    }

    var addBtn = e.target.closest("[data-role='add']");
    if (addBtn) {
      var pc = cajaDe(addBtn);
      var v = pc.querySelector("[data-role='variant']").value;
      var prod = prodDe(pc.dataset.id);
      if ((prod.agotadas || []).indexOf(v) > -1) { toast("Esa medida está agotada por ahora"); return; }
      var t = tamDe(prod, v);
      var us = unidades(t);
      var sel = pc.querySelector("[data-role='unidad'] [aria-pressed='true']");
      var u = sel && us.indexOf(sel.dataset.u) > -1 ? sel.dataset.u : us[0];
      if (!u) { toast("Esa medida todavía no tiene precio: pregúntanos por ella"); return; }
      var qty = Math.min(999, Math.max(1, parseInt(pc.querySelector("[data-role='qty']").value, 10) || 1));
      add(pc.dataset.id, v, u, qty);
      refrescaCompra(pc);
      if (!reduce) { addBtn.classList.remove("did"); void addBtn.offsetWidth; addBtn.classList.add("did"); }
      toast(qty + " " + unidadTexto(u, qty) + " de " + prod.nombre.toLowerCase() + " en tu carrito");
      return;
    }

    /* clic en cualquier parte de la tarjeta (fuera de la franja de compra y de
       los enlaces que ya navegan solos) también manda a la ficha del producto */
    var body = e.target.closest(".pcard__body");
    if (body && !e.target.closest("a") && !(window.getSelection() + "")) {
      window.location.href = "producto.html?id=" + body.closest(".pcard").dataset.id;
    }
  });

  document.addEventListener("change", function (e) {
    var input = e.target.closest("[data-role='qty']");
    if (input) {
      input.value = Math.min(999, Math.max(1, parseInt(input.value, 10) || 1));
      var item = input.closest(".cart__item");
      if (item) lineaCambio(item, Number(input.value));
    }
    var sel = e.target.closest("[data-role='variant']");
    if (sel) {
      var caja = cajaDe(sel);
      if (caja) refrescaCompra(caja);
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
    paintCart();
    document.querySelectorAll(".pcard, .ficha__compra").forEach(refrescaCompra);
    toast("Carrito vacío");
  });

  /* "Pagar mi pedido" lleva a pagar.html (envío + Openpay). "Prefiero que
     me coticen" baja al formulario de la tienda, como antes. */
  $("cart-send").addEventListener("click", function () { setDrawer(false); });
  var cotizarLink = document.querySelector(".drawer__cotizar");
  if (cotizarLink) cotizarLink.addEventListener("click", function () {
    setDrawer(false);
    setTimeout(function () {
      var n = $("s-nombre");
      if (n) n.focus({ preventScroll: true });
    }, 400);
  });

  /* ============================ envío ============================
     El pedido se guarda en la base (historial de compras del cliente, se ve
     en el panel) y además se abre el correo a ventas con la lista, como
     hasta ahora: si la base no responde, el pedido no se pierde. */
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

      /* Igual que el registro: nombre y, al menos, correo o teléfono; un
         correo escrito tiene que ser válido (con @). */
      var ok = true;
      var correo = $("s-correo").value.trim(), tel = $("s-tel").value.replace(/\D/g, "");
      setError("s-nombre", $("s-nombre").value.trim() ? "" : (ok = false, "Escribe tu nombre."));
      setError("s-correo",
        correo ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? "" : (ok = false, "Escribe un correo válido (con @)."))
               : (tel.length >= 10 ? "" : (ok = false, "Escribe tu correo o tu teléfono.")));
      if (!ok) {
        status.textContent = "Revisa los campos marcados.";
        form.querySelector('[data-invalid="true"] input').focus();
        return;
      }

      submit.dataset.loading = "true";
      label.textContent = "Enviando";

      var d = Object.fromEntries(new FormData(form).entries());
      var lineas = cart.map(function (l) {
        var p = prodDe(l.id), t = tamDe(p, l.v);
        return { id: l.id, nombre: p ? p.nombre : l.id, v: l.v, u: l.u, qty: l.qty,
                 piezas: t ? piezasDe(t, l.u) * l.qty : null,
                 precio: t ? precioDe(p, t, l.u) : null, subtotal: subtotal(l),
                 sku: t ? t.sku : null };
      });
      var texto = lineas.map(function (l) {
        return "- " + l.qty + " " + unidadTexto(l.u, l.qty) + (l.piezas ? " (" + fmt(l.piezas) + " pzs)" : "") +
          " de " + l.nombre + " (" + l.v + ")" + (l.subtotal != null ? " = " + money(l.subtotal) : "");
      }).join("\n");

      var cuerpo = [
        "Nombre: " + d.nombre,
        "Negocio: " + (d.negocio || "No indicado"),
        "Correo: " + (d.correo || "No indicado"),
        "Telefono: " + (d.telefono || "No indicado"),
        "",
        lineas.length ? "PEDIDO:" : "SIN PRODUCTOS EN EL CARRITO",
        texto,
        lineas.length ? "TOTAL: " + money(total()) + " MXN (IVA incluido)" : "",
        "",
        "Lista, cotización o lo que busca:",
        d.mensaje || "Sin notas."
      ].join("\n");

      if (window.GNmetrica) window.GNmetrica("carrito_enviado");

      function abreCorreo(folio) {
        window.location.href = "mailto:ventas@greenovasc.com.mx?subject=" +
          encodeURIComponent((folio ? "Pedido " + folio : "Pedido") + " desde la tienda") +
          "&body=" + encodeURIComponent((folio ? "Folio: " + folio + "\n" : "") + cuerpo);
        submit.dataset.loading = "false";
        label.textContent = "Enviar pedido";
        status.dataset.state = "ok";
        status.textContent = (folio ? "Recibimos tu pedido " + folio + ". " : "") +
          "Abrimos tu correo con la lista completa. Si no se abrió, escribe a ventas@greenovasc.com.mx";
        if (!reduce && window.GN && window.GN.burst) window.GN.burst(submit);
      }

      /* Con la sesión abierta (cuenta.js) el pedido se liga a la cuenta. */
      var cabeceras = { "Content-Type": "application/json" };
      var tk = window.GNCuenta && window.GNCuenta.token();
      if (tk) cabeceras.Authorization = "Bearer " + tk;
      fetch("/api/pedido", {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({
          nombre: d.nombre, negocio: d.negocio || "", correo: d.correo || "", telefono: d.telefono || "",
          notas: d.mensaje || "", lineas: lineas, total: total(), sitio_web: d.sitio_web || ""
        })
      }).then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (j) { abreCorreo(j && j.folio); });
    });

    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.dataset.invalid === "true") setError(e.target.id, "");
    });
  }

  /* Lo que usan la ficha de producto y el editor del panel. */
  window.GNTienda = {
    /* pagar.html: cambiar la cantidad de una línea (0 = quitarla). */
    cambiaLinea: function (k, qty) {
      if (!cart[k]) return;
      if (qty < 1) cart.splice(k, 1); else cart[k].qty = Math.min(999, qty);
      paintCart();
    },
    repintar: render,
    refrescaCompra: refrescaCompra,
    preciosHTML: preciosHTML,
    unidades: unidades,
    tapasPara: function (p, v) {
      var fam = FAMILIA_TAPAS[p.cat], t = tamDe(p, v);
      if (!fam || !t || !t.boca) return [];
      return PRODS.filter(function (x) {
        return x.cat === fam && x.venta && x.venta.tam.some(function (y) { return y.boca === t.boca; });
      });
    },
    money: money
  };
})();
