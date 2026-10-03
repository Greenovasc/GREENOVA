/* GreeNova SC - criterios y base de conocimiento del agente.
   ===========================================================================
   ESTE ES EL ARCHIVO QUE TÚ EDITAS. No hace falta tocar nada más.

   El agente contesta en dos niveles:

   1. RAG  — busca en el catálogo (los productos de productos.js) y en los
             HECHOS de abajo. Si encuentra la respuesta, la da al instante,
             sin llamar a la IA y sin costo.
   2. IA   — si el RAG no alcanza, manda la pregunta a Claude junto con lo que
             sí encontró y con los CRITERIOS de abajo, y Claude resuelve.

   Todo lo que escribas aquí es lo que el agente puede decir. Si un dato no
   está aquí ni en el catálogo, el agente tiene prohibido inventarlo: dice que
   no lo sabe y pasa el contacto de ventas.
   =========================================================================== */
window.GREENOVA_AGENTE = (function () {
  "use strict";

  /* ---------------------------------------------------------------------
     CRITERIOS — las reglas con las que la IA contesta.
     Escríbelas en lenguaje normal. Agrega, quita o cambia lo que quieras.
     --------------------------------------------------------------------- */
  var CRITERIOS = [
    "Eres el asistente de GreeNova SC, empresa mexicana de empaque desechable para el sector alimenticio, con sede en la Ciudad de México.",
    "Hablas español de México, de tú, directo y breve. Dos o tres frases cuando alcance. Nada de relleno ni de lenguaje publicitario.",
    "Solo puedes afirmar datos que aparezcan en el CATÁLOGO o en los HECHOS que se te pasan. Si te preguntan algo que no está ahí, dilo con claridad y ofrece el contacto de ventas. Nunca inventes medidas, materiales, certificaciones ni tiempos.",
    "En la tienda se compra por paquete o por caja, y los precios ya incluyen IVA. Si preguntan cuánto cuesta, da el precio tal como viene en el CATÁLOGO para esa medida y presentación. Si la medida no está en el contexto, di que el precio está en la tienda. NUNCA inventes descuentos ni precios por pieza.",
    "El pedido mínimo es un paquete (o una caja, cuando ese producto solo se vende por caja). NUNCA prometas tiempos de entrega: ventas los confirma con el pedido.",
    "Cuando alguien busque un producto, di la medida exacta y cuántas piezas trae el paquete y la caja, tal como vienen en el catálogo.",
    "Para elegir tapa, lo que importa es el diámetro de boca del vaso, no las onzas. Si te dan onzas, pide la boca o menciona las bocas que existen para esa medida.",
    "Si la persona quiere su logo impreso, explica que hay serigrafía sobre vasos de papel, vasos PET, fajillas y tapas de papel, y que también se hacen contenedores y bolsas a medida. Las tapas de plástico no se pueden imprimir.",
    "Si la persona quiere comprar, dile que agregue sus productos al carrito de la tienda y envíe su pedido, o que escriba a ventas@greenovasc.com.mx / 55 2260 1113.",
    "La gente no pide las cosas como se llaman en el catálogo. Traduce siempre: \"vaso para café\" o \"vaso para bebida caliente\" es el VASO DE PAPEL; \"vaso para bebida fría\", \"vaso para frappé\" o \"vaso transparente\" es el VASO PET. Usa la lista de EQUIVALENCIAS que se te pasa en el contexto y responde con el nombre del catálogo, no con el que usó la persona.",
    "Contenedores para alimentos, bowls y ensaladeras, bolsas y complementos (platos, cubiertos, servilletas, popotes) no se venden en la tienda en línea: se cotizan. Pídele que mande su lista en \"Envía tu lista\" o que escriba a ventas.",
    "SÍ ENVIAMOS A TODO MÉXICO. Si preguntan por cualquier estado, ciudad o pueblo del país, la respuesta es sí: GreeNova envía a nivel nacional desde la Ciudad de México. Lo único que no sabes es el costo y el tiempo del envío: eso lo confirma ventas.",
    "Eres un vendedor, no un buscador. Si alguien describe su negocio o lo que va a servir en vez de pedir un producto por nombre (\"tengo una heladería\", \"vasos para helado\", \"vendo frappés\"), recomiéndale de una vez los productos que le sirven, con la medida exacta y para qué le sirve cada uno. Usa la GUÍA DE USOS que se te pasa; si su caso no está ahí, razona con el catálogo: bebida caliente en vaso de papel, bebida fría o postre en vaso PET, y la tapa según la boca del vaso.",
    "NUNCA escribas nombres de archivo ni rutas (tienda.html, producto.html, .php). Habla como persona: \"en la tienda\". El enlace se lo pone el sitio solo.",
    "Cuando alguien diga que quiere comprar o hacer un pedido, no lo mandes a leer instrucciones. Pregúntale qué productos quiere, en qué medida y cuántos paquetes o cajas de cada uno. Si en el bloque CARRITO ya trae productos, retómalos por nombre y cantidad.",
    "Cierra siempre las conversaciones de compra con el contacto directo: 55 2260 1113 o ventas@greenovasc.com.mx.",
    "No hables de la competencia ni compares con otras marcas.",
    "Si la pregunta no tiene nada que ver con empaque, GreeNova o el pedido, dilo amablemente y reencauza."
  ];

  /* ---------------------------------------------------------------------
     HECHOS — la base de conocimiento fuera del catálogo de productos.
     Cada entrada se busca por separado. Agrega las que quieras.
     --------------------------------------------------------------------- */
  var HECHOS = [
    { t: "Contacto y horario de ventas",
      c: "Correo: ventas@greenovasc.com.mx. Teléfonos: 55 2260 1113 y 55 7051 1149. Sitio: www.greenovasc.com.mx. GreeNova SC está en Cacamatzin 21, Arenal 1ra Secc., Venustiano Carranza, 15600, Ciudad de México." },

    { t: "Cómo se compra: paquete o caja",
      c: "En la tienda cada producto se compra por paquete o por caja. Cada medida dice cuántas piezas trae el paquete y cuántas la caja, y su precio con IVA incluido. El pedido mínimo es un paquete." },

    { t: "Materiales que se manejan",
      c: "Vasos de papel (blanco, negro, kraft, doble pared y de color), vasos de PET y de polipropileno (PP), tapas de poliestireno (PS), polipropileno (PP), PET y papel, fajillas de kraft y removedores de madera." },

    { t: "Envíos a todo México",
      c: "Sí, GreeNova envía a todo el país. La salida es desde la Ciudad de México hacia cualquier estado de la República. El costo y el tiempo dependen del destino y del volumen; ventas los confirma con el pedido." },

    { t: "Imprimir tu logo: serigrafía y personalización",
      c: "GreeNova imprime tu logo en serigrafía sobre vasos de papel, vasos PET, fajillas y tapas de papel. También diseña y produce contenedores para alimentos a medida, con o sin impresión, y bolsas de papel bond y kraft personalizadas, con o sin asa. Las tapas de plástico no se imprimen." },

    { t: "Cómo elegir la tapa correcta",
      c: "La tapa se elige por el diámetro de boca del vaso, no por las onzas. Vasos de papel: boca 62 mm (4 oz), 80 mm (8 oz) y 90 mm (10 a 20 oz). Vasos PET: bocas de 78, 90, 92, 95, 98 y 107 mm. En la tienda, al ver un vaso, salen las tapas de su misma boca." },

    { t: "Productos que se cotizan",
      c: "Además de la tienda en línea, GreeNova cotiza contenedores para alimentos (papel, bagazo de caña de azúcar, fécula de maíz, paja de trigo y PET), bowls y ensaladeras (kraft, PET y PLA), bolsas (papel y bond) y complementos (platos, cucharas, tenedores, cuchillos, servilletas y popotes). Se piden con \"Envía tu lista\" o escribiendo a ventas." },

    { t: "Accesorios que se cotizan: portavasos, servilletas, papel y popotes",
      c: "Del catálogo 2026, estos se piden con \"Envía tu lista\" o escribiendo a ventas: portavasos charola de 2 espacios (caja de 600) y de 4 espacios (caja de 300); portavasos con asa de 2 espacios (caja de 250) y de 4 espacios (caja de 200); servilleta larga de 39.0 x 37.5 cm (caja de 1,200); papel grado alimenticio RH y papel grado alimenticio encerado, para envolver alimentos (caja de 1,000); popote de tapioca biodegradable de 21 cm (caja de 5 kg); popote de tapioca estuchado de 21 cm, individual (caja de 2,000) y popote cuchara biodegradable de 26 cm (caja de 5 kg)." },

    { t: "Cómo hacer un pedido",
      c: "Agrega a tu carrito lo que necesitas, por paquete o por caja, y envía tu pedido desde la tienda. Si prefieres, escribe directo a ventas@greenovasc.com.mx o al 55 2260 1113." }
  ];

  /* ---------------------------------------------------------------------
     EQUIVALENCIAS — cómo lo pide la gente vs. cómo se llama en el catálogo.
     Si alguien escribe cualquier palabra de "dice", la búsqueda agrega en
     silencio las palabras de "es" antes de buscar, para que salgan los
     productos correctos aunque nadie los haya nombrado.
     Agrega las que se te ocurran; se aplican solas.
     --------------------------------------------------------------------- */
  var SINONIMOS = [
    { dice: ["cafe", "café", "capuchino", "capuccino", "americano", "latte", "te", "té",
             "bebida caliente", "bebidas calientes", "linea caliente", "chocolate caliente",
             "atole", "coffee", "to go", "cafeteria", "cafetería", "barra"],
      es: "vaso de papel bebida caliente",
      busca: ["vaso de papel"] },

    { dice: ["bebida fria", "bebidas frias", "bebida fría", "bebidas frías", "linea fria",
             "frappe", "frappé", "licuado", "smoothie", "jugo", "agua fresca", "refresco",
             "michelada", "cerveza", "vaso transparente", "vaso de plastico", "vaso de plástico",
             "cristal", "hielo"],
      es: "vaso PET bebida fria transparente",
      busca: ["vaso pet"] },

    { dice: ["tapa", "tapas", "tapita", "lid"],
      es: "tapa para vaso",
      busca: ["tapa"] },

    { dice: ["removedor", "stirrer", "palito", "agitador", "agitar"],
      es: "removedor de madera",
      busca: ["removedor"] },

    { dice: ["manga", "funda", "cinturon", "cinturón", "sleeve", "quema", "caliente la mano"],
      es: "fajilla kraft para vaso",
      busca: ["fajilla"] },

    { dice: ["domo", "tapa transparente", "tapa alta", "crema batida"],
      es: "tapa PET domo",
      busca: ["domo"] },

    { dice: ["envio", "envío", "envian", "envían", "envias", "envías", "mandan", "mandas",
             "llega", "llegan", "paqueteria", "paquetería", "flete", "foraneo", "foráneo",
             "tlaxcala", "puebla", "hidalgo", "queretaro", "querétaro", "guanajuato", "jalisco",
             "guadalajara", "monterrey", "nuevo leon", "nuevo león", "merida", "mérida", "yucatan",
             "yucatán", "cancun", "cancún", "quintana roo", "tijuana", "baja california", "oaxaca",
             "veracruz", "chiapas", "sonora", "sinaloa", "michoacan", "michoacán", "guerrero",
             "acapulco", "morelos", "cuernavaca", "toluca", "estado de mexico", "estado de méxico",
             "provincia", "interior de la republica", "interior de la república", "foraneos"],
      es: "envios a todo Mexico nacional desde la Ciudad de Mexico",
      busca: [] },

    { dice: ["contenedor", "contenedores", "bowl", "bowls", "ensaladera", "bolsa", "bolsas",
             "plato", "platos", "cubiertos", "cuchara", "tenedor", "cuchillo", "servilleta",
             "servilletas", "popote", "popotes", "para llevar", "comida"],
      es: "productos que se cotizan contenedores bowls bolsas complementos",
      busca: [] }
  ];

  /* ---------------------------------------------------------------------
     GIROS — cómo vende un vendedor con sentido común.

     Gabriel (2026-10-03): "alguien que abrió una heladería busca vasos para
     helado y le tienen que salir las opciones que podrían ser buenas para
     helado, y así con todos nuestros productos". Cuando alguien no pregunta
     por un producto sino por su NECESIDAD ("tengo una heladería", "vasos para
     frappé", "vendo micheladas"), el asistente y el buscador de la tienda le
     enseñan esta lista, con foto, medida y para qué le sirve cada cosa.

     `nombre`  cómo se llama el uso (sale de título en la tienda y en la ficha)
     `dice`    las palabras con las que la gente lo describe
     `intro`   la frase con la que abre el asistente
     `recs`    lo que se recomienda, en orden:
               { id, v, por }  un producto de la tienda; `v` es el principio
                               de la medida tal como está en el catálogo
                               ("4 oz", "Boca 95 mm", "Blanco · 12 oz")
               { cotiza, por } algo de COTIZA (abajo), que no se vende en línea

     El orden de la tabla importa: gana el primer uso que coincida. Por eso
     los jugos van antes que la fruta en vaso ("jugo de fruta" es jugo).
     Para agregar un uso nuevo basta con una entrada más.
     --------------------------------------------------------------------- */
  var GIROS = [
    { nombre: "Helado y nieve",
      dice: ["helado", "heladeria", "heladería", "nieve", "neveria", "nevería", "paleteria", "paletería",
             "gelato", "yogurt helado", "frozen yogurt", "malteada", "sundae", "raspado", "granizado",
             "chamoyada", "mangonada"],
      intro: "Para helado y nieve, esto es lo que mejor funciona:",
      recs: [
        { id: "vaso-papel-blanco", v: "4 oz", por: "Una bola, probaditas o porción para niños." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Dos bolas o una copa con toppings." },
        { id: "vaso-papel-negro", v: "8 oz", por: "El mismo tamaño en negro: se ve más gourmet." },
        { id: "vaso-papel-blanco", v: "12 oz", por: "Tres bolas, o helado para compartir." },
        { id: "vaso-pet-95", v: "12 oz", por: "Malteadas, nieves y raspados: se luce el color." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Para ese vaso; deja espacio a la crema y los toppings." },
        { cotiza: "popote-cuchara", por: "Para nieves, raspados y chamoyadas: es popote y cuchara." }
      ] },

    { nombre: "Cafetería",
      dice: ["cafeteria", "cafetería", "coffee shop", "barista", "barra de cafe", "barra de café",
             "negocio de cafe", "negocio de café", "vendo cafe", "vendo café", "cafe para llevar",
             "café para llevar", "cafe de especialidad", "café de especialidad", "torrefactora"],
      intro: "Para cafetería, el arranque típico es:",
      recs: [
        { id: "vaso-papel-blanco", v: "12 oz", por: "Latte, capuchino y americano." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Americano chico o flat white." },
        { id: "vaso-papel-negro", v: "4 oz", por: "Espresso y cortado." },
        { id: "tapa-cafetera-62", v: "Negra", por: "La tapa del vaso de 4 oz." },
        { id: "vaso-papel-doble-pared", v: "Blanco · 12 oz", por: "Bebidas muy calientes: la doble pared cuida la mano." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "La tapa de los vasos de 10 a 20 oz." },
        { id: "fajilla-kraft", v: "Ajustable", por: "Para que el vaso de 10 a 16 oz no queme." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { cotiza: "portavaso-charola", por: "Pedidos de 2 o 4 bebidas para llevar." }
      ] },

    { nombre: "Frappés y café frío",
      dice: ["frappe", "frappé", "frapuccino", "frappuccino", "cafe frio", "café frío", "iced coffee",
             "iced latte", "cold brew", "moka frio", "moka frío"],
      intro: "Para frappés y café frío:",
      recs: [
        { id: "vaso-pet-98", v: "16 oz", por: "El tamaño clásico del frappé." },
        { id: "tapa-pet-domo", v: "Boca 98 mm", por: "Para ese vaso; deja espacio a la crema batida." },
        { id: "vaso-pet-92", v: "12 oz", por: "Frappé chico o iced latte." },
        { id: "tapa-pet-sorbe", v: "Boca 98 mm", por: "Café frío para tomar sin popote." },
        { cotiza: "popote-tapioca", por: "Popote biodegradable." }
      ] },

    { nombre: "Jugos, licuados y smoothies",
      dice: ["jugueria", "juguería", "jugo", "licuado", "smoothie", "batido", "proteina", "proteína",
             "jugo verde", "jugos naturales"],
      intro: "Para jugos, licuados y smoothies:",
      recs: [
        { id: "vaso-pet-95", v: "16 oz", por: "Jugo o licuado mediano." },
        { id: "vaso-pet-95", v: "20 oz", por: "Licuado grande." },
        { id: "vaso-pet-u", v: "16 oz", por: "Smoothie: la forma en U se ve más premium." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para el vaso de boca 95, con ranura para popote." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Si lleva fruta o granola encima." },
        { cotiza: "popote-tapioca-estuchado", por: "Popote en sobre individual, para llevar." }
      ] },

    { nombre: "Bubble tea",
      dice: ["bubble tea", "bubble", "boba", "te de tapioca", "té de tapioca", "bebida de tapioca",
             "bebidas de tapioca", "milk tea", "matcha", "taro"],
      intro: "Para bubble tea y bebidas con tapioca:",
      recs: [
        { id: "vaso-pet-u", v: "16 oz", por: "La forma en U de las barras de bubble tea." },
        { id: "vaso-pet-u", v: "24 oz", por: "Tamaño grande." },
        { id: "vaso-pp", v: "En U · 16 oz", por: "Para el milk tea caliente." },
        { id: "tapa-pet-domo-oso", v: "Boca 90 mm", por: "Domo con orejas de oso: la foto que todos suben." },
        { id: "tapa-pet-plana-ranura", v: "Boca 90 mm", por: "Tapa plana para popote." },
        { cotiza: "popote-tapioca", por: "Popote biodegradable de 21 cm." }
      ] },

    { nombre: "Aguas frescas y limonadas",
      dice: ["agua fresca", "aguas frescas", "agua de jamaica", "horchata", "limonada", "naranjada",
             "agua de sabor", "aguas de sabor", "te helado", "té helado"],
      intro: "Para aguas frescas y limonadas:",
      recs: [
        { id: "vaso-pet-95", v: "16 oz", por: "Agua mediana." },
        { id: "vaso-pet-98", v: "24 oz", por: "Agua grande." },
        { id: "vaso-pet-107", v: "32 oz", por: "La de casi un litro." },
        { id: "tapa-pet-plana-ranura", v: "Boca 95 mm", por: "Para el vaso de boca 95, con ranura para popote." },
        { id: "tapa-pet-sorbe-tapon", v: "Boca 98 mm", por: "Se toma sin popote y el tapón la cierra para llevar." },
        { cotiza: "popote-tapioca", por: "Popote biodegradable." }
      ] },

    { nombre: "Micheladas y bar",
      dice: ["michelada", "chela", "cerveza", "cerveceria", "cervecería", "bar", "clamato",
             "cocteleria", "coctelería", "coctel", "cóctel", "mezcaleria", "mezcalería", "pulqueria", "pulquería"],
      intro: "Para micheladas y barra:",
      recs: [
        { id: "vaso-pet-107", v: "32 oz", por: "La michelada grande." },
        { id: "vaso-pet-98", v: "24 oz", por: "Michelada mediana o cerveza de barril." },
        { id: "vaso-pet-98", v: "16 oz", por: "Cerveza o coctel." },
        { id: "tapa-pet-plana-ranura", v: "Boca 107 mm", por: "Para la de 32 oz, si se va para llevar." },
        { cotiza: "popote-tapioca", por: "Popote biodegradable." }
      ] },

    { nombre: "Fruta, esquites y postres en vaso",
      dice: ["fruta picada", "fruta", "coctel de frutas", "esquite", "elote", "elote en vaso",
             "fresas con crema", "gelatina", "postre", "postre en vaso", "yogurt", "yogur", "parfait",
             "dulceria mexicana", "snack", "botana"],
      intro: "Para fruta, esquites y postres en vaso:",
      recs: [
        { id: "vaso-pet-78", v: "9 oz", por: "Fruta picada, gelatina o postre individual." },
        { id: "tapa-pet-plana-sin-ranura", v: "Boca 78 mm", por: "Cierra parejo, sin hoyo: no se sale nada." },
        { id: "vaso-pet-95", v: "12 oz", por: "Fresas con crema o yogurt con granola." },
        { id: "tapa-pet-domo", v: "Boca 95 mm", por: "Para ese vaso, si lleva crema o toppings." },
        { id: "vaso-papel-blanco", v: "8 oz", por: "Esquites calientes." },
        { id: "vaso-papel-blanco", v: "12 oz", por: "Esquite grande." }
      ] },

    { nombre: "Cine, refrescos y palomitas",
      dice: ["cine", "palomitas", "refresco", "soda", "fuente de sodas", "dulceria", "dulcería",
             "comida rapida", "comida rápida", "hot dog", "hamburguesa", "hamburgueseria",
             "hamburguesería", "feria", "estadio", "kermes", "kermés"],
      intro: "Para refresco grande, palomitas y comida rápida:",
      recs: [
        { id: "vaso-papel-color-44", v: "Rojo", por: "Refresco grande; también en azul y en gris." },
        { id: "vaso-papel-blanco", v: "44 oz", por: "Refresco grande o palomitas." },
        { id: "vaso-papel-blanco", v: "32 oz", por: "Refresco mediano." },
        { cotiza: "papel-encerado", por: "Para envolver hamburguesas y hot dogs." },
        { cotiza: "servilleta-larga", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Comida para llevar",
      dice: ["torta", "torteria", "tortería", "taco", "taqueria", "taquería", "burrito", "quesadilla",
             "fonda", "cocina economica", "cocina económica", "restaurante", "comida para llevar",
             "para llevar", "delivery", "rappi", "uber eats", "didi food", "sandwich", "sándwich",
             "baguette", "dark kitchen"],
      intro: "Para tortas, tacos y comida para llevar:",
      recs: [
        { cotiza: "papel-encerado", por: "Para envolver tortas, tacos y burritos." },
        { cotiza: "papel-rh", por: "Papel blanco para envolver o forrar charolas." },
        { cotiza: "contenedores", por: "Contenedores para la comida." },
        { cotiza: "servilleta-larga", por: "Servilleta de 39 x 37.5 cm." },
        { id: "vaso-pet-95", v: "16 oz", por: "El agua fresca del combo." },
        { id: "tapa-pet-sorbe-tapon", v: "Boca 95 mm", por: "Con tapón: no se tira en el camino." },
        { cotiza: "portavaso-asa", por: "Para que el repartidor lleve 2 o 4 bebidas." }
      ] },

    { nombre: "Panadería y desayunos",
      dice: ["panaderia", "panadería", "pan dulce", "pasteleria", "pastelería", "desayuno",
             "tamal", "tamales", "atole", "champurrado", "cafe de olla", "café de olla",
             "chocolate caliente", "churro", "churreria", "churrería"],
      intro: "Para panadería, desayunos y bebidas calientes tradicionales:",
      recs: [
        { id: "vaso-papel-kraft", v: "12 oz", por: "Café de olla, atole o champurrado: el kraft se ve artesanal." },
        { id: "vaso-papel-kraft", v: "8 oz", por: "La medida chica." },
        { id: "tapa-cafetera-90", v: "Blanca 3 óvalos · poliestireno", por: "La tapa del vaso de 12 oz." },
        { id: "tapa-papel-90", v: "Blanca", por: "La misma medida en tapa de papel, si quieres menos plástico." },
        { cotiza: "bolsas", por: "Bolsas de papel kraft para el pan." },
        { cotiza: "papel-encerado", por: "Para envolver pan y sándwiches." }
      ] },

    { nombre: "Eventos y coffee break",
      dice: ["evento", "fiesta", "catering", "banquete", "coffee break", "boda", "posada",
             "graduacion", "graduación", "bautizo", "xv años", "oficina", "junta", "congreso"],
      intro: "Para eventos, catering y coffee break:",
      recs: [
        { id: "vaso-papel-blanco", v: "8 oz", por: "Café y té del coffee break." },
        { id: "tapa-cafetera-80", v: "Blanca · poliestireno", por: "La tapa de ese vaso." },
        { id: "removedor-madera", v: "14 cm", por: "Para el azúcar y la leche." },
        { id: "vaso-pet-95", v: "9 oz", por: "Agua, refresco o jugo." },
        { id: "vaso-pet-78", v: "7 oz", por: "Shots, degustaciones o postres mini." },
        { cotiza: "servilleta-larga", por: "Servilleta de 39 x 37.5 cm." }
      ] },

    { nombre: "Negocio nuevo",
      dice: ["abrir un negocio", "voy a abrir", "empezando", "emprender", "negocio nuevo",
             "que me recomiendas", "qué me recomiendas", "no se que necesito", "no sé qué necesito",
             "asesorame", "asesórame"],
      intro: "Depende del giro, pero para bebidas lo que casi nadie deja fuera es:",
      recs: [
        { id: "vaso-papel-blanco", v: "12 oz", por: "Bebida caliente." },
        { id: "tapa-cafetera-90", v: "Negra · poliestireno", por: "Su tapa." },
        { id: "vaso-pet-98", v: "16 oz", por: "Bebida fría." },
        { id: "tapa-pet-domo", v: "Boca 98 mm", por: "Su tapa." }
      ] }
  ];

  /* ---------------------------------------------------------------------
     COTIZA — lo del catálogo que no se compra en la tienda en línea: se pide
     con "Envía tu lista". El asistente lo recomienda igual que lo demás.
     `img` es la foto de assets/prod/; `pide` abre la tienda con el aviso
     de cotización.
     --------------------------------------------------------------------- */
  var COTIZA = {
    "portavaso-charola":        { nombre: "Portavasos charola", v: "2 o 4 espacios", img: "portavaso-charola-4", pide: "Portavasos" },
    "portavaso-asa":            { nombre: "Portavasos con asa", v: "2 o 4 espacios", img: "portavaso-caja-kraft", pide: "Portavasos" },
    "servilleta-larga":         { nombre: "Servilleta larga", v: "39.0 x 37.5 cm", img: "servilleta-larga", pide: "Servilletas" },
    "papel-encerado":           { nombre: "Papel grado alimenticio encerado", v: "Para envolver alimentos", img: "papel-encerado", pide: "Papel grado alimenticio" },
    "papel-rh":                 { nombre: "Papel grado alimenticio RH", v: "Para envolver alimentos", img: "papel-rh", pide: "Papel grado alimenticio" },
    "popote-tapioca":           { nombre: "Popote de tapioca biodegradable", v: "21 cm", img: "popote-tapioca", pide: "Popotes" },
    "popote-tapioca-estuchado": { nombre: "Popote de tapioca estuchado", v: "21 cm, individual", img: "popote-tapioca-estuchado", pide: "Popotes" },
    "popote-cuchara":           { nombre: "Popote cuchara biodegradable", v: "26 cm", img: "mega-popotes", pide: "Popotes" },
    "contenedores":             { nombre: "Contenedores para alimentos", v: "Kraft, papel, bagazo y PET", img: "contenedor-kraft-rect", pide: "Contenedores kraft" },
    "bolsas":                   { nombre: "Bolsas de papel kraft", v: "Con o sin asa", img: "srv-bolsa-kraft", pide: "Bolsas kraft" }
  };

  /* ---------------------------------------------------------------------
     FOTOS CON COMIDA — la foto de cada producto en uso, con su bebida o su
     comida (Gabriel, 2026-10-03: "vendiéndoles el sueño"). Se guardan en
     assets/uso/<f>.webp, cuadradas de 900 px.
     La clave es el id del producto (o del renglón de COTIZA). Si una medida
     se usa para algo muy distinto, va aparte con "id|medida": el vaso blanco
     de 4 oz sale con helado aunque el de 12 oz salga con café.
     Mientras un producto no tenga la suya, se usa su foto de estudio.
     --------------------------------------------------------------------- */
  var FOTOS_USO = {
  };

  /* Preguntas sugeridas que aparecen al abrir el chat. */
  var SUGERENCIAS = [
    "¿Qué vasos me sirven para helado?",
    "Voy a abrir una cafetería, ¿qué necesito?",
    "¿Qué tapa va con un vaso de 12 oz?",
    "¿Pueden imprimir mi logo?"
  ];

  /* Cuando ni el RAG ni la IA pueden contestar. */
  var SALIDA = "Eso no lo tengo confirmado y prefiero no inventarlo. " +
               "Escríbele a ventas: ventas@greenovasc.com.mx o 55 2260 1113, ahí te lo resuelven.";

  /* =====================================================================
     De aquí para abajo ya no hace falta tocar nada: son las funciones con
     las que el asistente, la tienda y la ficha de producto leen las tablas.
     ===================================================================== */
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  /* Palabra completa, con el plural tolerado: "helado" pega en "helados" y
     en "vasos para helado", pero "bar" no pega dentro de "barra". */
  var REG_GIROS = GIROS.map(function (g) {
    return g.dice.map(function (t) { return new RegExp("(^| )" + norm(t) + "(e?s)?( |$)"); });
  });

  /* El uso que describe un texto, o null. Gana el primero de la tabla. */
  function usoDe(texto) {
    var n = norm(texto || "");
    if (!n) return null;
    for (var i = 0; i < GIROS.length; i++) {
      for (var j = 0; j < REG_GIROS[i].length; j++) {
        if (REG_GIROS[i][j].test(n)) return GIROS[i];
      }
    }
    return null;
  }

  /* Índice de la medida de un producto que empieza con `v` ("4 oz"), o 0. */
  function medidaDe(p, v) {
    if (!p || !v) return 0;
    for (var k = 0; k < p.v.length; k++) {
      if (p.v[k].indexOf(v) === 0) return k;
    }
    return 0;
  }

  /* Foto con comida de un producto (y de su medida, si tiene una propia).
     Devuelve { src, alt } o null. */
  function fotoUso(id, medida) {
    var f = null;
    if (medida) {
      Object.keys(FOTOS_USO).some(function (clave) {
        var partes = clave.split("|");
        if (partes[0] === id && partes[1] && medida.indexOf(partes[1]) === 0) { f = FOTOS_USO[clave]; return true; }
        return false;
      });
    }
    f = f || FOTOS_USO[id];
    return f ? { src: "assets/uso/" + f.f + ".webp?v=" + (f.ver || "1"), alt: f.alt || "" } : null;
  }

  /* Los usos en los que sale un producto, para la ficha ("Ideal para"). */
  function usosDe(id) {
    return GIROS.filter(function (g) {
      return g.nombre !== "Negocio nuevo" && g.recs.some(function (r) { return r.id === id; });
    });
  }

  return {
    CRITERIOS: CRITERIOS,
    HECHOS: HECHOS,
    SINONIMOS: SINONIMOS,
    GIROS: GIROS,
    COTIZA: COTIZA,
    FOTOS_USO: FOTOS_USO,
    SUGERENCIAS: SUGERENCIAS,
    SALIDA: SALIDA,
    usoDe: usoDe,
    medidaDe: medidaDe,
    fotoUso: fotoUso,
    usosDe: usosDe,
    /* Dónde vive la función que guarda la API key. Hay dos versiones del mismo
       endpoint porque hay dos tipos de hosting: Node (Render, Vercel) y PHP
       (Hostinger). Se elige por dominio, así el mismo código sirve en todos
       sin tocar nada. Ver README. */
    ENDPOINT: /(^|\.)(onrender\.com|vercel\.app)$/.test(location.hostname)
      ? "/api/chat"
      : "/php/chat.php"
  };
})();
