import { environment } from '../../../environments/environment';

type FirebaseConfig = typeof environment.firebase;

export interface RuntimeEnvironment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  websocketUrl: string;
  firebase: FirebaseConfig;
}

declare global {
  interface Window {
    __ROOMMATCH_ENV__?: Partial<Omit<RuntimeEnvironment, 'firebase'>> & {
      firebase?: Partial<FirebaseConfig>;
    };
  }
}

const runtime = window.__ROOMMATCH_ENV__ ?? {};

export const runtimeEnvironment: RuntimeEnvironment = {
  ...environment,
  ...runtime,
  firebase: {
    ...environment.firebase,
    ...runtime.firebase
  }
};
