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

## Ronda 11 (2026-09-30)

- **Portada:** queda igual, pero con la foto nueva de Gemini (pizarrón sin logo). A la foto se le quitaron el texto pegado (traía "Grimova", "biodegradabe" y "comda"), el logo blanco y el botón.
- **Nuestros productos:** al pasar el cursor, cada tarjeta cambia a una foto de ambiente en cafetería. Bebidas, Contenedores, Bowls y Complementos son recortes de la foto de la portada; Bolsas usa la foto de bolsas con "Your logo".
- **Síguenos en Instagram:** las fotos pasan solas en carrusel y se detienen con el cursor. El botón y el ícono del pie llevan a instagram.com/greenovasc. **Por confirmar con Gabriel que esa sea la cuenta.**
- **Ubicación:** sección a pantalla completa debajo de la cotización, con el mapa de Google en una mitad y la frase "Desde la Ciudad de México, a todo el país." en la otra. En la landing reemplaza al mapa chiquito del pie; las demás páginas lo conservan.
- **Menú Productos:** "Papel y bolsas" ahora tiene su propia columna (4 columnas).

### Corrección del mismo día

- Gabriel: la foto de la portada no se usa en ningún otro lado. Se quitaron sus recortes de las tarjetas de "Nuestros productos" y del carrusel de Instagram.
- Las tarjetas vuelven a su foto de estudio, con el mismo efecto al pasar el cursor, hasta tener las 5 fotos de cafetería hechas con Gemini. Las referencias y los prompts están en `~/Desktop/Fotos Greenova para Gemini/Faltan por hacer/Fotos de ambiente para la landing/` (9 fotos, un prompt por foto; 01-05 tarjetas, 06-09 carrusel de Instagram).

## Ronda 12 (2026-10-01)

- La foto de Gemini de Bebidas (vaso con fajilla GreeNova y frappé con domo) ya aparece al pasar el cursor por la tarjeta (`assets/landing/cafe-bebidas.webp`).
- Gabriel: "no hay que usar las mismas ni repetirlas, se ve barato". El carrusel de Instagram ya no repite fotos de las tarjetas: entran vaso kraft, vaso doble pared negro y tapa negra.
- Servicios: las 3 fotos de "YOUR LOGO" se ven baratas. Los prompts y referencias para las nuevas están en la carpeta de Gemini (10 a 12) y usan el símbolo de GreeNova en vez de "YOUR LOGO".
- "GreeNova." ya no se parte en dos renglones en pantallas muy angostas.
- Gabriel (2026-10-01): mientras el Excel diga que esas piezas existen (cualquier hoja), las 5 tarjetas se quedan como están. La foto de Gemini de la bolsa kraft (con "Eat Better") en una panadería ya aparece en la tarjeta de Bolsas (`assets/landing/cafe-bolsas.webp`).
- Gabriel no quiere archivos TXT: los prompts se le escriben en el chat.
- (2026-10-02) Ya están las 5 fotos de cafetería de las tarjetas: contenedor con helado, ensaladera con ensalada y smoothie en vaso PET con domo (`cafe-contenedores`, `cafe-bowls`, `cafe-complementos`).
- (2026-10-02) Bebidas sin "GREENOVA -SC-": la tarjeta usa el vaso de papel blanco liso. En la foto de cafetería se borró el texto de la fajilla, que quedó kraft lisa. En el carrusel, el vaso blanco se cambió por el doble pared genérico para no repetir. Gabriel pasó el `Catálogo_Greenovasc_2026-2.pdf` (págs. 12-24: vasos, tapas y accesorios).

## Ronda 13 (2026-10-03)

- Dirección de GreeNova (la eligió el tío de Gabriel): Cacamatzin 21, Arenal 1ra Secc., Venustiano Carranza, 15600, CDMX. Está en el mapa de la landing (con la dirección escrita), en Contacto, en el mini mapa del pie de todas las páginas, en el domicilio del Aviso de privacidad y en los datos del asistente.
- Menú Productos: todo lleva a la tienda. Lo que no se vende en línea (popotes, contenedores kraft, charolas y cajas, ensaladeras, portavasos, bolsas kraft) abre `tienda.html?pide=…`, con el aviso "X: cotiza ya" y el formulario "Envía tu lista" ya escrito.
- Prompts de Gemini (en el chat) para las 3 fotos nuevas de Servicios, con "TU LOGO", y para el vaso del encabezado de la tienda: lleno, con vapor, que venda emoción.
- (2026-10-03) Serigrafía en Servicios: foto nueva de Gemini (estudio de diseño con vasos impresos con "TU LOGO"), recortada para dejar fuera las notas del cuaderno (`serv-serigrafia.webp`).
- (2026-10-03) Bolsas en Servicios: foto nueva de Gemini (3 bolsas kraft con fuelle, dos con "TU LOGO") (`serv-bolsas.webp`). El vaso del encabezado de la tienda salió feo: se le dio otro prompt.
- (2026-10-03) Contenedores a medida en Servicios: foto nueva de Gemini (diseño del troquel en tableta, contenedores kraft y blancos, uno con "TU LOGO"), recortada para dejar fuera las muestras de papel con texto (`serv-contenedores.webp`). Ya no queda ninguna foto de "YOUR LOGO" en la landing.

