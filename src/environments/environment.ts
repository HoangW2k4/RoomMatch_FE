const runtimeEnv = (globalThis as unknown as { __env?: Record<string, string> }).__env || {};

const defaultEnv = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:3000',
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  websocketUrl: "ws://localhost:8080/ws-pure"
};

export const environment = {
  ...defaultEnv,
  apiUrl: runtimeEnv["API_URL"] || defaultEnv.apiUrl,
  wsUrl: runtimeEnv["WS_URL"] || defaultEnv.wsUrl,
  websocketUrl: runtimeEnv["WEBSOCKET_URL"] || defaultEnv.websocketUrl,
  firebase: {
    ...defaultEnv.firebase,
    apiKey: runtimeEnv["FIREBASE_API_KEY"] || defaultEnv.firebase.apiKey,
    authDomain: runtimeEnv["FIREBASE_AUTH_DOMAIN"] || defaultEnv.firebase.authDomain,
    projectId: runtimeEnv["FIREBASE_PROJECT_ID"] || defaultEnv.firebase.projectId,
    storageBucket: runtimeEnv["FIREBASE_STORAGE_BUCKET"] || defaultEnv.firebase.storageBucket,
    messagingSenderId: runtimeEnv["FIREBASE_MESSAGING_SENDER_ID"] || defaultEnv.firebase.messagingSenderId,
    appId: runtimeEnv["FIREBASE_APP_ID"] || defaultEnv.firebase.appId,
    measurementId: runtimeEnv["FIREBASE_MEASUREMENT_ID"] || defaultEnv.firebase.measurementId
  }
};
