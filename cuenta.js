/* GreeNova SC - cuenta del cliente (icono de persona del menú).
   ===========================================================================
   Sin contraseña (Gabriel, 2026-09-29): la cuenta se crea con nombre y
   WhatsApp, y se entra con esos mismos dos datos. Registrarse y entrar pasa en
   la ventana de entrada (greenova.js); este archivo guarda la sesión y pinta el
   panel lateral "Mi cuenta" con sus datos y sus pedidos. El servidor está en
   main.py (/api/cuenta/crear, /api/cuenta/entrar y /api/cuenta).

   La sesión dura 180 días y se guarda en este navegador. Con la sesión abierta:
   - el pedido de la tienda se liga a la cuenta (tienda.js manda el token),
   - ya no sale la ventana de entrada ni se pide antes de enviar un pedido,
   - los formularios se llenan solos con sus datos.
   =========================================================================== */
(function () {
  "use strict";

  var KEY = "greenova.cuenta.v1";
  var KEY_CONOCIDO = "greenova.cuenta.conocido";   // { nombre, telefono } de quien ya tuvo cuenta aquí
  var sesion = lee();            // { token, perfil }
  var panel, cuerpo, scrim, ultimoFoco = null;

  function lee() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); return s && s.token ? s : null; }
    catch (e) { return null; }
  }
  function guarda(s) {
    sesion = s;
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
      /* Quien ya tuvo cuenta aquí: la ventana de entrada le pide iniciar sesión
         con su nombre y su WhatsApp ya escritos. */
      if (s && s.perfil && s.perfil.telefono) {
        localStorage.setItem(KEY_CONOCIDO, JSON.stringify({ nombre: s.perfil.nombre || "", telefono: s.perfil.telefono }));
      }
    } catch (e) { /* modo privado */ }
    marcaBoton();
  }
  function conocido() {
    try { var c = JSON.parse(localStorage.getItem(KEY_CONOCIDO) || "null"); return c && c.telefono ? c : null; }
    catch (e) { return null; }
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    return "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fecha(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }
  function whats(t) {
    var d = String(t || "").replace(/\D/g, "");
    return d.length === 10 ? d.slice(0, 2) + " " + d.slice(2, 6) + " " + d.slice(6) : t;
  }
  function api(ruta, datos) {
    var h = { "Content-Type": "application/json" };
    if (sesion && sesion.token) h.Authorization = "Bearer " + sesion.token;
    return fetch(ruta, { method: datos ? "POST" : "GET", headers: h, body: datos ? JSON.stringify(datos) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._s = r.status; return j; }); });
  }

  function marcaBoton() {
    var boton = document.getElementById("cuenta-open");
    var nombre = sesion ? (sesion.perfil.nombre || "") : "";
    if (boton) {
      boton.dataset.sesion = sesion ? "true" : "false";
      boton.setAttribute("aria-label", sesion ? "Mi cuenta (" + nombre + ")" : "Inicia sesión o regístrate");
    }
    /* El letrero junto a la lupa: "Inicia sesión / Regístrate" o "Hola, Nombre". */
    document.querySelectorAll("[data-letrero-cuenta]").forEach(function (el) {
      el.dataset.sesion = sesion ? "true" : "false";
      el.innerHTML = sesion ? "Hola, <b>" + esc(nombre.split(" ")[0] || "de nuevo") + "</b>"
                            : "<b>Inicia sesión</b><span aria-hidden=\"true\">/</span>Regístrate";
    });
  }

  /* ---------------- panel ---------------- */
  function arma() {
    scrim = document.createElement("div");
    scrim.className = "drawer-scrim";
    scrim.hidden = true;
    panel = document.createElement("aside");
    panel.className = "drawer cuenta";
    panel.id = "cuenta";
    panel.setAttribute("aria-label", "Mi cuenta");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<header class="drawer__head"><h2 id="cuenta-h">Mi cuenta</h2>' +
      '<button class="drawer__close" type="button" data-cierra aria-label="Cerrar">' +
      '<svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></button></header>' +
      '<div class="drawer__body cuenta__cuerpo"></div>';
    document.body.appendChild(scrim);
    document.body.appendChild(panel);
    cuerpo = panel.querySelector(".cuenta__cuerpo");
    scrim.addEventListener("click", cierra);
    panel.addEventListener("click", function (e) {
      if (e.target.closest("[data-cierra]")) cierra();
      if (e.target.closest("[data-salir]")) {
        guarda(null);
        try { sessionStorage.removeItem("greenova.bienvenida.sesion"); } catch (x) { /* modo privado */ }
        cierra();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.dataset.open === "true") cierra();
    });
  }

  function abre() {
    if (!sesion) {
      if (window.GNRegistro && window.GNRegistro.abrirCuenta) window.GNRegistro.abrirCuenta(conocido() ? "entrar" : "registro");
      return;
    }
    if (!panel) arma();
    ultimoFoco = document.activeElement;
    pinta();
    scrim.hidden = false;
    panel.dataset.open = "true";
    panel.setAttribute("aria-hidden", "false");
    document.body.dataset.locked = "true";
    setTimeout(function () {
      var f = panel.querySelector("input, .drawer__close");
      if (f) f.focus({ preventScroll: true });
    }, 60);
  }
  function cierra() {
    panel.dataset.open = "false";
    panel.setAttribute("aria-hidden", "true");
    scrim.hidden = true;
    document.body.dataset.locked = "false";
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true });
  }

  function pinta() {
    var p = sesion.perfil || {};
    cuerpo.innerHTML =
      '<div class="cuenta__hola"><span class="cuenta__avatar" aria-hidden="true">' + esc((p.nombre || "?").charAt(0).toUpperCase()) + "</span>" +
      "<div><b>" + esc(p.nombre) + "</b>" + (p.negocio ? "<small>" + esc(p.negocio) + "</small>" : "") + "</div></div>" +
      '<dl class="cuenta__datos"><div><dt>WhatsApp</dt><dd>' + esc(whats(p.telefono)) + "</dd></div>" +
      (p.correo ? "<div><dt>Correo</dt><dd>" + esc(p.correo) + "</dd></div>" : "") + "</dl>" +
      '<h3 class="cuenta__sub">Mis pedidos</h3><div class="cuenta__pedidos" aria-busy="true"><p class="cuenta__nota">Cargando…</p></div>' +
      '<div class="cuenta__links">' +
      '<a class="btn btn--primary btn--block" href="tienda.html">Ir a la tienda</a>' +
      '<a class="btn btn--ghost btn--block" href="facturacion.html">Facturar una compra</a>' +
      "</div>" +
      '<button class="link-btn cuenta__salir" type="button" data-salir>Cerrar sesión</button>';
    cargaPedidos();
  }

  function cargaPedidos() {
    api("/api/cuenta").then(function (j) {
      var caja = cuerpo && cuerpo.querySelector(".cuenta__pedidos");
      if (j._s === 401) {
        /* La sesión venció: se cierra el panel y sale la ventana para entrar. */
        guarda(null);
        if (panel.dataset.open === "true") { cierra(); abre(); }
        return;
      }
      if (!caja) return;
      caja.removeAttribute("aria-busy");
      if (j.perfil) { sesion.perfil = j.perfil; guarda(sesion); }
      var ps = j.pedidos || [];
      if (!ps.length) {
        caja.innerHTML = '<p class="cuenta__nota">Todavía no tienes pedidos. Los que envíes con tu sesión abierta aparecen aquí.</p>';
        return;
      }
      caja.innerHTML = '<ul class="cuenta__lista">' + ps.map(function (p) {
        var arts = (p.lineas || []).map(function (l) {
          return esc(l.qty) + " " + (l.u === "caja" ? (l.qty === 1 ? "caja" : "cajas") : (l.qty === 1 ? "paquete" : "paquetes")) +
            " · " + esc(l.nombre) + (l.v ? " (" + esc(l.v) + ")" : "");
        });
        return "<li><div class=\"cuenta__ped\"><b>" + esc(p.folio || "Pedido") + "</b><span>" + fecha(p.fecha) + "</span></div>" +
          (arts.length ? "<p>" + arts.join("<br>") + "</p>" : "") +
          (p.total ? '<p class="cuenta__total">' + money(p.total) + " MXN</p>" : "") + "</li>";
      }).join("") + "</ul>";
    }).catch(function () {
      var caja = cuerpo && cuerpo.querySelector(".cuenta__pedidos");
      if (caja) caja.innerHTML = '<p class="cuenta__nota">No pudimos cargar tus pedidos ahora.</p>';
    });
  }

  /* ---------------- arranque ---------------- */
  /* Sesión vencida, o de una cuenta que ya no existe: se olvida. La fecha va
     en el token; lo demás se revisa con el servidor una vez por visita. */
  if (sesion) {
    var vence = Number(String(sesion.token).split(".")[1] || 0);
    if (vence && vence * 1000 < Date.now()) guarda(null);
    else {
      var revisada = false;
      try { revisada = !!sessionStorage.getItem("greenova.cuenta.revisada"); } catch (e) { /* modo privado */ }
      if (!revisada) api("/api/cuenta").then(function (j) {
        if (j._s === 401) { guarda(null); return; }
        try { sessionStorage.setItem("greenova.cuenta.revisada", "1"); } catch (e) { /* modo privado */ }
        if (j.perfil && sesion) { sesion.perfil = j.perfil; guarda(sesion); }
      }).catch(function () { /* sin conexión: se revisa en la siguiente página */ });
    }
  }
  marcaBoton();
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#cuenta-open, [data-abre-cuenta]");
    if (!b) return;
    e.preventDefault();
    abre();
  });
  if (location.hash === "#cuenta") setTimeout(abre, 300);

  /* Lo que usan la ventana de entrada, tienda.js (token del pedido) y los formularios. */
  function acceso(ruta, datos) {
    return api(ruta, datos).then(function (j) {
      if (j.token) {
        guarda({ token: j.token, perfil: j.perfil || {} });
        if (window.GNmetrica) window.GNmetrica(ruta.indexOf("crear") > -1 ? "cuenta_creada" : "cuenta_entrada");
      }
      return j;
    });
  }
  window.GNCuenta = {
    token: function () { return sesion ? sesion.token : ""; },
    perfil: function () { return sesion ? sesion.perfil : null; },
    conocido: conocido,
    crear: function (d) { return acceso("/api/cuenta/crear", d); },
    entrar: function (d) { return acceso("/api/cuenta/entrar", d); },
    abrir: abre
  };
})();