## Ronda 14 (2026-10-03)

- Gabriel: "alguien que abrió una heladería busca vasos para helado y le tienen que salir las opciones buenas para helado, y así con todos nuestros productos". Ahora `GIROS` en `agente-criterios.js` es una guía de usos con 12 usos: helado y nieve, cafetería, frappés, jugos y smoothies, bubble tea, aguas frescas, micheladas, fruta y postres en vaso, cine y refrescos, comida para llevar, panadería y eventos. Cada recomendación trae producto, medida exacta y para qué sirve. Todos los productos de la tienda salen en al menos un uso, y se agregaron los accesorios que se cotizan (`COTIZA`).
  - Asistente: contesta con tarjetas (foto, medida, para qué) que abren la ficha ya en esa medida (`producto.html?id=…&v=…`). La guía también se le pasa a la IA.
  - Tienda: si la búsqueda describe un uso ("vasos para helado", "tapas para frappé", "tortas"), arriba sale la lista recomendada y la rejilla trae esos productos en ese orden.
  - Ficha: "Ideal para" con los usos de cada producto.
- `agente-criterios.js` ahora carga justo después de `productos.js` en todas las páginas, porque la tienda y la ficha lo leen al pintar.
- Fotos con comida ("vendiéndoles el sueño"): 33 por hacer en Gemini. Las referencias están en `~/Desktop/Fotos Greenova para Gemini/Faltan por hacer/Fotos con comida (tienda y asistente)/`. Al llegar se guardan en `assets/uso/<clave>.webp` (cuadradas de 900 px) y se registran en `FOTOS_USO`. Salen en tres lugares: al pasar el cursor por la tarjeta de la tienda, en el botón "Así se ve servido" de la ficha y en las tarjetas del asistente. Claves por número de carpeta:
  01 vaso-papel-blanco · 02 vaso-papel-blanco|4 oz · 03 vaso-papel-negro · 04 vaso-papel-kraft · 05 vaso-papel-doble-pared · 06 vaso-papel-color-44 · 07 tapa-cafetera-62 · 08 tapa-cafetera-80 · 09 tapa-cafetera-90 · 10 tapa-papel-90 · 11 fajilla-kraft · 12 removedor-madera · 13 vaso-pet-78 · 14 vaso-pet-92 · 15 vaso-pet-95 · 16 vaso-pet-98 · 17 vaso-pet-107 · 18 vaso-pet-u · 19 vaso-pp · 20 tapa-pet-plana-ranura · 21 tapa-pet-plana-sin-ranura · 22 tapa-pet-domo · 23 tapa-pet-domo-oso · 24 tapa-pet-sorbe · 25 tapa-pet-sorbe-tapon · 26 portavaso-charola · 27 portavaso-asa · 28 servilleta-larga · 29 papel-encerado · 30 papel-rh · 31 popote-tapioca · 32 popote-tapioca-estuchado · 33 popote-cuchara
- Miniaturas de servilleta, papel RH y popotes, sacadas del `Catálogo_Greenovasc_2026-3.pdf` (`assets/prod/servilleta-larga`, `papel-rh`, `popote-tapioca`, `popote-tapioca-estuchado`). El popote cuchara no trae foto en el PDF.
- Gabriel confirmó que la cuenta de Instagram es @greenovasc.

## Ronda 15 (2026-10-03)

