/* GreeNova SC - panel de catálogo.
   ===========================================================================
   Edita productos, precios por medida, pedido mínimo y ofertas, y guarda el resultado como
   un commit en GitHub. El archivo productos.js lo escribe el servidor, no este
   script: aquí solo se manda la información ya editada.

   Lo que se ve en pantalla sale de window.GREENOVA, o sea del mismo productos.js
   que usa el sitio. No hay una segunda copia de los datos que se pueda
   desincronizar.

   La contraseña nunca se guarda: el servidor devuelve un token con caducidad y
   ese token vive en sessionStorage, que se borra al cerrar la pestaña.
   =========================================================================== */
(function () {
  "use strict";

  var LLAVE_SESION = "greenova.panel.token";
  var LLAVE_USUARIO = "greenova.panel.usuario";
  var MIN_PIEZAS = 10000;  /* pedido mínimo por omisión (igual que MIN_PIEZAS en main.py) */
  var $ = function (id) { return document.getElementById(id); };

  /* Copia de trabajo: se edita esto, no el catálogo que el sitio ya cargó. */
  var datos = null;
  var original = null;
  var sucios = {};       /* ids con cambios sin guardar */
  var nuevos = {};       /* ids agregados en esta sesión */

  /* ============================ acceso ============================ */

  function avisoEntrar(texto) {
    var el = $("aviso-entrar");
    el.textContent = texto;
    el.dataset.tipo = "error";
    el.hidden = !texto;
  }

  /* Primera vez en tu computadora: no hay contraseña y se crea aquí mismo.
     En Render nunca pasa (la contraseña es ADMIN_PASSWORD). */
  var modoCrear = false;

  function post(url, cuerpo) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    });
  }

  function guardarToken(t, usuario) {
    try {
      sessionStorage.setItem(LLAVE_SESION, t);
      if (usuario) sessionStorage.setItem(LLAVE_USUARIO, usuario);
    } catch (err) { /* modo privado */ }
  }

  function mensajeError(codigo) {
    if (codigo === "demasiados_intentos")
      return "Demasiados intentos fallidos. Por seguridad el acceso queda bloqueado 15 minutos.";
    if (codigo === "panel_sin_configurar")
      return "El panel no tiene administradores configurados en el servidor (ADMIN_USUARIOS).";
    if (codigo === "clave_corta") return "La contraseña necesita al menos 8 letras o números.";
    return "Usuario o contraseña incorrectos.";
  }

  var pideUsuario = false;
  /* El panel solo se abre si el servidor confirma que la sesión guardada en
     esta pestaña sigue valiendo (no basta con que exista un token). */
  fetch("/api/admin/estado", { headers: { Authorization: "Bearer " + token() } })
  .then(function (r) { return r.json(); }).then(function (e) {
    pideUsuario = !!e.pide_usuario;
    $("usuario-wrap").hidden = !pideUsuario;
    $("usuario").required = pideUsuario;
    $("btn-clave").hidden = !e.cambiar_aqui;
    $("btn-admins").hidden = !e.cambiar_aqui;
    if (e.sesion) { abrirPanel(); return; }
    try { sessionStorage.removeItem(LLAVE_SESION); } catch (err) {}
    if (!e.configurado && e.cambiar_aqui) {
      modoCrear = true;
      $("entrar-titulo").textContent = "Crea la contraseña del panel";
      $("entrar-texto").textContent = "Es la primera vez. Elige una contraseña de al menos 8 letras o números " +
        "y escríbela dos veces. Con ella vas a entrar de ahora en adelante.";
      $("clave-etq").textContent = "Contraseña nueva";
      $("clave").autocomplete = "new-password";
      $("repite-wrap").hidden = false;
      $("entrar-btn").textContent = "Crear y entrar";
    }
  }).catch(function () { /* sin servidor: el envío del formulario lo avisa */ });

  $("form-entrar").addEventListener("submit", function (e) {
    e.preventDefault();
    var clave = $("clave").value;
    if (!clave) return;
    avisoEntrar("");

    if (modoCrear) {
      if (clave.length < 8) { avisoEntrar("La contraseña necesita al menos 8 letras o números."); return; }
      if (clave !== $("clave2").value) { avisoEntrar("Las dos no son iguales. Escríbelas otra vez."); return; }
    }

    post(modoCrear ? "/api/admin/crear" : "/api/admin/entrar",
         modoCrear ? { nueva: clave } : { usuario: $("usuario").value.trim().toLowerCase(), clave: clave })
    .then(function (res) {
      if (!res.ok) { avisoEntrar(mensajeError(res.j.error)); return; }
      guardarToken(res.j.token, res.j.usuario);
      $("clave").value = ""; $("clave2").value = "";
      abrirPanel();
    }).catch(function () {
      avisoEntrar("El panel está apagado. Ábrelo con doble clic en abrir-panel.command.");
    });
  });

  /* ---------- salir ---------- */
  $("btn-salir").addEventListener("click", function () {
    if (Object.keys(sucios).length &&
        !confirm("Tienes cambios sin guardar. ¿Salir de todos modos?")) return;
    sucios = {};
    try { sessionStorage.removeItem(LLAVE_SESION); sessionStorage.removeItem(LLAVE_USUARIO); } catch (err) {}
    location.reload();
  });

  /* ---------- administradores para Render (solo en tu computadora) ---------- */
  function avisoAdmins(texto, tipo) {
    var el = $("aviso-admins");
    el.textContent = texto;
    el.dataset.tipo = tipo || "error";
    el.hidden = !texto;
  }
  $("btn-admins").addEventListener("click", function () {
    $("admins").hidden = false; $("adm-usuario").focus();
  });
  $("admins-cerrar").addEventListener("click", function () {
    $("form-admins").reset(); $("adm-linea-wrap").hidden = true;
    $("admins-copiar").hidden = true; avisoAdmins(""); $("admins").hidden = true;
  });
  $("form-admins").addEventListener("submit", function (e) {
    e.preventDefault();
    var usuario = $("adm-usuario").value.trim().toLowerCase();
    var clave = $("adm-clave").value;
    if (!/^[a-z0-9_-]{2,30}$/.test(usuario)) { avisoAdmins("El usuario solo lleva minúsculas, números, - o _ (sin espacios)."); return; }
    if (clave.length < 12) { avisoAdmins("La contraseña necesita al menos 12 caracteres."); return; }
    if (clave !== $("adm-clave2").value) { avisoAdmins("Las dos contraseñas no son iguales."); return; }
    post("/api/admin/generar-usuario", { token: token(), usuario: usuario, clave: clave }).then(function (res) {
      if (!res.ok) { avisoAdmins("No se pudo generar (" + (res.j.error || "error") + ")."); return; }
      $("adm-clave").value = ""; $("adm-clave2").value = "";
      $("adm-linea").value = res.j.linea;
      $("adm-linea-wrap").hidden = false; $("admins-copiar").hidden = false;
      avisoAdmins("Listo. Copia la línea y pégala en Render. Anota la contraseña en un lugar seguro: no se puede recuperar.", "ok");
    }).catch(function () { avisoAdmins("El panel está apagado."); });
  });
  $("admins-copiar").addEventListener("click", function () {
    $("adm-linea").select();
    try { navigator.clipboard.writeText($("adm-linea").value); } catch (err) { document.execCommand("copy"); }
    avisoAdmins("Copiada.", "ok");
  });

  /* ---------- cambiar contraseña (solo en tu computadora) ---------- */
  function avisoCambio(texto, tipo) {
    var el = $("aviso-cambio");
    el.textContent = texto;
    el.dataset.tipo = tipo || "error";
    el.hidden = !texto;
  }

  $("btn-clave").addEventListener("click", function () {
    $("cambio").hidden = false;
    avisoCambio("");
    $("clave-actual").focus();
  });
  $("cambio-cancelar").addEventListener("click", function () {
    $("form-cambio").reset();
    $("cambio").hidden = true;
  });

  $("form-cambio").addEventListener("submit", function (e) {
    e.preventDefault();
    var nueva = $("clave-nueva").value;
    if (nueva.length < 8) { avisoCambio("La nueva necesita al menos 8 letras o números."); return; }
    if (nueva !== $("clave-nueva2").value) { avisoCambio("Las dos nuevas no son iguales."); return; }

    post("/api/admin/cambiar", { token: token(), actual: $("clave-actual").value, nueva: nueva })
    .then(function (res) {
      if (!res.ok) {
        avisoCambio(res.j.error === "demasiados_intentos" ? mensajeError(res.j.error)
          : res.j.error === "clave_incorrecta" ? "La contraseña actual no es correcta."
          : res.j.error === "sesion_vencida" ? "Tu sesión venció. Recarga la página y vuelve a entrar."
          : res.j.error === "cambiar_en_render" ? "Aquí la contraseña se cambia en Render (Environment → ADMIN_PASSWORD)."
          : "No se pudo cambiar (" + (res.j.error || "error") + ").");
        return;
      }
      guardarToken(res.j.token, res.j.usuario);
      $("form-cambio").reset();
      avisoCambio("Listo. Desde ahora entras con la contraseña nueva.", "ok");
    }).catch(function () {
      avisoCambio("El panel está apagado. Ábrelo con doble clic en abrir-panel.command.");
    });
  });

  function token() {
    try { return sessionStorage.getItem(LLAVE_SESION) || ""; } catch (e) { return ""; }
  }

  /* ============================ datos ============================ */

  function clonar(v) { return JSON.parse(JSON.stringify(v)); }

  function cargar() {
    var G = window.GREENOVA;
    datos = {
      categorias: clonar(G.CATEGORIAS),
      materiales: clonar(G.MATERIALES),
      productos: clonar(G.PRODUCTOS),
      promos: clonar(G.PROMOS || {}),
      /* No se edita aquí, pero tiene que viajar: el servidor reescribe
         productos.js completo y sin esto se perdería. */
      tapasPorVaso: clonar(G.TAPAS_POR_VASO || {})
    };
    original = clonar(datos);
    sucios = {};
    nuevos = {};
  }

  function producto(id) {
    return datos.productos.filter(function (p) { return p.id === id; })[0];
  }

  function promo(id) {
    if (!datos.promos[id]) datos.promos[id] = {};
    return datos.promos[id];
  }

  /* Una promo sin nada adentro no debe viajar: ensucia el archivo y hace que el
     producto aparezca en el outlet sin motivo. */
  function limpiarPromo(id) {
    var pr = datos.promos[id];
    if (!pr) return;
    if (!pr.desc && !pr.nota && !pr.hasta && !pr.agotado) delete datos.promos[id];
  }

  function marcarSucio(id) {
    sucios[id] = true;
    pintarResumen();
    var ficha = document.querySelector('[data-ficha="' + id + '"]');
    if (ficha) ficha.dataset.sucio = "true";
  }

  function hayCambios() {
    return Object.keys(sucios).length > 0 || JSON.stringify(datos) !== JSON.stringify(original);
  }

  /* ============================ pintado ============================ */

  function opcionesCat(sel) {
    return datos.categorias.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === sel ? " selected" : "") + ">" + c.nombre + "</option>";
    }).join("");
  }

  function ficha(p) {
    var pr = datos.promos[p.id] || {};
    var el = document.createElement("article");
    el.className = "ficha";
    el.dataset.ficha = p.id;
    if (sucios[p.id]) el.dataset.sucio = "true";
    if (nuevos[p.id]) el.dataset.nuevo = "true";

    el.innerHTML =
      '<div class="ficha__fila1">' +
        '<div><span class="campo">Producto</span>' +
          '<input type="text" data-c="nombre" value="' + esc(p.nombre) + '"></div>' +
        '<div><span class="campo">Categoría</span>' +
          '<select data-c="cat">' + opcionesCat(p.cat) + "</select></div>" +
        /* Los que se venden en línea tienen precio por pieza en cada medida
           (bloque de abajo); el precio por caja solo aplica a los de cotización. */
        (p.venta
          ? '<div><span class="campo">Precio</span><p class="adm__sub">Por pieza, en cada medida ↓</p></div>'
          : '<div><span class="campo">Precio por caja (MXN)</span>' +
              '<input type="number" min="0" step="0.01" data-c="precio" placeholder="Cotizar" value="' +
                (p.precio == null ? "" : p.precio) + '"></div>') +
        '<div><button class="btn btn--ghost btn--sm" type="button" data-accion="borrar">' +
          '<span class="btn__label">Quitar</span></button></div>' +
      "</div>" +

      ventaHTML(p) +

      '<div class="ficha__mas">' +
        '<label><span class="campo">Descripción</span>' +
          '<textarea data-c="desc">' + esc(p.desc || "") + "</textarea></label>" +
        '<div>' +
          /* Tope inferior de 1,000 al editar (Gabriel, 2026-09-24). No se
             fuerza sobre lo que ya existe: 3 productos traen 300 del catálogo. */
          '<label><span class="campo">Piezas por caja (mínimo 1,000)</span>' +
            '<input type="number" min="1000" step="1000" data-c="p" value="' + (p.p || "") + '"></label>' +
          '<label style="margin-top:.7rem"><span class="campo">Imagen (nombre del archivo)</span>' +
            '<input type="text" data-c="img" value="' + esc(p.img || "") + '"></label>' +
        "</div>" +
        '<div>' +
          '<span class="campo">Materiales</span>' +
          '<div class="ficha__mats">' + materialesHTML(p) + "</div>" +
          '<label style="margin-top:.7rem"><span class="campo">Sello (opcional)</span>' +
            '<input type="text" data-c="sello" value="' + esc(p.sello || "") + '" placeholder="SEDEMA"></label>' +
          '<label class="marca" style="margin-top:.7rem">' +
            '<input type="checkbox" data-c="destacado"' + (p.destacado ? " checked" : "") + "> Destacado</label>" +
        "</div>" +
      "</div>" +

      '<div class="ficha__promo">' +
        '<label class="marca"><input type="checkbox" data-p="agotado"' +
          (pr.agotado ? " checked" : "") + "> Agotado</label>" +
        '<label><span class="campo">Descuento %</span>' +
          '<input type="number" min="0" max="99" step="1" data-p="desc" value="' + (pr.desc || "") + '"></label>' +
        '<label><span class="campo">Etiqueta de oferta</span>' +
          '<input type="text" data-p="nota" value="' + esc(pr.nota || "") + '" placeholder="Última existencia"></label>' +
        '<label><span class="campo">Vigente hasta</span>' +
          '<input type="date" data-p="hasta" value="' + esc(pr.hasta || "") + '"></label>' +
        '<p class="adm__sub">id: <code>' + esc(p.id) + "</code></p>" +
      "</div>";

    return el;
  }

  /* Precio por pieza, pedido mínimo y código por cada medida. Si un producto
     no tiene `venta`, se vende por caja y bajo cotización: esto es aparte, no
     lo reemplaza. La línea es el material (la misma lista que valida
     LINEAS_VENTA en main.py); antes solo ofrecía Papel/PET/Kraft y los
     productos de PLA, bagazo, etc. se veían como "Ninguna". */
  function opcionesLinea(sel) {
    return [["", "No — solo cotización por caja"]]
      .concat(Object.keys(datos.materiales).map(function (m) { return [m, "Sí — " + datos.materiales[m]]; }))
      .map(function (l) {
        return '<option value="' + l[0] + '"' + (l[0] === (sel || "") ? " selected" : "") + ">" + l[1] + "</option>";
      }).join("");
  }

  /* Alinea venta.tam con las medidas (`v`) del producto: una entrada por
     cada medida, en el mismo orden. Se llama antes de pintar y antes de
     guardar. */
  function sincronizarTam(p) {
    if (!p.venta) return;
    var n = p.v.length;
    var tam = (p.venta.tam || []).slice(0, n);
    while (tam.length < n) tam.push({ precio: null, min: MIN_PIEZAS, sku: null });
    p.venta.tam = tam;
  }

  /* La tabla de medidas: aquí se escribe el nombre de cada medida (antes era
     un cuadro de texto "una por línea"), su precio, pedido mínimo, código y
     si está agotada. Agotado es por medida: marcar la de 4 oz no toca las
     demás. Las medidas no se borran desde aquí, se marcan agotadas. */
  function ventaHTML(p) {
    var activa = !!p.venta;
    if (activa) sincronizarTam(p);
    var agotadas = p.agotadas || [];
    return '<div class="ficha__venta">' +
      '<label><span class="campo">¿Se vende en línea con precio por pieza?</span>' +
        '<select data-c="venta-linea">' + opcionesLinea(activa ? p.venta.linea : "") + "</select></label>" +
      '<div class="ficha__tam">' +
        p.v.map(function (etiqueta, i) {
          var t = activa ? p.venta.tam[i] : null;
          var agotada = agotadas.indexOf(etiqueta) > -1;
          return '<div class="ficha__tamfila' + (activa ? "" : " ficha__tamfila--simple") +
                 (agotada ? " ficha__tamfila--agotada" : "") + '">' +
            '<label><span class="campo">Medida</span>' +
              '<input type="text" data-med="v" data-i="' + i + '" value="' + esc(etiqueta) + '"></label>' +
            (activa
              ? '<label><span class="campo">Precio por pieza (MXN)</span>' +
                  '<input type="number" min="0" step="0.01" data-tam="precio" data-i="' + i + '" placeholder="Sin precio" value="' +
                    (t.precio == null ? "" : t.precio) + '"></label>' +
                '<label><span class="campo">Pedido mínimo (piezas)</span>' +
                  '<input type="number" min="1" step="1000" data-tam="min" data-i="' + i + '" value="' + (t.min || MIN_PIEZAS) + '"></label>' +
                '<label><span class="campo">Código (SKU)</span>' +
                  '<input type="text" data-tam="sku" data-i="' + i + '" value="' + esc(t.sku || "") + '"></label>'
              : "") +
            '<label class="marca ficha__agotada"><input type="checkbox" data-med="agotado" data-i="' + i + '"' +
              (agotada ? " checked" : "") + "> Agotado</label>" +
          "</div>";
        }).join("") +
      "</div>" +
      '<button class="btn btn--ghost btn--sm ficha__agregar" type="button" data-accion="agregar-medida">' +
        '<span class="btn__label">+ Agregar medida</span></button>' +
    "</div>";
  }

  /* Reconstruye solo esta ficha (no todo `pintar()`) para no perder el
     scroll ni el foco del resto del panel cuando cambia la línea de venta. */
  function refrescarFicha(id) {
    var actual = document.querySelector('[data-ficha="' + id + '"]');
    var p = producto(id);
    if (!actual || !p) return;
    actual.replaceWith(ficha(p));
  }

  function materialesHTML(p) {
    return Object.keys(datos.materiales).map(function (m) {
      var puesto = (p.mat || []).indexOf(m) > -1;
      return '<label class="marca"><input type="checkbox" data-m="' + m + '"' +
             (puesto ? " checked" : "") + "> " + datos.materiales[m] + "</label>";
    }).join("");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function visibles() {
    var q = $("buscar").value.trim().toLowerCase();
    var cat = $("filtro-cat").value;
    var estado = $("filtro-estado").value;

    return datos.productos.filter(function (p) {
      if (cat && p.cat !== cat) return false;
      /* También busca en las medidas y en los códigos: "4 oz", "63 mm", "VASO-PAPEL". */
      var skus = p.venta ? p.venta.tam.map(function (t) { return t.sku || ""; }).join(" ") : "";
      var pajar = [p.nombre, p.id, p.desc || "", (p.v || []).join(" "), skus].join(" ").toLowerCase();
      if (q && pajar.indexOf(q) === -1) return false;
      var pr = datos.promos[p.id] || {};
      if (estado === "cambiados" && !sucios[p.id]) return false;
      if (estado === "agotados" && !pr.agotado && !(p.agotadas && p.agotadas.length)) return false;
      if (estado === "ofertas" && !pr.desc) return false;
      if (estado === "sin-precio") {
        var sinPrecio = p.venta
          ? p.venta.tam.some(function (t) { return t.precio == null; })
          : p.precio == null;
        if (!sinPrecio) return false;
      }
      return true;
    });
  }

  function pintar() {
    var lista = $("lista");
    lista.innerHTML = "";
    var items = visibles();
    items.forEach(function (p) { lista.appendChild(ficha(p)); });
    $("vacio").hidden = items.length > 0;
    pintarResumen();
  }

  function pintarResumen() {
    var agotados = 0, ofertas = 0, conPrecio = 0, enLinea = 0;
    datos.productos.forEach(function (p) {
      var pr = datos.promos[p.id] || {};
      if (pr.agotado || (p.agotadas && p.agotadas.length)) agotados++;
      if (pr.desc) ofertas++;
      if (p.venta ? p.venta.tam.some(function (t) { return t.precio != null; }) : p.precio != null) conPrecio++;
      if (p.venta) enLinea++;
    });
    var pendientes = Object.keys(sucios).length;
    $("resumen").textContent =
      datos.productos.length + " productos · " + conPrecio + " con precio · " +
      ofertas + " en oferta · " + agotados + " agotados · " + enLinea + " en venta en línea" +
      (pendientes ? " · " + pendientes + " con cambios sin guardar" : "");
    $("btn-guardar").disabled = !hayCambios();
  }

  /* ============================ edición ============================ */

  $("lista").addEventListener("input", function (e) {
    var ficha = e.target.closest("[data-ficha]");
    if (!ficha) return;
    var id = ficha.dataset.ficha;
    var p = producto(id);
    if (!p) return;

    var campo = e.target.dataset.c;
    if (campo) {
      if (campo === "precio") {
        var n = parseFloat(e.target.value);
        p.precio = isNaN(n) || n <= 0 ? null : n;
      } else if (campo === "p") {
        var caja = parseInt(e.target.value, 10);
        p.p = isNaN(caja) || caja <= 0 ? null : Math.max(1000, caja);
      } else if (campo === "v") {
        p.v = e.target.value.split("\n").map(function (l) { return l.trim(); })
                .filter(function (l) { return l; });
      } else if (campo === "destacado") {
        p.destacado = e.target.checked;
      } else {
        p[campo] = e.target.value;
      }
      marcarSucio(id);
      return;
    }

    var campoMed = e.target.dataset.med;
    if (campoMed) {
      var im = parseInt(e.target.dataset.i, 10);
      var anterior = p.v[im];
      p.agotadas = p.agotadas || [];
      if (campoMed === "v") {
        var nuevo = e.target.value.trim();
        if (!nuevo) return;                      /* una medida sin nombre no se guarda */
        p.v[im] = nuevo;
        var ia = p.agotadas.indexOf(anterior);   /* si estaba agotada, lo sigue estando */
        if (ia > -1) p.agotadas[ia] = nuevo;
      } else if (campoMed === "agotado") {
        var ya = p.agotadas.indexOf(anterior);
        if (e.target.checked && ya === -1) p.agotadas.push(anterior);
        if (!e.target.checked && ya > -1) p.agotadas.splice(ya, 1);
        e.target.closest(".ficha__tamfila").classList.toggle("ficha__tamfila--agotada", e.target.checked);
      }
      if (!p.agotadas.length) delete p.agotadas;
      marcarSucio(id);
      return;
    }

    var campoTam = e.target.dataset.tam;
    if (campoTam) {
      if (!p.venta) return;
      var iTam = parseInt(e.target.dataset.i, 10);
      var entrada = p.venta.tam[iTam];
      if (!entrada) return;
      if (campoTam === "precio") {
        var np = parseFloat(e.target.value);
        entrada.precio = isNaN(np) || np <= 0 ? null : np;
      } else if (campoTam === "min") {
        var nm = parseInt(e.target.value, 10);
        entrada.min = isNaN(nm) || nm < 1 ? MIN_PIEZAS : nm;
      } else if (campoTam === "sku") {
        entrada.sku = e.target.value.trim() || null;
      }
      marcarSucio(id);
      return;
    }

    var campoPromo = e.target.dataset.p;
    if (campoPromo) {
      var pr = promo(id);
      if (campoPromo === "agotado") pr.agotado = e.target.checked;
      else if (campoPromo === "desc") {
        var d = parseInt(e.target.value, 10);
        pr.desc = isNaN(d) || d <= 0 ? 0 : Math.min(99, d);
      } else pr[campoPromo] = e.target.value;
      limpiarPromo(id);
      marcarSucio(id);
      return;
    }

    var mat = e.target.dataset.m;
    if (mat) {
      p.mat = p.mat || [];
      var i = p.mat.indexOf(mat);
      if (e.target.checked && i === -1) p.mat.push(mat);
      if (!e.target.checked && i > -1) p.mat.splice(i, 1);
      marcarSucio(id);
    }
  });

  $("lista").addEventListener("change", function (e) {
    if (e.target.dataset.c === "cat") {
      var ficha = e.target.closest("[data-ficha]");
      var p = producto(ficha.dataset.ficha);
      if (p) { p.cat = e.target.value; marcarSucio(p.id); }
      return;
    }
    if (e.target.dataset.c === "venta-linea") {
      var fichaV = e.target.closest("[data-ficha]");
      var pv = producto(fichaV.dataset.ficha);
      if (!pv) return;
      var val = e.target.value;
      if (!val) delete pv.venta;
      else { pv.venta = { linea: val, tam: (pv.venta || {}).tam || [] }; sincronizarTam(pv); }
      marcarSucio(pv.id);
      refrescarFicha(pv.id);
    }
  });

  /* Piezas por caja: al salir del campo, lo que quedó abajo de 1,000 sube a 1,000. */
  $("lista").addEventListener("change", function (e) {
    if (e.target.dataset.c !== "p" || !e.target.value) return;
    if (parseInt(e.target.value, 10) < 1000) e.target.value = 1000;
  });

  $("lista").addEventListener("click", function (e) {
    var mas = e.target.closest('[data-accion="agregar-medida"]');
    if (mas) {
      var pm = producto(mas.closest("[data-ficha]").dataset.ficha);
      if (!pm) return;
      var n = 1, nombre = "Medida nueva";
      while (pm.v.indexOf(nombre) > -1) nombre = "Medida nueva " + (++n);
      pm.v.push(nombre);
      if (pm.venta) sincronizarTam(pm);
      marcarSucio(pm.id);
      refrescarFicha(pm.id);
      var campos = document.querySelectorAll('[data-ficha="' + pm.id + '"] [data-med="v"]');
      if (campos.length) campos[campos.length - 1].select();
      return;
    }
    var btn = e.target.closest('[data-accion="borrar"]');
    if (!btn) return;
    var ficha = btn.closest("[data-ficha]");
    var id = ficha.dataset.ficha;
    var p = producto(id);
    if (!p) return;
    if (!confirm("¿Quitar \"" + p.nombre + "\" del catálogo?\n\nSe va del sitio en cuanto guardes.")) return;
    datos.productos = datos.productos.filter(function (x) { return x.id !== id; });
    delete datos.promos[id];
    delete nuevos[id];
    sucios[id] = true;
    pintar();
  });

  $("btn-nuevo").addEventListener("click", function () {
    var n = 1;
    while (producto("nuevo-" + n)) n++;
    var id = "nuevo-" + n;
    datos.productos.unshift({
      id: id, nombre: "Producto nuevo", cat: datos.categorias[0].id,
      mat: [], img: "", p: null, desc: "", v: ["Estándar"], precio: null
    });
    nuevos[id] = true;
    sucios[id] = true;
    $("buscar").value = ""; $("filtro-cat").value = ""; $("filtro-estado").value = "";
    pintar();
    var el = document.querySelector('[data-ficha="' + id + '"]');
    if (el) { el.scrollIntoView({ block: "center" }); el.querySelector("input").select(); }
  });

  ["buscar", "filtro-cat", "filtro-estado"].forEach(function (id) {
    $(id).addEventListener("input", pintar);
  });

  /* ============================ guardar ============================ */

  function aviso(texto, tipo) {
    var el = $("aviso");
    el.textContent = texto;
    el.dataset.tipo = tipo || "ok";
    el.hidden = !texto;
  }

  $("btn-guardar").addEventListener("click", function () {
    var btn = $("btn-guardar");
    var etiqueta = btn.querySelector(".btn__label");
    btn.disabled = true;
    etiqueta.textContent = "Guardando…";
    aviso("");

    /* Resguardo final: si algo dejó venta.tam desalineado con las medidas,
       el servidor lo rechaza entero (ver limpia_venta en main.py). Mejor
       corregirlo aquí que perder los precios/existencias ya capturados. */
    datos.productos.forEach(function (p) { if (p.venta) sincronizarTam(p); });

    fetch("/api/admin/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token(),
        catalogo: datos,
        mensaje: "Actualiza el catálogo desde el panel"
      })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      etiqueta.textContent = "Guardar cambios";
      if (!res.ok) {
        if (res.j.error === "sesion_vencida") {
          aviso("Tu sesión venció. Vuelve a entrar; tus cambios siguen aquí.", "error");
          $("panel").hidden = true; $("entrar").hidden = false;
          return;
        }
        aviso(explicar(res.j.error), "error");
        btn.disabled = false;
        return;
      }
      sucios = {}; nuevos = {};
      original = clonar(datos);
      aviso(res.j.local
        ? "Guardado en productos.js de esta computadora. Recarga la tienda para verlo."
        : "Guardado en GitHub (commit " + res.j.commit + "). El sitio se actualiza " +
          "en cuanto termine el redeploy, alrededor de un minuto.", "ok");
      pintar();
    }).catch(function () {
      etiqueta.textContent = "Guardar cambios";
      btn.disabled = false;
      aviso("No pude contactar al servidor.", "error");
    });
  });

  function explicar(codigo) {
    if (codigo === "falta_github_token") return "Falta la variable GITHUB_TOKEN en el servidor.";
    if (codigo === "github_token_invalido") return "El GITHUB_TOKEN no es válido o no tiene permiso sobre el repo.";
    if (codigo === "catalogo_invalido") return "El catálogo quedó inválido y no se guardó.";
    if (codigo === "github_409") return "Alguien más cambió el archivo. Recarga el panel y vuelve a aplicar tus cambios.";
    return "No se pudo guardar (" + (codigo || "error desconocido") + ").";
  }

  $("btn-respaldo").addEventListener("click", function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" }));
    a.download = "greenova-catalogo-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  window.addEventListener("beforeunload", function (e) {
    if (Object.keys(sucios).length) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ============================ arranque ============================ */

  function abrirPanel() {
    $("entrar").hidden = true;
    $("panel").hidden = false;
    var u = "";
    try { u = sessionStorage.getItem(LLAVE_USUARIO) || ""; } catch (err) {}
    $("quien").textContent = u && u !== "local" ? "Sesión de " + u : "";
    cargar();
    $("filtro-cat").innerHTML = '<option value="">Todas las categorías</option>' +
      datos.categorias.map(function (c) {
        return '<option value="' + c.id + '">' + c.nombre + "</option>";
      }).join("");
    pintar();
  }

  if (!window.GREENOVA) {
    document.body.innerHTML = "<p style='padding:2rem'>No se pudo cargar el catálogo.</p>";
    return;
  }
})();
