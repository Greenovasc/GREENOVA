# Feedback final (Feedback.pages, 14 páginas)

Una página del documento = un bloque. Se trabajan en orden y cada duda se
consulta con Gabriel antes de tocar el código. Estado: ✅ hecho · ⏳ en curso ·
❓ esperando respuesta · ⬜ sin empezar.

| # | Dónde | Qué pide | Estado |
|---|-------|----------|--------|
| 1 | Ventana de registro + barra de avisos | Quitar "muestra gratis", "precios de mayoreo" y "3 productos favoritos"; quitar "este cuadro"; quitar la barra de avisos | ✅ barra quitada; sin muestra/mayoreo/favoritos/"sin spam"; recuadro → "Nombre del negocio"; colores de marca |
| 2 | Portada: hero | Colores y letra de la marca (carpeta MKT); menos texto; "EL FUTURO SE SIRVE EN GREENOVA" mucho más grande; la foto de fondo dice "SBC" (debe ser "SC") | ✅ portada nueva (2026-09-28): fondo Pine Tail, eslogan enorme en Porcelain con "GreeNova" en Willow Green, una frase, buscador + "Ir a la tienda", vasos papel blanco/kraft, vaso PET y tapa recortados sobre disco Muted Teal. Sin foto de fondo (ya no hay "SBC") · ⏳ Bio Sans (falta archivo con licencia web) |
| 3 | Portada: "¿Aún usas unicel…?" | Cambiar a "¿Aún utilizas unicel para tus alimentos?"; quitar los 5 cuadros y la barra de abajo | ✅ frase + 3 fotos de vasos que sí están en el catálogo (se quitó el collage con sushi, palomitas, platos, etc.) |
| 4 | Portada: "Somos GreeNova SC" y "Todo tu empaque en un solo proveedor" | Quitar las dos secciones | ✅ |
| 5 | Portada: mosaicos restantes + "Ver catálogo completo", "No es marketing, es certificación", "Servicios: No solo te vendemos…" | Quitar las tres | ✅ |
| 6 | Portada: 3 tarjetas de servicios + "Negocios que ya cambiaron su empaque" | Tarjetas se quedan, sin "te mandamos una muestra"; cambiar la galería por 5 cuadros de PRODUCTOS | ✅ tarjetas sin "muestra" · ✅ sección Productos **quitada** por indicación de Gabriel (2026-09-28: "los productos no me sirven"; varias líneas no están en el catálogo) |
| 7 | Portada: preguntas frecuentes | Quitar | ✅ |
| 8 | Portada: formulario de cotización, pie de página, menú | Colores de marca; pie solo con datos de contacto (sin productos); opción "Registro de cliente" en el menú; base de datos de clientes con historial de compras | ✅ formulario: Nombre, Negocio, Correo, Teléfono (se piden nombre y teléfono) con foto de cafetería · ✅ pie: Contacto + columna "Información" con Facturación y Registro de cliente · ✅ "Registro de cliente" en el menú abre la ventana emergente (nombre, correo, teléfono, duda) · ✅ tablas clientes y pedidos · ⏳ DATABASE_URL de Supabase |
| 9 | Registro de cliente + tienda | Campos del registro (titular, negocio, teléfono, correo) y de facturación (razón social, RFC, domicilio fiscal, uso de CFDI, régimen fiscal, constancia ≤ 3 meses); tienda con colores de marca; mejorar foto de vaso y tapa de plástico; quitar la barra "56 referencias · 166 medidas · 14 tipos de tapa" | ✅ encabezado de tienda con colores de marca y sus textos originales; barra de números quitada · ✅ facturación en su propia página (`facturacion.html`, liga en el pie) · ⏳ foto de vaso y tapa PET (Gemini) |
| 10 | Tienda: filtros | Mejorar los filtros por categoría de producto | ⬜ se hace con el catálogo nuevo |
| 11 | Tienda: catálogo | Solo vasos + productos del Power Point; quitar precios por pieza | ✅ catálogo = hoja Precios del Excel; tarjetas solo con qué es (Vasos/Tapas/Accesorios, material, PET) y especificaciones; fotos se conservan |
| 12 | Tienda: precios | Precios por paquete y por caja, y piezas por paquete y por caja, de la lista de Excel | ✅ solo dentro de la ficha del producto, IVA incluido, mínimo 1 paquete |
| 13 | Ficha de producto (tapas) | Especificaciones y precios del Excel; la tapa con gallo no existe, usar las fotos originales mejoradas con IA; quitar "Personalización" en tapas que no son de papel; colores de marca | ⬜ fotos 01–21 en Gemini |
| 14 | Tienda: "¿No encontraste…?" y "Envía tu lista" | Nuevo texto "Envía tu lista de productos, alguna cotización en particular o lo que estás buscando"; quitar el cuadro blanco con las piezas (10,000 piezas…) | ✅ texto nuevo y sin el cuadro blanco (tienda y ofertas) |

## Fuentes

- Lista de precios: `~/Greenova/GreenovaSC - Catálogo.numbers`, hoja **Precios**
  (paquete y caja, piezas por paquete y por caja, especificaciones).