- Gabriel: "que todos los errores de ortografía los entienda el agente". El asistente corrige cada palabra que no conoce por la más parecida del catálogo o de la guía de usos. Compara cómo suenan (b = v, s = z = c, sin h, sin plural) y tolera 1 a 3 letras de diferencia. Ejemplos: "vachos" → vasos, "eladería" → heladería, "pissería" → pizzería, "frape" → frappé. Las ciudades y las palabras comunes no se tocan. El corrector está en `agente-criterios.js` (`corrector`) y también lo usa el buscador de la tienda para los usos.
- "No solo heladerías y cafeterías: pizzerías y todos los comercios que nos podrían necesitar". Ahora son 25 usos: escuelas, oficinas y hospitales, hoteles, frappés, tamales y atole, helado, cafetería, jugos, bubble tea, aguas frescas, mariscos, fruta y postres, pizzería, hamburguesas y alitas, tacos y antojitos, ensaladas, sushi, panadería, crepas, cine, bar, eventos, tiendas de conveniencia y gasolineras, restaurantes y negocio nuevo. Solo recomiendan productos que existen en el Excel: lo de la Hoja1 (contenedores de papel, cajas kraft, ensaladeras, soufflé, cono para crepa, charola para papas, bolsas) sale como "se cotiza". El orden importa: primero lo específico y al final lo genérico.
- El asistente también contesta sin la IA:
  - "¿qué tapa va con el vaso de 12 oz?", por la boca del vaso;
  - precios con medida (lista de precios) y sin medida (rango y "¿de qué medida?");
  - dónde estamos.
- "Evita decir IVA muchas veces". Queda una mención por página, donde están los precios: en el precio de la ficha, en el total del carrito y en el sello de pagar.html. Se quitó del pie de todas las páginas, del encabezado de la tienda, del subtítulo de pagar, del total de la ficha y del historial de pedidos.
- "¿Por qué los popotes no salen en la página de ventas?" Porque no tienen precio en el catálogo, que dice "Cotizar". Ahora sí salen en la tienda, como productos de las categorías Popotes, Portavasos y Servilletas y papel:
  - Son 8 productos: popote de tapioca, popote estuchado, popote cuchara, portavasos charola, portavasos con asa, servilleta larga, papel encerado y papel RH.
  - Las cajas son las del PDF 2026-3.
  - Llevan la etiqueta "Se cotiza". En su ficha, en lugar de carrito y pago, sale "Pedir cotización", que abre el formulario con el producto y la medida ya escritos (`tienda.html?cotiza=<id>&v=<medida>`).
  - Los enlaces viejos `?pide=Popotes` y `?pide=Portavasos` abren su categoría.
  - `main.py` acepta las líneas `tapioca` y `carton`, por si un día se les pone precio en el panel.

## Ronda 16 (2026-10-03): tienda por secciones y precios revisados

- Gabriel: "que salga todo prácticamente, pero no todo de golpe… por secciones… que haya un botón en medio que diga mostrar más… ordenado: vasos (todos los vasos), tapas (todas las tapas)… si no tiene precio, 'Pedir cotización'; si sí, 'Comprar ahora'. Es lo más importante de la página."
- **Tienda:**
  - Barra lateral con 5 secciones (`SECCIONES` en `tienda.js`): Vasos, Tapas, Comida para llevar, Accesorios para bebida y Bolsas, servilletas y envoltura. La sección elegida se abre y enseña sus categorías.
  - En "Todos los productos" la rejilla va en ese orden, con un título por sección.
  - Se ven 12 productos y el botón "Mostrar más", en medio, trae 12 más. Cualquier filtro o búsqueda vuelve a los primeros 12.
  - Tarjeta con precio: "Comprar ahora" (lleva a la ficha para elegir medida). Sin precio: "Pedir cotización", que llena el formulario con el producto ahí mismo, sin recargar.
- **Precios revisados:**
  - Las 89 medidas que ya estaban en la tienda coinciden al centavo con la hoja Precios del Excel. Se comprobó con un script.
  - Se agregaron 15 productos de la Hoja1 con su precio GREENOVA SC (columnas J y K): tapa de 32 oz, vaso PP fiestero, contenedor de papel blanco de 4 a 32 oz y sus tapas, caja kraft de 26 a 96 oz, charola para papas, contenedor PET, contenedor para rebanada de pastel, ensaladera PET de 18 a 64 oz, soufflé PP de 2 oz y su tapa, cono para crepa, popote PLA estuchado, bolsa semikraft con fuelle (3 tamaños) y bobina Egapack.
  - También se les puso precio al portavasos charola y al popote de tapioca estuchado.
