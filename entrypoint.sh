#!/bin/sh
set -e

RUNTIME_ENV_PATH="/app/dist/roommatch-fe/browser/assets/runtime-env.js"

cat > "$RUNTIME_ENV_PATH" <<EOF
(function (window) {
  window.__env = window.__env || {};
  window.__env.API_URL = window.__env.API_URL || "${API_URL}";
  window.__env.WS_URL = window.__env.WS_URL || "${WS_URL}";
  window.__env.WEBSOCKET_URL = window.__env.WEBSOCKET_URL || "${WEBSOCKET_URL}";
  window.__env.FIREBASE_API_KEY = window.__env.FIREBASE_API_KEY || "${FIREBASE_API_KEY}";
  window.__env.FIREBASE_AUTH_DOMAIN = window.__env.FIREBASE_AUTH_DOMAIN || "${FIREBASE_AUTH_DOMAIN}";
  window.__env.FIREBASE_PROJECT_ID = window.__env.FIREBASE_PROJECT_ID || "${FIREBASE_PROJECT_ID}";
  window.__env.FIREBASE_STORAGE_BUCKET = window.__env.FIREBASE_STORAGE_BUCKET || "${FIREBASE_STORAGE_BUCKET}";
  window.__env.FIREBASE_MESSAGING_SENDER_ID = window.__env.FIREBASE_MESSAGING_SENDER_ID || "${FIREBASE_MESSAGING_SENDER_ID}";
  window.__env.FIREBASE_APP_ID = window.__env.FIREBASE_APP_ID || "${FIREBASE_APP_ID}";
  window.__env.FIREBASE_MEASUREMENT_ID = window.__env.FIREBASE_MEASUREMENT_ID || "${FIREBASE_MEASUREMENT_ID}";
})(window);
EOF

exec serve -s dist/roommatch-fe/browser -l 3000