- Guía de marca: `GreenovaSC_BrandGuide.pdf` (Ankaa Studio). Pine Tail #326252,
  Muted Teal #6B9982, Willow Green #9BCE89, Porcelain #F5F9F4, Charcoal #575756;
  Bio Sans SemiBold (títulos) y Montserrat (textos). Logos SVG oficiales en
  `assets/logo-greenova*.svg` e `isotipo-greenova.svg`.
- "Power Point": `Presentación - Fotos para tienda en linea.pptx` (9 láminas,
  tapas, fajillas, removedores, vasos PET/PP y tapas PET). Fotos numeradas para
  Gemini en `~/Desktop/Fotos Greenova para Gemini/Tienda 2026 (presentación)/`.
- Excel nuevo: `GreenovaSC - Catálogo.xlsx` (misma hoja Precios, 94 filas).
- No mostrar cuántos productos hay (Gabriel, 2026-09-27).
- Nada que no esté en `GreenovaSC - Catálogo` va en el sitio (Gabriel, 2026-09-28).
- La tienda no se rediseña: solo se quitan productos y se aplica lo del feedback; las
  fotos se quedan. Paquete/caja solo dentro de la ficha.
- `Catálogo_Greenovasc_2026.pdf` es referencia de estilo, no para copiarlo literal.
- 2026-09-28: la landing sigue la estructura de la de WeCare (sin copiar textos). Las fotos
  deben medir al menos el doble de su ancho en pantalla: las fotos de ambiente del PDF
  (~500 px) se quitaron por pixeleadas y se usan las de estudio de Gemini (2048 px).
  La imagen de portada la manda Gabriel.
- 2026-09-28 (2ª vuelta): fuera "Lo más pedido" y las 4 ventajas (el feedback no las pidió).
  "Nuestros productos" = los 5 grupos de la pág. 6 (Bebidas, Contenedores, Bowls y
  ensaladeras, Bolsas, Complementos) solo con materiales del catálogo y fotos de Gemini;
  Bebidas va a la tienda y el resto a "Cotizar" (llena "¿Qué necesitas?" del formulario).
  Menú con lupa (abre el asistente), persona (Mi cuenta: entrar / crear cuenta / mis
  pedidos) y carrito que se abre en la misma página. Tienda con las fotos de Gemini donde
  la foto es del producto (FOTOS_GEMINI en el generador); lo demás sigue con el Power Point.
- Base de datos: Gabriel va a dar una de Supabase (Postgres; entra por DATABASE_URL).
- 2026-09-28 (3ª vuelta): menú "Productos" con su diseño original de 4 columnas y sus fotos,
  sin lo que no está en el catálogo (bagazo y paja, accesorios, papel encerado, bolsas con
  ventana) y sin "Ver las 56 referencias"; "Outlet y ofertas" se queda. Fuera del menú
  "Registro de cliente" y "Solicitar cotización" (el registro sale al entrar y está en el
  ícono de persona). Ventana de registro al entrar con "Ignorar por ahora" (no vuelve en 7
  días). Portada en carrusel de 3 diapositivas. Espacio de Instagram en la landing y en el
  pie (falta la liga). "Tu empaque también puede hablar bien…" no está en la marca: ahora
  "Cotiza ya / Precios claros desde la primera cotización" (Catálogo 2026). En la ficha ya
  no va "Presentación".
- 2026-09-28 (4ª vuelta): menú = Página de inicio · Productos · Outlet · Contacto (logo a la
  izquierda, enlaces al centro, íconos a la derecha, como WeCare). "Productos" abre el
  catálogo al pasar el cursor y con clic entra a la tienda; "Personalización" es la última
  columna del catálogo. Ventana de entrada con pestañas Registrarme / Iniciar sesión: sale
  en cada visita mientras no haya sesión y abre en "Iniciar sesión" si ya hubo cuenta en ese
  navegador. Tienda: Mostrar/ocultar filtros, Quitar filtros, columnas 3/4/5 y orden Más
  relevantes / Más vendidos / Nuestros mejores precios / A–Z / Z–A (sin precio de menor a
  mayor). Página nueva contacto.html (medios, cotización con "Dudas o sugerencias",
  corporativo con mapa, la marca al final). Pendiente: número de WhatsApp, dirección del
  corporativo y su mapa, liga de Instagram, página oficial de facturación.