- **Sin precio en ningún documento (Pedir cotización):**
  - portavasos con asa (2 y 4), servilleta larga, papel encerado, papel RH y popote cuchara: solo vienen en el PDF, con "Cotizar";
  - tapa PS negra de 8 oz (Fuling): en blanco en la hoja Precios y "Cotizar" en el PDF;
  - popote de tapioca a granel: el Excel solo da $1,098.28 por la caja de 5 kg, sin precio por paquete;
  - Sanitas: el Excel solo da $250.23 por la caja de 20 paquetes.
- **Diferencias que Gabriel debe confirmar:**
  - El PDF dice "Cotizar" en el portavasos charola y en el popote estuchado, pero la Hoja1 sí tiene precio, y se usó ese.
  - El PDF trae piezas por caja distintas al Excel en 8 tapas de vaso de papel. Se dejaron las del Excel; el precio por pieza sí coincide.
  - La página 22 del PDF (tapas PET de 107 y 90 mm) trae $1.39 y $1.25 en todas, que parece de relleno.
- `main.py` acepta las líneas `pla` y `otro`. El viaje de ida y vuelta por `render_catalogo` conserva los 48 productos sin cambios.

## Ronda 17 (2026-10-03): plan de fotos

- **Fotos de estudio pendientes:** son 26, todas en `~/Desktop/Fotos Greenova para Gemini/Faltan por hacer/` y se hacen con el PROMPT 1 y el PROMPT 2 del LEEME, con la "00 Referencia de estilo". A qué foto de la tienda reemplaza cada una:
  - 01 → tienda-01 · 02 → tienda-02 · 03 → tienda-03 · 05 → tienda-05 · 08 → tienda-08 · 10 → tienda-10
  - 12 → tienda-12 · 13 → tienda-13 · 15 → tienda-15 · 16 → tienda-16
  - 40 → tienda-40 · 41 → tienda-41 · 42 → tienda-42 · 44 → tienda-44 · 46 → tienda-46 · 49 → tienda-49 · 50 → tienda-50
  - 52 → popote-tapioca · 53 → popote-tapioca-estuchado · 54 → servilleta-larga · 55 → papel-encerado-kraft · 56 → papel-rh
  - 57, 58 y 59 → `img` por medida de vaso-papel-color-44 (rojo, azul y gris)
  - 60 → `img` de la medida "2 espacios" de portavaso-charola
  - La 51 ya no hace falta, porque los vasos de color tienen su propia foto en el PDF.
- **Necesitan foto real** (no hay foto en ningún documento): popote cuchara, popote PLA estuchado, tapa de 32 oz (105 mm), vaso PP fiestero, soufflé PP de 2 oz, tapa para soufflé, bobina Egapack y Sanitas. También hay que confirmar con foto real la caja kraft y el contenedor PET, que hoy usan fotos de un producto parecido.
- **Fotos con comida nuevas:** 34 a 41, en `Fotos con comida (tienda y asistente)/`. Claves de `FOTOS_USO`:
  - 34 contenedor-papel · 35 caja-kraft · 36 charola-papas · 37 contenedor-pet
  - 38 contenedor-pet-pastel · 39 ensaladera-pet · 40 cono-crepa · 41 bolsa-semikraft
- (2026-10-03) Gabriel no entendía por qué salían "esas tapas" con los contenedores. Sí son las suyas (Hoja1, filas 100, 103, 105, 108 y 109, debajo de cada contenedor), pero la foto era la de un bowl con domo y el letrero decía "vasos". Ahora dice "Tapas para estos contenedores" y la tapa usa "Foto en proceso". Se agregó a la lista de fotos reales que faltan.
- (2026-10-03) Llegaron 14 fotos de estudio de Gemini y se instalaron 12, con nombres nuevos para que el navegador no muestre la vieja: 01, 02, 05, 10, 12, 13, 15, 16, 46 y 57 a 59. Por ejemplo: `tapa-cafetera-62-blanca`, `tapa-cafetera-90-negra-solo` y `vaso-papel-44-azul`.
  - La 03 y la 08 se regresaron porque no son iguales a la tapa real. La 03 tiene las letras mal escritas ("CNPION CONTENTS HOI", "LOSK TURH") y la 08 no tiene la palanca de la solapa. Quedaron en la carpeta como "REHACER (intento 1)".
  - La 10 y la 15 tienen el panel verde en otro ángulo, pero sí se pusieron. Se le sugirió rehacerlas para que la tienda quede pareja.
  - Las originales están en `Fotos Greenova para Gemini/Listas` y sus referencias se marcaron "YA ESTÁ".
