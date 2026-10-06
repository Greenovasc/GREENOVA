/* GreeNova SC - pulso del sitio.
   ===========================================================================
   Cuenta lo que ve el panel (admin.html → Métricas):
   - cada página vista, de dónde llegó la visita y si es celular o computadora;
   - qué productos se ven, se abren y se agregan (también el mapa de calor);
   - clics a WhatsApp, correo y teléfono, y las cotizaciones enviadas.

   Nada dice quién es la persona: el visitante es un código al azar que guarda
   su navegador (sin cookies), solo para no contar dos veces a la misma persona
   en un día.

   Usa sendBeacon, que entrega el dato sin retrasar la navegación y sobrevive a
   que el visitante cambie de página en ese momento. Si el servidor no existe
   (Hostinger estático), falla en silencio y no se rompe nada.
   =========================================================================== */
(function () {
  "use strict";
  if (!navigator.sendBeacon) return;

  function manda(url, datos) {
    try {
      navigator.sendBeacon(url, new Blob([JSON.stringify(datos)], { type: "application/json" }));
    } catch (e) { /* sin servidor: da igual */ }
  }

  var pagina = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index";

  function visitante() {
    try {
      var v = localStorage.getItem("greenova.vid");
      if (!v) {
        v = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
          .replace(/-/g, "").slice(0, 24);
        localStorage.setItem("greenova.vid", v);
      }
      return v;
    } catch (e) { return ""; }
  }

  /* La fuente (Google, Instagram, directo…) se toma en la primera página de
     la visita y se guarda para la sesión: la ventana de bienvenida la manda
     junto con el registro. */
  var entrada = false, ref = "", utm = "";
  try {
    var r = document.referrer ? new URL(document.referrer) : null;
    if (r && r.host !== location.host) ref = r.hostname;
    utm = new URLSearchParams(location.search).get("utm_source") || "";
    if (!sessionStorage.getItem("greenova.fuente")) {
      entrada = true;
      sessionStorage.setItem("greenova.fuente", JSON.stringify({ ref: ref, utm: utm }));
    }
  } catch (e) { /* modo privado */ }

  manda("/api/visita", {
    tipo: "vista", pagina: pagina, vid: visitante(), entrada: entrada, ref: ref, utm: utm,
    movil: window.matchMedia("(max-width: 760px)").matches
  });

  /* Para el resto del sitio: GNmetrica("popup_visto"), GNfuente(). */
  window.GNmetrica = function (evento) {
    manda("/api/visita", { tipo: "evento", evento: evento, pagina: pagina });
  };
  window.GNfuente = function () {
    try { return JSON.parse(sessionStorage.getItem("greenova.fuente") || "{}"); } catch (e) { return {}; }
  };

  /* ---------- productos ---------- */
  function producto(id, tipo) {
    if (id) manda("/api/pulso", { id: id, tipo: tipo });
  }

  /* Una tarjeta se cuenta como vista cuando de verdad se ve, no cuando se
     carga la página: si el visitante nunca baja, ese producto no se miró. */
  if (window.IntersectionObserver) {
    var contadas = {};
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.dataset.id;
        if (!id || contadas[id]) return;
        contadas[id] = true;
        producto(id, "ver");
        ojo.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    var mirar = function () {
      document.querySelectorAll(".pcard[data-id]").forEach(function (c) { ojo.observe(c); });
    };
    mirar();
    /* La rejilla se repinta con cada filtro, así que hay que volver a mirar. */
    var grid = document.getElementById("grid");
    if (grid) new MutationObserver(mirar).observe(grid, { childList: true });
  }

  /* ---------- clics que valen: contacto y productos ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (a) {
      var h = a.getAttribute("href");
      if (/wa\.me|whatsapp/i.test(h)) window.GNmetrica("whatsapp");
      else if (/^mailto:/i.test(h)) window.GNmetrica("correo");
      else if (/^tel:/i.test(h)) window.GNmetrica("telefono");
    }
    var card = e.target.closest(".pcard[data-id], .ficha__compra[data-id]");
    if (card) producto(card.dataset.id, e.target.closest(".pcard__add") ? "carrito" : "click");
  });

  document.addEventListener("submit", function (e) {
    if (e.target.id === "quote-form") window.GNmetrica("cotizacion");
  }, true);
})();
