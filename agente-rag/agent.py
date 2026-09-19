"""Núcleo del agente de ventas RAG de GreeNova — loop de terminal para probar
la lógica de venta antes de conectar cualquier interfaz (web, WhatsApp, etc).

Uso:
    python ingest.py     # una sola vez (o cuando cambie catalogo.json)
    python agent.py       # abre el chat en la terminal, Ctrl+C o "salir" para cerrar

Variables de entorno:
    OPENAI_API_KEY   (requerida)
    OPENAI_MODEL     (opcional, default "gpt-4o-mini")
    CHROMA_DIR       (opcional, default "./chroma_db" — debe ser el mismo que usó ingest.py)
"""
from __future__ import annotations

import json
import os
import pathlib

import chromadb
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

RAIZ = pathlib.Path(__file__).parent.resolve()
CHROMA_DIR = os.environ.get("CHROMA_DIR", str(RAIZ / "chroma_db"))
COLECCION = "catalogo_greenova"
MODELO_CHAT = os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
# Tiene que ser el mismo modelo de embeddings que usó ingest.py: comparar
# vectores de dos modelos distintos da resultados basura.
MODELO_EMBEDDING = "text-embedding-3-small"

MAX_RONDAS_HERRAMIENTA = 4  # tope de idas y vueltas de tool-calling por turno
LIM_TURNOS_HISTORIAL = 12   # turnos de charla que se mandan de contexto

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "buscar_en_catalogo",
            "description": (
                "Busca productos en el catálogo de GreeNova por significado, no por "
                "coincidencia exacta de texto. Úsala SIEMPRE que el cliente pida un "
                "producto, sin importar qué tan destruida o incomprensible esté su "
                "ortografía — nunca te rindas ni preguntes '¿qué quisiste decir?'. "
                "Puedes llamarla varias veces en el mismo turno: una para el producto "
                "que pidió el cliente y otra para buscar el complemento de cross-sell "
                "(p. ej. su tapa)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "traduccion_mental": {
                        "type": "string",
                        "description": (
                            "Obligatorio y siempre primero: escribe aquí la frase del "
                            "cliente ya corregida, con ortografía perfecta y deduciendo su "
                            "intención real por el contexto (vendes empaques, vasos, tapas "
                            "y desechables biodegradables). Ejemplo: si el cliente escribió "
                            "'kiero 100 knedorsitos', esto debe decir 'quiero 100 "
                            "tenedores'. Este paso es tu borrador mental antes de armar la "
                            "búsqueda — hazlo siempre, aunque el mensaje se vea claro."
                        ),
                    },
                    "query_para_busqueda": {
                        "type": "string",
                        "description": (
                            "El término técnico, limpio y en español que sacas de "
                            "`traduccion_mental` para buscar en el catálogo: tipo de "
                            "producto, medida/oz, boca en mm o material, p. ej. 'vaso de "
                            "papel biodegradable de 12 onzas' o 'tapa boca 90 mm'."
                        ),
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Resultados a devolver (3 para algo puntual, hasta 8 para explorar opciones).",
                        "minimum": 1,
                        "maximum": 10,
                    },
                },
                "required": ["traduccion_mental", "query_para_busqueda"],
            },
        },
    }
]


def _cargar_coleccion():
    chroma = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        return chroma.get_collection(COLECCION)
    except Exception as exc:
        raise SystemExit(
            f"No encontré la colección '{COLECCION}' en {CHROMA_DIR}. "
            "Corre primero: python ingest.py"
        ) from exc


