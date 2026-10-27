const runtime = (
  globalThis as typeof globalThis & { __ODIVON_CONFIG__?: { appCheckSiteKey?: string } }
).__ODIVON_CONFIG__;
export const environment = {
  production: true,
  apiBaseUrl: 'https://mainapi.odivon.com/api/v1',
  firebase: {
    apiKey: 'AIzaSyAu1u-wKeR9RQBhp6lqUvo64ZbQ5fNDIGg',
    authDomain: 'odivon-main-api-a2095.firebaseapp.com',
    projectId: 'odivon-main-api-a2095',
    storageBucket: 'odivon-main-api-a2095.firebasestorage.app',
    messagingSenderId: '845036233177',
    appId: '1:845036233177:web:ba0cbe0dcdb48e197bf9c8',
  },
  appCheckSiteKey: runtime?.appCheckSiteKey ?? '',
} as const;