- (2026-10-03) Primera foto con comida, la 05 (doble pared con latte). Gemini la entregó como 3 paneles verticales. Se separaron y se recortaron en cuadrado de cerca (vapor, arte latte y la parte de arriba del vaso). Extender los lados del vaso completo dejaba marcas falsas.
  - Quedó en `assets/uso/vaso-papel-doble-pared-{blanco,negro,generico}.webp`, con una foto por color en `FOTOS_USO` (claves "id|Negro" e "id|Genérico").
  - Si otra foto llega en paneles, se hace igual.
- (2026-10-03) Gabriel: "no le pongas 'Ideal para'; es para que lo sepa el agente, no para que lo vean los clientes". Se quitó de la ficha. La guía de usos sigue en el asistente y en el buscador de la tienda.
- "Las imágenes parecen que cambian de tamaño". Se midió el producto en cada foto con Vision de macOS (`VNGenerateForegroundInstanceMaskRequest`, script en el scratchpad).
  - Se igualaron 34 fotos de estudio: el producto ocupa la misma área que el vaso de papel blanco de la portada (raíz de alto × ancho ≈ 0.63) y nunca más de 0.80 del lado.
  - Se recortaron desde la original en alta resolución cuando la había. Las que ya eran grandes (almeja, rebanada de pastel, domo, cono) quedaron igual.
  - Rutas de la tienda y la ficha con `?v=20261003n`.
- "Cuando el cursor le dé clic, cambie de color a azul y después a gris". Ahora las tarjetas con varias fotos cambian a la siguiente con cada clic en la foto (rojo → azul → gris), con puntitos abajo. El nombre y "Comprar ahora" siguen llevando a la ficha.
- "No pongas las que te pasé hasta que te dé las definitivas". Se retiraron las fotos del latte (05) y `FOTOS_USO` quedó vacío. La original se guardó como borrador en `Listas/Fotos con comida`.
- (2026-10-03) Llegaron las 16 fotos con comida definitivas: carpetas 01 a 03 y 05 a 17. Falta la 04 (vaso kraft, café de olla).
  - Quedaron en `assets/uso/` (900 px, webp q82, sin recorte: Gabriel las mandó como definitivas). Ejemplos: `vaso-papel-blanco-capuchino`, `vaso-papel-blanco-helado` (clave "vaso-papel-blanco|4 oz"), `tapa-cafetera-62-espresso`, `vaso-pet-107-michelada`.
  - La 05 nueva trae los tres vasos de doble pared juntos, así que es una sola foto para el producto. Las tres fotos del latte por color ya no se usan.
  - **Tienda:** la foto con comida es la última del ciclo de clics de la tarjeta, después de los colores. Por ejemplo, el vaso de color de 44 oz va rojo → azul → gris → refresco. Ya no sale al pasar el cursor porque tapaba el cambio de color.
  - **Ficha:** se ve con los botones Producto / Así se ve servido. El vaso blanco de 4 oz trae la foto de helado y las demás medidas, la del capuchino.
  - **Asistente y recomendaciones por negocio:** cada foto lleva `giros` (los negocios donde va). Si no va con el negocio, la tarjeta lleva la foto de estudio. Así, una heladería ve el helado también en el vaso de 8 y 12 oz, y no ve capuchinos. El consomé de la taquería y el agua de la oficina tampoco salen con café.
- (2026-10-03) Gabriel, viendo WeCare: "quita lo de 'Así se ve servido', pon imágenes abajo como WeCare". También pidió que en la tienda, como en la portada, salga la foto con comida al pasar el cursor, y que las fotos cambien solas sin clic. El clic tiene que meter al producto.
  - **Ficha:** se quitaron los botones Producto / Así se ve servido. Las fotos con comida del producto van abajo de la foto principal, una tras otra, a todo lo ancho. Sale primero la de la medida que se abrió.
    - Con galería, la columna de fotos ya no se queda fija al bajar (`.ficha__media--galeria`).
  - **Tarjeta de la tienda y "Más …" de la ficha:** con el cursor encima de cualquier parte de la tarjeta sale la foto con comida. Luego, cada 1.3 s, sale cada foto que tenga (otros colores o modelos) hasta volver a la portada, y así se repite. Por ejemplo, el vaso de color: comida → azul → gris → rojo.
    - Si solo hay dos fotos, se queda en la de comida, como en la portada.
    - Al quitar el cursor regresa a la portada. Un clic abre la ficha y ya no cambia la foto.
    - En el celular no hay cursor, así que tocar la tarjeta abre la ficha.
    - Con "reducir movimiento" sale solo la primera foto, sin que cambien solas.
