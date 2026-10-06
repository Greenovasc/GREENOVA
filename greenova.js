/* GreeNova SC - landing behaviour.
   No scroll listeners anywhere: sticky state and reveals both run on IntersectionObserver. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky nav border ---------- */
  var nav = document.getElementById("nav");
  if (nav) {
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      nav.dataset.stuck = String(!entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    toggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-list");
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var abriendo = nav.dataset.open !== "true";
      setMenu(abriendo);
      /* el panel del mega vive fuera de .nav__links: si se cierra el menú
         móvil hay que cerrarlo también, o se queda colgando solo */
      if (!abriendo && window.GNMega) window.GNMega(false);
    });
    links.addEventListener("click", function (e) {
      /* "Productos" también es un enlace, pero en celular abre su lista. */
      var a = e.target.closest("a");
      if (a && a.id !== "mega-btn") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.open === "true") { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- reveal on scroll ----------
     `GN.observe(nodes)` lets dynamically rendered markup (the shop grid) join in. */
  var io = null;
  if (!reduce) {
    io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  }

  function observe(nodes) {
    Array.prototype.forEach.call(nodes, function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }
  observe(document.querySelectorAll(".rv"));

  /* Red de seguridad: si el observador nunca disparó (pestaña que nunca se pintó,
     viewport de alto cero, impresión), el contenido se quedaría en opacity 0.
     Solo actúa cuando NADA se reveló, para no matar la animación del caso normal. */
  if (io) {
    setTimeout(function () {
      if (document.querySelector(".rv.in")) return;
      document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
    }, 4000);
    window.addEventListener("beforeprint", function () {
      document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
    });
  }

  if (!reduce) {
    /* Above the fold: reveal on the next frame so it animates in instead of snapping.
       rAF is paused in a hidden or background tab, so a timeout backs it up -- otherwise
       the hero would sit at opacity 0 for anyone who opens the site in a background tab. */
    var heroShown = false;
    function showHero() {
      if (heroShown) return;
      heroShown = true;
      document.querySelectorAll(".hero .rv, .shop-head .rv").forEach(function (el) {
        el.classList.add("in");
      });
    }
    requestAnimationFrame(showHero);
    setTimeout(showHero, 80);
  }




  /* ---------- mega menú de Productos ----------
     Escritorio: abre al pasar el cursor, con retardo corto para que no
     parpadee al cruzarlo de paso. Táctil y teclado: abre con clic o Enter.
     Cierra con Escape, al hacer clic fuera o al salir el foco del bloque. */
  var mega = document.getElementById("mega");
  var megaBtn = document.getElementById("mega-btn");
  var megaHost = document.getElementById("mega-host");
  if (mega && megaBtn) {
    var abreT = null, cierraT = null;
    var puntero = window.matchMedia("(hover: hover) and (pointer: fine)");
    var angosto = window.matchMedia("(max-width: 900px)");

    function setMega(open) {
      clearTimeout(abreT); clearTimeout(cierraT);
      if (open) {
        mega.hidden = false;
        /* Reflujo síncrono: el navegador tiene que ver el estado cerrado antes de
           que cambie data-open, o no hay transición. Se hace aquí y no en un
           requestAnimationFrame porque rAF se pausa en pestañas ocultas y dejaba
           el menú sin abrir. */
        void mega.offsetWidth;
      }
      mega.dataset.open = String(open);
      megaBtn.setAttribute("aria-expanded", String(open));
      if (!open) {
        cierraT = setTimeout(function () {
          if (mega.dataset.open !== "true") mega.hidden = true;
        }, 340);
      }
    }
    setMega(false);
    window.GNMega = setMega;

    /* hover solo donde hay cursor de verdad y hay espacio para el panel */
    function hoverActivo() { return puntero.matches && !angosto.matches; }

    /* "Productos" es un enlace a la tienda (Gabriel, 2026-09-28): con cursor,
       pasar encima abre el catálogo y el clic entra. En celular o tableta el
       primer toque abre la lista y el enlace sigue en "Ver toda la tienda". */
    megaBtn.addEventListener("click", function (e) {
      if (hoverActivo()) return;
      e.preventDefault();
      setMega(mega.dataset.open !== "true");
    });
    megaBtn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMega(true); var a = mega.querySelector("a"); if (a) a.focus(); }
    });
    [megaHost, mega].forEach(function (zona) {
      if (!zona) return;
      zona.addEventListener("pointerenter", function () {
        if (!hoverActivo()) return;
        clearTimeout(cierraT);
        abreT = setTimeout(function () { setMega(true); }, 90);
      });
      zona.addEventListener("pointerleave", function () {
        if (!hoverActivo()) return;
        clearTimeout(abreT);
        cierraT = setTimeout(function () { setMega(false); }, 220);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mega.dataset.open === "true") { setMega(false); megaBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (mega.dataset.open !== "true") return;
      if (!mega.contains(e.target) && !megaHost.contains(e.target)) setMega(false);
    });
    document.addEventListener("focusin", function (e) {
      if (mega.dataset.open !== "true") return;
      if (!mega.contains(e.target) && !megaHost.contains(e.target)) setMega(false);
    });
  }

  /* ---------- formulario de la portada ----------
     Solo datos de contacto (Feedback final): nombre, negocio, correo y
     teléfono; se piden nombre y teléfono. Se guarda en la base (se ve en el panel,
     pestaña Registros) y se abre el correo a ventas con los datos. */
  var form = document.getElementById("quote-form");
  if (form) {
    var status = document.getElementById("quote-status");
    var submit = document.getElementById("quote-submit");
    var label = submit.querySelector(".btn__label");

    function setError(id, message) {
      var input = document.getElementById(id);
      var slot = form.querySelector('[data-err="' + id + '"]');
      input.closest(".field").dataset.invalid = message ? "true" : "false";
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (slot) slot.textContent = message || "";
    }

    function validate() {
      var ok = true;
      var correo = document.getElementById("f-correo").value.trim();
      var tel = document.getElementById("f-tel").value.replace(/\D/g, "");
      setError("f-nombre", document.getElementById("f-nombre").value.trim() ? "" : (ok = false, "Escribe tu nombre."));
      setError("f-correo", !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? "" : (ok = false, "Escribe un correo válido (con @)."));
      setError("f-tel", tel.length >= 10 ? "" : (ok = false, "Escribe tu teléfono a 10 dígitos."));
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      if (!validate()) {
        status.textContent = "Revisa los campos marcados.";
        form.querySelector('[data-invalid="true"] input, [data-invalid="true"] textarea').focus();
        return;
      }

      submit.dataset.loading = "true";
      label.textContent = "Enviando";
      status.textContent = "";

      var data = Object.fromEntries(new FormData(form).entries());
      var fuente = window.GNfuente ? window.GNfuente() : {};
      var body = [
        "Nombre: " + data.nombre,
        "Negocio: " + (data.negocio || "No indicado"),
        "Correo: " + (data.correo || "No indicado"),
        "Teléfono: " + (data.telefono || "No indicado"),
        "",
        "¿Qué necesita?: " + (data.necesidad || "No indicado")
      ].join("\n");

      function listo() {
        window.location.href = "mailto:ventas@greenovasc.com.mx?subject=" +
          encodeURIComponent("Solicitud de información desde el sitio") + "&body=" + encodeURIComponent(body);
        submit.dataset.loading = "false";
        label.textContent = "Enviar";
        status.dataset.state = "ok";
        status.textContent = "Listo. Recibimos tus datos y te contactamos pronto.";
      }

      fetch("/api/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre, negocio: data.negocio || "", correo: data.correo || "",
          telefono: data.telefono || "", necesidad: data.necesidad || "", sitio_web: data.sitio_web || "",
          ref: fuente.ref || "", utm: fuente.utm || "",
          pagina: (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index"
        })
      }).catch(function () { /* sin base, el correo igual sale */ }).then(listo);
    });

    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field");
      if (field && field.dataset.invalid === "true") setError(e.target.id, "");
    });
  }
  /* ---------- count-up numbers ----------
     Fires once, when the stat scrolls into view. */
  var nums = document.querySelectorAll(".num[data-to]");
  if (nums.length) {
    if (reduce) {
      nums.forEach(function (n) { n.textContent = n.dataset.to; });
    } else {
      /* Si el observador nunca dispara (pestaña oculta, viewport de alto cero),
         el número se queda en 0. A los 3 s lo escribimos tal cual. */
      var numFallback = setTimeout(function () {
        nums.forEach(function (n) { if (n.textContent === "0") n.textContent = n.dataset.to; });
      }, 3000);
      var numIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          clearTimeout(numFallback);
          obs.unobserve(en.target);
          var el = en.target, to = Number(el.dataset.to) || 0, t0 = 0;
          (function tick(now) {
            if (!t0) t0 = now;
            var k = Math.min(1, (now - t0) / 1100);
            var eased = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(to * eased).toLocaleString("es-MX");
            if (k < 1) requestAnimationFrame(tick);
          })(0);
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) { numIO.observe(n); });
    }
  }

  /* ---------- magnetic buttons + ripple ----------
     Pointer-only: coarse pointers get nothing, which is what we want on touch. */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduce) {
    document.addEventListener("pointermove", function (e) {
      var b = e.target.closest(".btn--primary, .chip, .cart-btn");
      if (!b) return;
      var r = b.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.setProperty("--mx", (dx * 8).toFixed(2) + "px");
      b.style.setProperty("--my", (dy * 6).toFixed(2) + "px");
    });
    document.addEventListener("pointerleave", function (e) {
      var b = e.target.closest && e.target.closest(".btn--primary, .chip, .cart-btn");
      if (b) { b.style.removeProperty("--mx"); b.style.removeProperty("--my"); }
    }, true);
  }

  document.addEventListener("pointerdown", function (e) {
    var b = e.target.closest(".btn, .chip, .tab, .cart-btn");
    if (!b || reduce) return;
    var r = b.getBoundingClientRect();
    var d = document.createElement("span");
    d.className = "ripple";
    d.style.left = (e.clientX - r.left) + "px";
    d.style.top = (e.clientY - r.top) + "px";
    b.appendChild(d);
    setTimeout(function () { d.remove(); }, 620);
  });

  /* ---------- card tilt + cursor spotlight ---------- */
  if (fine && !reduce) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest(".pcard, .prod, .tile");
      if (!c) return;
      var r = c.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      c.style.setProperty("--px", (px * 100).toFixed(1) + "%");
      c.style.setProperty("--py", (py * 100).toFixed(1) + "%");
      c.style.setProperty("--rx", ((0.5 - py) * 5).toFixed(2) + "deg");
      c.style.setProperty("--ry", ((px - 0.5) * 6).toFixed(2) + "deg");
    });
    document.addEventListener("pointerleave", function (e) {
      var c = e.target.closest && e.target.closest(".pcard, .prod, .tile");
      if (c) { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
    }, true);
  }

  /* ---------- accordion ---------- */
  document.querySelectorAll(".acc__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".acc__item");
      var open = item.dataset.open === "true";
      item.parentElement.querySelectorAll(".acc__item").forEach(function (o) {
        o.dataset.open = "false";
        o.querySelector(".acc__q").setAttribute("aria-expanded", "false");
      });
      item.dataset.open = String(!open);
      q.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------- back to top ---------- */
  var top = document.getElementById("to-top");
  if (top) {
    var topSentinel = document.querySelector(".hero, .shop-head");
    if (topSentinel) {
      new IntersectionObserver(function (en) {
        top.dataset.on = String(!en[0].isIntersecting);
      }, { rootMargin: "-40% 0px 0px 0px" }).observe(topSentinel);
    }
    top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- success burst ----------
     Twelve leaf-coloured chips thrown from the button. Purely decorative. */
  function burst(el) {
    if (reduce || !el) return;
    var r = el.getBoundingClientRect();
    var host = document.createElement("div");
    host.className = "burst";
    host.style.left = (r.left + r.width / 2) + "px";
    host.style.top = (r.top + r.height / 2) + "px";
    for (var i = 0; i < 12; i++) {
      var s = document.createElement("i");
      var a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      var dist = 60 + Math.random() * 70;
      s.style.setProperty("--dx", (Math.cos(a) * dist).toFixed(1) + "px");
      s.style.setProperty("--dy", (Math.sin(a) * dist - 20).toFixed(1) + "px");
      s.style.setProperty("--d", (Math.random() * 90).toFixed(0) + "ms");
      s.style.setProperty("--rot", (Math.random() * 360).toFixed(0) + "deg");
      host.appendChild(s);
    }
    document.body.appendChild(host);
    setTimeout(function () { host.remove(); }, 1200);
  }

  /* ---------- cart badge outside the shop ----------
     index.html shows the same counter the shop writes, so the nav stays honest. */
  var badge = document.getElementById("cart-count");
  /* Donde está tienda.js (tienda, ofertas, ficha) el contador lo pinta él. */
  if (badge && !document.getElementById("cart-list")) {
    try {
      var saved = JSON.parse(localStorage.getItem("greenova.carrito.v2") || "[]");
      var n = Array.isArray(saved) ? saved.length : 0;
      badge.textContent = n;
      badge.dataset.empty = String(n === 0);
    } catch (e) { /* modo privado */ }
  }

  /* ---------- ventana de entrada: regístrate o inicia sesión ----------
     Grande, con la marca (foto + panel verde) y dos pestañas (Gabriel,
     2026-09-28/29), sin contraseña:
     - "Registrarme": nombre y apellido, WhatsApp (obligatorio), correo
       (opcional) y, si quiere, una duda.
     - "Iniciar sesión": el nombre y el WhatsApp con que se registró.
     Las cuentas viven en cuenta.js y /api/cuenta* (main.py).
     - Sale sola al entrar mientras no haya sesión abierta. Si la cierran o le
       dan "Ignorar por ahora", ya no sale el resto de la visita.
       Si en este navegador ya hubo cuenta, abre en "Iniciar sesión" con sus
       datos ya escritos.
     - Antes de mandar un pedido (`data-requiere-registro`) pide la sesión y,
       al entrar, el pedido sigue solo.
     - El icono de persona y el letrero "Inicia sesión / Regístrate" sin
       sesión abren esta misma ventana.
     `?bienvenida=1` la abre al momento para revisarla. */
  (function () {
    var CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var forzar = /[?&]bienvenida=1\b/.test(location.search);
    var VISTO = "greenova.bienvenida.sesion";
    function metrica(evento) { if (window.GNmetrica) window.GNmetrica(evento); }
    function conSesion() { return !!(window.GNCuenta && window.GNCuenta.token()); }
    function conocido() { return window.GNCuenta ? window.GNCuenta.conocido() : null; }
    function digitos(t) {
      var d = String(t || "").replace(/\D/g, "");
      if (d.length === 13 && d.indexOf("521") === 0) d = d.slice(3);
      else if (d.length === 12 && d.indexOf("52") === 0) d = d.slice(2);
      return d;
    }
    var host, caja, anterior, pendiente = null, modo = "entrada", tab = "registro";
    var TEXTOS = {
      entrada: {
        registro: ["Regístrate o <em>inicia sesión</em>", "Solo tu nombre y tu WhatsApp."],
        entrar: ["Inicia <em>sesión</em>", "Qué gusto verte de nuevo. Entra con tu nombre y tu WhatsApp."]
      },
      /* Ya eligió su paquetería en pagar.html y le dio "Continuar con la compra". */
      pedido: {
        registro: ["Regístrate para <em>continuar tu pedido</em>", "Estás a un paso de realizar tu pedido."],
        entrar: ["Inicia sesión para <em>continuar tu pedido</em>", "Estás a un paso de realizar tu pedido."]
      },
      /* "Descargar catálogo gratis" de la portada: al registrarse se baja solo. */
      catalogo: {
        registro: ["Regístrate y <em>descarga el catálogo</em>", "Solo tu nombre y tu WhatsApp. Al terminar, se descarga solo."],
        entrar: ["Inicia sesión y <em>descarga el catálogo</em>", "Entra con tu nombre y tu WhatsApp. Al terminar, se descarga solo."]
      }
    };

    /* Lo que dejó al registrarse llena solo el formulario del pedido. */
    function rellena() {
      var d;
      try { d = JSON.parse(localStorage.getItem("greenova.registro") || "null"); } catch (e) { d = null; }
      if (!d) return;
      [["s-nombre", d.nombre], ["s-negocio", d.negocio], ["s-correo", d.correo], ["s-tel", d.telefono],
       ["f-nombre", d.nombre], ["f-negocio", d.negocio], ["f-correo", d.correo], ["f-tel", d.telefono]].forEach(function (c) {
        var el = document.getElementById(c[0]);
        if (el && !el.value && c[1]) el.value = c[1];
      });
    }
    function recuerda(d) {
      try {
        localStorage.setItem("greenova.registro", JSON.stringify({
          nombre: d.nombre || "", negocio: d.negocio || "", correo: d.correo || "", telefono: d.telefono || "" }));
      } catch (e) { /* modo privado */ }
      rellena();
    }
    rellena();

    /* Campo con su icono a la izquierda; la etiqueta queda para lectores de pantalla. */
    function campo(id, nombre, tipo, ph, ico, extra) {
      return '<div class="bienv__campo">' +
        '<svg class="ico" aria-hidden="true"><use href="#' + ico + '"></use></svg>' +
        '<label class="sr-only" for="' + id + '">' + ph + "</label>" +
        '<input id="' + id + '" name="' + nombre + '" type="' + tipo + '" placeholder="' + ph + '" ' + (extra || "") + ">" +
        "</div>";
    }

    function arma() {
      host = document.createElement("div");
      host.className = "bienv";
      host.hidden = true;
      host.innerHTML =
        '<div class="bienv__fondo" data-cerrar></div>' +
        '<div class="bienv__caja" role="dialog" aria-modal="true" aria-labelledby="bienv-t">' +
          '<div class="bienv__foto">' +
            '<img src="assets/prod/fajilla-kraft.webp?v=20260926c" alt="Vaso de papel con fajilla kraft GreeNova SC" width="900" height="900" decoding="async">' +
            '<div class="bienv__firma">' +
              '<img src="assets/logo-greenova-claro.svg" alt="GreeNova SC" width="1664" height="377">' +
              "<p>El futuro se sirve en GreeNova.</p>" +
            "</div>" +
          "</div>" +
          '<div class="bienv__cuerpo">' +
            '<div class="bienv__top">' +
              '<div class="bienv__tabs" role="tablist" aria-label="Registro o inicio de sesión">' +
                '<button type="button" role="tab" data-tab="registro">Registrarme</button>' +
                '<button type="button" role="tab" data-tab="entrar">Iniciar sesión</button>' +
              "</div>" +
              '<button class="bienv__x" type="button" aria-label="Cerrar" data-cerrar>' +
                '<svg class="ico" aria-hidden="true"><use href="#i-x"></use></svg></button>' +
            "</div>" +
            '<div class="bienv__contenido">' +
              '<h2 id="bienv-t"></h2>' +
              '<p class="bienv__txt"></p>' +
              '<form class="bienv__form" data-form="registro" novalidate>' +
                campo("bienv-nombre", "nombre", "text", "Nombre y apellido", "i-user-circle", 'autocomplete="name" maxlength="80"') +
                campo("bienv-tel", "telefono", "tel", "WhatsApp (10 dígitos)", "i-whatsapp-logo", 'autocomplete="tel-national" inputmode="tel" maxlength="20"') +
                campo("bienv-correo", "correo", "email", "Correo (opcional)", "i-envelope-simple", 'autocomplete="email" inputmode="email" maxlength="120"') +
                '<label class="sr-only" for="bienv-duda">¿Tienes alguna duda?</label>' +
                '<textarea id="bienv-duda" name="necesidad" rows="2" maxlength="500" placeholder="¿Tienes alguna duda? (opcional)"></textarea>' +
                '<input class="bienv__trampa" name="sitio_web" tabindex="-1" autocomplete="off" aria-hidden="true">' +
                '<p class="bienv__estado" role="status" aria-live="polite"></p>' +
                '<button class="bienv__btn" type="submit"><span class="btn__label">Registrarme</span>' +
                  '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>' +
                '<p class="bienv__legal">Al registrarte aceptas el <a href="aviso-de-privacidad.html" target="_blank">Aviso de privacidad</a>.</p>' +
              "</form>" +
              '<form class="bienv__form" data-form="entrar" novalidate hidden>' +
                campo("bienv-nombre2", "nombre", "text", "Nombre y apellido", "i-user-circle", 'autocomplete="name" maxlength="80"') +
                campo("bienv-tel2", "telefono", "tel", "WhatsApp (10 dígitos)", "i-whatsapp-logo", 'autocomplete="tel-national" inputmode="tel" maxlength="20"') +
                '<p class="bienv__estado" role="status" aria-live="polite"></p>' +
                '<button class="bienv__btn" type="submit"><span class="btn__label">Iniciar sesión</span>' +
                  '<svg class="ico" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>' +
                '<p class="bienv__nota">¿Aún no tienes cuenta? <button type="button" class="bienv__link" data-tab="registro">Regístrate</button></p>' +
              "</form>" +
              '<button class="bienv__ignorar" type="button" data-ignorar>Ignorar por ahora</button>' +
            "</div>" +
          "</div>" +
        "</div>";
      document.body.appendChild(host);
      caja = host.querySelector(".bienv__caja");

      host.addEventListener("click", function (e) {
        var t = e.target.closest("[data-tab]");
        if (t) { pestana(t.dataset.tab, true); return; }
        if (e.target.closest("[data-ignorar]")) {
          /* En el catálogo este botón es "Descargar sin registrarme": baja igual. */
          var sigue = modo === "catalogo" ? pendiente : null;
          pendiente = null;
          metrica("registro_ignorado");
          cierra();
          if (sigue) setTimeout(function () { sigue(true); }, reduce ? 0 : 280);
          return;
        }
        if (e.target.closest("[data-cerrar]")) cierra();
      });
      host.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.stopPropagation(); cierra(); return; }
        if (e.key !== "Tab") return;
        var f = Array.prototype.filter.call(caja.querySelectorAll("button, input:not([tabindex='-1']), textarea, a"),
          function (el) { return el.offsetParent !== null; });
        var primero = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      });
      host.addEventListener("input", function (e) {
        if (e.target.getAttribute("aria-invalid") === "true") e.target.removeAttribute("aria-invalid");
      });
      host.addEventListener("submit", envia);
    }

    function forma(cual) { return host.querySelector('form[data-form="' + cual + '"]'); }

    function pestana(cual, foco) {
      tab = cual;
      host.querySelectorAll("[data-tab]").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.dataset.tab === cual));
      });
      forma("registro").hidden = cual !== "registro";
      forma("entrar").hidden = cual !== "entrar";
      var t = (TEXTOS[modo] || TEXTOS.entrada)[cual];
      host.querySelector("h2").innerHTML = t[0];
      host.querySelector(".bienv__txt").textContent = t[1];
      /* Si viene de comprar, el botón dice "Continuar con la compra" y no hay
         "Ignorar por ahora" (para cerrar está la X). */
      var compra = modo === "pedido", catalogo = modo === "catalogo";
      forma("registro").querySelector(".btn__label").textContent = compra ? "Continuar con la compra" : catalogo ? "Descargar catálogo" : "Registrarme";
      forma("entrar").querySelector(".btn__label").textContent = compra ? "Continuar con la compra" : catalogo ? "Descargar catálogo" : "Iniciar sesión";
      host.querySelector("[data-ignorar]").hidden = compra;
      host.querySelector("[data-ignorar]").textContent = catalogo ? "Descargar sin registrarme" : "Ignorar por ahora";
      host.querySelectorAll(".bienv__estado").forEach(function (x) { x.textContent = ""; });
      var c = conocido(), fe = forma("entrar");
      if (cual === "entrar" && c) {
        if (!fe.nombre.value) fe.nombre.value = c.nombre || "";
        if (!fe.telefono.value) fe.telefono.value = c.telefono || "";
      }
      if (foco) {
        var f = forma(cual);
        var primero = Array.prototype.filter.call(f.querySelectorAll("input:not([tabindex='-1'])"),
          function (i) { return !i.value; })[0] || f.querySelector(".bienv__btn");
        setTimeout(function () { primero.focus({ preventScroll: true }); }, 40);
      }
    }

    function abre(como, luego, cual) {
      /* Después de entrar la caja muestra "¡Listo!": se arma de nuevo. */
      if (host && !host.querySelector("form")) { host.remove(); host = null; }
      if (!host) arma();
      modo = como || "entrada";
      pendiente = luego || null;
      pestana(cual || (conocido() ? "entrar" : "registro"), false);
      anterior = document.activeElement;
      host.hidden = false;
      document.documentElement.classList.add("bienv-abierta");
      requestAnimationFrame(function () { host.dataset.open = "true"; });
      setTimeout(function () { pestana(tab, true); }, 60);
      metrica("popup_visto");
    }

    function cierra() {
      if (!host || host.hidden) return;
      if (!conSesion()) {
        metrica("popup_cerrado");
        try { sessionStorage.setItem(VISTO, "1"); } catch (e) { /* modo privado */ }
      }
      pendiente = null;
      host.dataset.open = "false";
      document.documentElement.classList.remove("bienv-abierta");
      setTimeout(function () { host.hidden = true; }, reduce ? 0 : 260);
      if (anterior && anterior.focus) anterior.focus({ preventScroll: true });
    }

    function error(form, nombre, texto) {
      var estado = form.querySelector(".bienv__estado");
      estado.dataset.state = "error";
      estado.textContent = texto;
      if (nombre && form[nombre]) {
        form[nombre].setAttribute("aria-invalid", "true");
        form[nombre].focus();
      }
    }

    function envia(e) {
      var form = e.target.closest("form[data-form]");
      if (!form || !window.GNCuenta) return;
      e.preventDefault();
      var cual = form.dataset.form;
      var d = { nombre: form.nombre.value.trim().replace(/\s+/g, " "), telefono: form.telefono.value.trim() };
      if (d.nombre.length < 2) return error(form, "nombre", "Escribe tu nombre y apellido.");
      if (digitos(d.telefono).length !== 10) return error(form, "telefono", "Escribe tu WhatsApp a 10 dígitos.");
      if (cual === "registro") {
        d.correo = form.correo.value.trim();
        d.necesidad = form.necesidad.value.trim();
        d.sitio_web = form.sitio_web.value;
        if (d.correo && !CORREO.test(d.correo)) return error(form, "correo", d.correo.indexOf("@") < 0 ?
          "A tu correo le falta la @ (ejemplo: nombre@negocio.com). Si no quieres, déjalo vacío." :
          "Revisa tu correo, parece incompleto. Si no quieres, déjalo vacío.");
      }
      var btn = form.querySelector(".bienv__btn");
      var label = btn.querySelector(".btn__label");
      var antes = label.textContent;
      btn.disabled = true;
      label.textContent = cual === "registro" ? "Creando tu cuenta…" : "Entrando…";
      form.querySelector(".bienv__estado").textContent = "";

      (cual === "registro" ? window.GNCuenta.crear(d) : window.GNCuenta.entrar(d)).then(function (j) {
        btn.disabled = false;
        label.textContent = antes;
        if (j.token) {
          var perfil = j.perfil || {};
          if (cual === "registro") {
            /* También queda en "Registros" del panel, con su duda. */
            var fuente = window.GNfuente ? window.GNfuente() : {};
            fetch("/api/suscribir", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre: d.nombre, correo: d.correo, telefono: d.telefono, necesidad: d.necesidad,
                ref: fuente.ref || "", utm: fuente.utm || "",
                pagina: (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index"
              })
            }).catch(function () { /* la cuenta ya quedó */ });
          }
          return listo(perfil);
        }
        var err = j.error || "";
        if (err === "cuenta_existe") {
          /* Ese WhatsApp ya tiene cuenta con otro nombre: que entre con el suyo. */
          var fe = forma("entrar");
          fe.telefono.value = d.telefono;
          fe.nombre.value = "";
          pestana("entrar", false);
          return error(fe, "nombre", "Ese WhatsApp ya tiene cuenta. Escribe el nombre con que te registraste.");
        }
        if (err === "datos_incorrectos") return error(form, "nombre",
          "Ese nombre y ese WhatsApp no coinciden con ninguna cuenta. Revísalos o regístrate.");
        if (err === "correo_invalido") return error(form, "correo", "Revisa tu correo, parece que tiene un error.");
        if (err === "telefono_invalido") return error(form, "telefono", "Escribe tu WhatsApp a 10 dígitos.");
        if (err === "nombre") return error(form, "nombre", "Escribe tu nombre y apellido.");
        error(form, null, j._s === 429 ? "Demasiados intentos desde aquí. Espera unos minutos." :
                                         "No pudimos entrar ahora. Intenta de nuevo en un momento.");
      }).catch(function () {
        btn.disabled = false;
        label.textContent = antes;
        error(form, null, "No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
      });
    }

    function listo(perfil) {
      recuerda(perfil);
      /* Venía de "Enviar mi pedido" o "Comprar ahora": se cierra y sigue. */
      if (pendiente) {
        var sigue = pendiente;
        pendiente = null;
        cierra();
        setTimeout(sigue, reduce ? 0 : 280);
        return;
      }
      var primer = (perfil.nombre || "").split(" ")[0];
      var cont = host.querySelector(".bienv__contenido");
      host.querySelector(".bienv__tabs").hidden = true;
      cont.innerHTML =
        '<h2 id="bienv-t"></h2>' +
        '<p class="bienv__txt">Ya iniciaste sesión. Tus pedidos se guardan en tu cuenta.</p>' +
        '<button class="bienv__btn" type="button" data-cerrar><span class="btn__label">Seguir viendo</span></button>';
      cont.querySelector("h2").innerHTML = "¡Listo<em></em>!";
      cont.querySelector("em").textContent = primer ? ", " + primer : "";
      cont.querySelector("button").focus({ preventScroll: true });
    }

    /* No interrumpir: si están escribiendo (buscador, chat) o tienen abierto
       el carrito, se espera y se vuelve a intentar. */
    function cuandoSePueda() {
      if (conSesion()) return;
      var ocupado = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      var drawer = document.getElementById("drawer");
      if (document.hidden || ocupado || (drawer && drawer.dataset.open === "true")) {
        setTimeout(cuandoSePueda, 5000);
        return;
      }
      abre();
    }
    /* 1. Al entrar, sola, mientras no haya sesión y no la hayan cerrado en
       esta visita (recargar sin cerrarla la vuelve a mostrar). */
    var yaSalio = false;
    try { yaSalio = !!sessionStorage.getItem(VISTO); } catch (e) { /* modo privado */ }
    if (location.hash === "#registro") {
      setTimeout(function () { abre("entrada", null, "registro"); }, 300);
    } else if (forzar || (!conSesion() && !yaSalio && document.body.dataset.modo !== "pagar")) {
      /* En pagar.html no sale sola: ahí se pide después de elegir paquetería. */
      setTimeout(cuandoSePueda, forzar ? 300 : 450);
    }

    /* 2. Antes de mandar el pedido o pagar: sin sesión no se sigue. Se
       escucha en captura para detener el clic antes que su propio código. */
    document.addEventListener("click", function (e) {
      var el = e.target.closest && e.target.closest("[data-requiere-registro]");
      if (!el || el.tagName === "FORM" || conSesion() || el.dataset.libre) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      /* sinCuenta: "Descargar sin registrarme" del catálogo; esa liga ya no vuelve a preguntar. */
      abre(el.dataset.registroModo || "pedido", function (sinCuenta) {
        if (sinCuenta) el.dataset.libre = "1";
        el.click();
      });
    }, true);
    document.addEventListener("submit", function (e) {
      var f = e.target;
      if (!f.hasAttribute || !f.hasAttribute("data-requiere-registro") || conSesion()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      abre("pedido", function () {
        if (f.requestSubmit) f.requestSubmit();
        else f.dispatchEvent(new Event("submit", { cancelable: true }));
      });
    }, true);

    /* 3. "Registro de cliente" del pie: abre la ventana en "Registrarme". */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-abre-registro]");
      if (!a) return;
      e.preventDefault();
      if (conSesion() && window.GNCuenta) window.GNCuenta.abrir();
      else abre("entrada", null, "registro");
    });

    window.GNRegistro = {
      registrado: conSesion,
      /* Para el paso de paquetería y pago: GNRegistro.exigir(seguir). */
      exigir: function (seguir) { if (conSesion()) seguir(); else abre("pedido", seguir); },
      /* cuenta.js: quien entra desde el panel lateral llena los formularios. */
      marcar: recuerda,
      /* Icono de persona sin sesión: esta misma ventana. */
      abrirCuenta: function (cual) { abre("entrada", null, cual); }
    };
  })();

  /* ---------- "¿Qué empaque necesitas?" de la portada: al asistente ---------- */
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.hasAttribute || !f.hasAttribute("data-pregunta-agente") || !window.GNAgente) return;
    e.preventDefault();
    var q = (f.querySelector("input").value || "").trim();
    window.GNAgente.abrir(q || "");
    f.querySelector("input").value = "";
  });

  /* ---------- lupa del menú: abre el asistente ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-abre-agente]");
    if (!b || !window.GNAgente) return;
    e.preventDefault();
    window.GNAgente.abrir();
  });

  (function () {
    var m = location.search.match(/[?&]interes=([^&#]+)/);
    var campo = document.getElementById("f-mensaje");
    if (!m || !campo) return;
    var que = decodeURIComponent(m[1].replace(/\+/g, " ")).slice(0, 80);
    campo.value = "Me interesa: " + que + ". ";
  })();

  /* ---------- "Cotizar" desde Nuestros productos: baja al formulario con
     el producto ya escrito en "¿Qué necesitas?" ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-interes]");
    var campo = document.getElementById("f-mensaje");
    if (!a || !campo) return;
    var frase = "Me interesa: " + a.dataset.interes + ".";
    if (campo.value.indexOf(frase) === -1) campo.value = (campo.value ? campo.value + "\n" : "") + frase + " ";
    setTimeout(function () { campo.focus({ preventScroll: true }); }, 600);
  });

  window.GN = { observe: observe, burst: burst };
})();