- 2026-09-29 (5ª vuelta): portada de una sola pieza (sin carrusel ni sellos, sin "IVA
  incluido"): "El futuro se sirve en GreeNova" grande, "Empaque biodegradable para tu
  negocio de comida" en chico, y solo las fotos con la marca GreeNova SC (vaso con fajilla)
  y con "Your logo" (serigrafía). Letrero "Inicia sesión / Regístrate" entre Contacto y la
  lupa ("Hola, Nombre" con sesión). Cuentas SIN contraseña: registro con nombre y apellido,
  WhatsApp (obligatorio), correo (opcional) y "¿Tienes alguna duda?"; se entra con nombre y
  WhatsApp. La ventana sale sola al entrar mientras no haya sesión y no la cierren en esa
  visita. contacto.html con el acomodo de WeCare: banda verde con teléfono, WhatsApp (los
  mismos dos números, con enlace a WhatsApp) y correo; cotización; corporativo con foto del
  letrero (guía de marca) y "Abrir en Google Maps"; mapa de Google con "Ver en el mapa"; la
  marca al final. Pendiente: dirección del corporativo (hoy el mapa apunta a Ciudad de
  México), liga de Instagram y página oficial de facturación.
- 2026-09-29 (6ª vuelta): 5 columnas son 5 siempre (antes, con filtros abiertos, se veían 4).
  Orden nuevo "Todos" (primero y por defecto): todo el inventario en el orden del catálogo, y
  al elegirlo se quitan filtros y búsqueda. La búsqueda de la tienda entiende faltas de
  ortografía ("vacho" → vaso, "basos nejros" → vaso negro, "tapadera" → tapa, "vaso térmico" →
  doble pared) y avisa "Resultados para … (escribiste …)"; lo que se cotiza pero no se vende en
  línea (bolsas, popotes, charolas…) no se confunde con otra palabra. Siguiente gran pendiente:
  las dos paqueterías y el cobro con Openpay.
- 2026-09-29 (7ª vuelta): guía en PDF "Guía de fotos con Gemini" (Escritorio › Fotos Greenova
  para Gemini), con la carpeta "Faltan por hacer" (17 fotos numeradas + vaso blanco 44 oz para
  los de color) y "Listas". Cobro en línea en PHP para Hostinger (LEEME-COBRO.md): pagar.html
  cotiza el envío con Envia.com y Skydropx (el cliente elige; lo paga él), y cobra productos +
  envío + IVA en un solo pago con Openpay (tarjeta con 3D Secure o SPEI; sin efectivo). Al
  confirmarse el pago se genera la guía sola y llegan correos a ventas y al cliente. "Comprar
  ahora" pasó a "Pagar ahora" y el carrito a "Pagar mi pedido" (queda "Prefiero que me
  coticen"). Páginas nuevas: aviso de privacidad, términos y condiciones, envíos y
  devoluciones (borrador para revisión legal). Pendiente de Gabriel: CP y dirección de origen,
  pesos y medidas, clave SAT, domicilio y razón social, llaves en greenova-secretos.php.
- 2026-09-29 (8ª vuelta): la landing baja como una página normal (sin el efecto de aparecer al
  hacer scroll). "Nuestros productos" sin "Cotizar" (solo Bebidas lleva "Comprar en línea").
  "Personalización" fuera del menú Productos (4 columnas). Los formularios de la landing y de
  Contacto dicen "El futuro se sirve en GreeNova / Si necesitas más información, háznosla
  saber" (botón "Enviar"). Ventana de entrada: "Solo tu nombre y tu WhatsApp." Compra: primero
  dirección y paquetería ("Ve la opción de paquetería que más te convenga, entre Envia.com y
  Skydropx"), luego "Continuar con la compra" -> si no hay sesión, "Regístrate para continuar
  tu pedido / Estás a un paso de realizar tu pedido" con botón "Continuar con la compra" ->
  datos y pago. Fuera "Prefiero que me coticen". Tienda: "Arma tu pedido y recíbelo en tu
  negocio" (el feedback no pedía cambiarlo, pero "pide tu cotización" ya no es cierto con pago
  en línea). Letrero "Inicia sesión / Regístrate" siempre verde.
- 2026-09-29 (9ª vuelta): todas las tarjetas de "Nuestros productos" reaccionan al cursor (solo
  Bebidas lleva a la tienda). Menú Productos en 3 columnas: "Papel y bolsas" debajo de "Barra y
  servicio". "¿Qué empaque necesitas?" abre el asistente. Pagar: logo atrás y foto de cajas y
  bolsas GreeNova, "Ver opciones de pedido" despliega la dirección (sin referencias), se pueden
  cambiar cantidades o quitar productos, "¿Tienes dudas? Pregúntale a tu asistente", y al pagar
  sale el recibo impreso (ticket con número, productos, IVA, total, forma de pago, fecha, guía y
  código de barras). Pie: mapa chiquito junto a Información. Borradas las páginas de términos y
  de envíos; quedan Aviso de privacidad, Registro de cliente y Facturación. Facturación = página
  externa (portal de autofacturación; falta la liga): la página del sitio solo explica cómo
  facturar con el número de ticket; ya no pide RFC. Aviso y Facturación como landings.
  Documento "Copys del sitio GreeNova SC.pdf" en el escritorio.

## Ronda 10 (2026-09-29): portada con la foto de Gemini

- La portada es un solo cuadro redondeado, como el de WeCare, con la foto de Gemini de la barra con empaques (`assets/landing/portada-greenova.webp`).
- A la foto se le quitaron el texto pegado ("se sirve en Grinova"), el logo blanco, el botón "Ver empaques" y la marca "texto texto" de la pared.
- Encima, en la franja oscura: "El futuro se sirve en GreeNova.", "Empaque biodegradable para tu negocio de comida.", "¿Qué empaque necesitas?" (abre el asistente) e "Ir a la tienda".
- En celular, la foto va arriba y el texto abajo.
