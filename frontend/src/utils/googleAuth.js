let isGsiInitialized = false;
let currentCallback = null;
let tokenClient = null;

const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '437241590710-ce84o2fcqnbg1esivhsbgcdr8cpfs0m3.apps.googleusercontent.com';

/**
 * Ensures Google Identity Services (GSI) script is loaded
 */
export function loadGsiScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    let script = document.getElementById('google-gsi-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (e) => {
        console.warn('Failed to load Google GSI script', e);
        resolve();
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', () => resolve(), { once: true });
    }
  });
}

/**
 * Initialize Google Identity Services (GSI) and OAuth2 Token Client
 */
export async function initGoogleAuth(callback, clientId = DEFAULT_CLIENT_ID) {
  if (callback) currentCallback = callback;

  await loadGsiScript();

  if (window.google?.accounts?.id && !isGsiInitialized) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential && currentCallback) {
            currentCallback({ credential: response.credential });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });
      isGsiInitialized = true;
    } catch (err) {
      console.warn('Google GSI initialize error:', err);
    }
  }

  if (window.google?.accounts?.oauth2 && !tokenClient) {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (response) => {
          if (response?.access_token && currentCallback) {
            currentCallback({ accessToken: response.access_token });
          }
        },
      });
    } catch (err) {
      console.warn('Google OAuth2 TokenClient init error:', err);
    }
  }
}

/**
 * Render standard Google button into target DOM element
 */
export async function renderGoogleButton(element, options = {}) {
  if (!element) return;
  await loadGsiScript();

  if (window.google?.accounts?.id && element) {
    try {
      window.google.accounts.id.renderButton(element, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        ...options,
      });
    } catch (err) {
      console.warn('Render Google button error:', err);
    }
  }
}

/**
 * Trigger Google One-Tap prompt
 */
export function triggerGooglePrompt() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
  }
}

/**
 * Trigger Google Authentication (OAuth2 Popup Flow or fallback to prompt)
 */
export async function triggerGoogleLogin() {
  await loadGsiScript();

  if (!tokenClient && window.google?.accounts?.oauth2) {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: DEFAULT_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response) => {
          if (response?.access_token && currentCallback) {
            currentCallback({ accessToken: response.access_token });
          }
        },
      });
    } catch (err) {
      console.warn('Google OAuth2 TokenClient fallback init failed:', err);
    }
  }

  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  } else if (window.google?.accounts?.id) {
    window.google.accounts.id.prompt();
  } else {
    console.error('Google Auth SDK is not available or blocked');
  }
}
