#!/bin/zsh
# Abre el panel de precios de GreeNova en esta computadora.
# Doble clic en este archivo: prende el panel y lo abre en Safari. La
# contraseña se crea y se cambia en la misma página del panel.
# Mientras esta ventana siga abierta, el panel funciona; si la cierras, se apaga.

cd "$(dirname "$0")" || exit 1

# Si el panel ya estaba prendido, solo abre la página.
if lsof -iTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "El panel ya está prendido. Abriendo http://localhost:8000/admin.html"
  open "http://localhost:8000/admin.html"
  exit 0
fi

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "Preparando el panel por primera vez (tarda un minuto)..."
  python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt || exit 1
fi

clear
echo "Panel de precios de GreeNova: abriéndolo en Safari..."
echo "NO cierres esta ventana: si la cierras, el panel se apaga."
echo
( sleep 2; open "http://localhost:8000/admin.html" ) &
MODO_LOCAL=1 exec .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