def buscar_en_catalogo(cliente_openai: OpenAI, coleccion, query: str, top_k: int = 5) -> list[dict]:
    """Ejecuta la búsqueda semántica real contra ChromaDB. Esto es lo que
    corre cuando el modelo decide llamar la herramienta — nunca se le pasa
    la pregunta cruda del cliente, sino la query ya corregida que arma el LLM."""
    top_k = max(1, min(int(top_k or 5), 10))
    vector = cliente_openai.embeddings.create(model=MODELO_EMBEDDING, input=[query]).data[0].embedding
    resultado = coleccion.query(query_embeddings=[vector], n_results=top_k)

    productos = []
    documentos = resultado["documents"][0] if resultado["documents"] else []
    metadatas = resultado["metadatas"][0] if resultado["metadatas"] else []
    distancias = resultado["distances"][0] if resultado["distances"] else [None] * len(documentos)

    for meta, distancia in zip(metadatas, distancias):
        precios = json.loads(meta["precios_json"]) if meta.get("precios_json") else []
        productos.append({
            "nombre": meta["nombre"],
            "categoria": meta["categoria"],
            "material": meta.get("material") or None,
            "boca_mm": meta.get("boca_mm") or None,
            "medidas": meta.get("medidas") or None,
            "cotizar": bool(meta.get("cotizar")),
            "precios": precios,
            "notas": meta.get("notas") or None,
            "similitud": round(1 - distancia, 3) if distancia is not None else None,
        })
    return productos


def _ejecutar_tool_call(cliente_openai: OpenAI, coleccion, tool_call) -> str:
    argumentos = json.loads(tool_call.function.arguments or "{}")
    traduccion = argumentos.get("traduccion_mental", "")
    query = argumentos.get("query_para_busqueda", "")
    top_k = argumentos.get("top_k", 5)
    # La traducción mental no se usa para buscar: es el paso de razonamiento
    # que obliga al modelo a descifrar la ortografía antes de armar la query.
    # Se imprime para poder ver, al probar en terminal, qué entendió el modelo.
    if traduccion:
        print(f"  [entendí] \"{traduccion}\"")
    print(f"  [buscando] \"{query}\" (top_k={top_k})")
    resultados = buscar_en_catalogo(cliente_openai, coleccion, query, top_k)
    if not resultados:
        return json.dumps({"resultados": [], "aviso": "Sin coincidencias en el catálogo."}, ensure_ascii=False)
    return json.dumps({"resultados": resultados}, ensure_ascii=False)


def chatear() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit("Falta OPENAI_API_KEY en el entorno.")

    system_prompt = (RAIZ / "system_prompt.txt").read_text(encoding="utf-8")
    cliente_openai = OpenAI()
    coleccion = _cargar_coleccion()

    mensajes = [{"role": "system", "content": system_prompt}]

    print("Agente de ventas GreeNova — escribe 'salir' para terminar.\n")

    while True:
        try:
            pregunta = input("Tú: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nHasta luego.")
            break

        if not pregunta:
            continue
        if pregunta.lower() in {"salir", "exit", "quit"}:
            print("Hasta luego.")
            break

        mensajes.append({"role": "user", "content": pregunta})

        for _ in range(MAX_RONDAS_HERRAMIENTA):
            respuesta = cliente_openai.chat.completions.create(
                model=MODELO_CHAT,
                messages=mensajes,
                tools=TOOLS,
                tool_choice="auto",
            )
            mensaje = respuesta.choices[0].message

            if not mensaje.tool_calls:
                mensajes.append({"role": "assistant", "content": mensaje.content or ""})
                print(f"\nGreeNova: {mensaje.content}\n")
                break

            # El modelo pidió una o más búsquedas: se ejecutan todas antes de
            # volver a preguntarle, tal como exige el formato de tool-calling.
            mensajes.append({
                "role": "assistant",
                "content": mensaje.content,
                "tool_calls": [tc.model_dump() for tc in mensaje.tool_calls],
            })
            for tool_call in mensaje.tool_calls:
                resultado = _ejecutar_tool_call(cliente_openai, coleccion, tool_call)
                mensajes.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": resultado,
                })
        else:
            print("\nGreeNova: (se me complicó buscar eso, ¿me lo repites de otra forma?)\n")

        # Recorta el historial para no mandar la conversación completa cada
        # turno: se conserva el system prompt y los últimos turnos.
        if len(mensajes) > 1 + LIM_TURNOS_HISTORIAL * 3:
            mensajes = [mensajes[0]] + mensajes[-LIM_TURNOS_HISTORIAL * 3:]


if __name__ == "__main__":
    chatear()
