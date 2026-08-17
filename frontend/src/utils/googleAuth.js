let isInitialized = false;
let currentCallback = null;

const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '437241590710-ce84o2fcqnbg1esivhsbgcdr8cpfs0m3.apps.googleusercontent.com';

/**
 * Initialize Google Identity Services (GSI) once globally
 * and dynamically dispatch credential callbacks.
 */
export function initGoogleAuth(callback, clientId = DEFAULT_CLIENT_ID) {
  currentCallback = callback;

  const init = () => {
    if (!window.google?.accounts?.id) return;

    if (!isInitialized) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential && currentCallback) {
            currentCallback(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
      });
      isInitialized = true;
    }
  };

  if (window.google?.accounts?.id) {
    init();
  } else {
    let script = document.getElementById('google-gsi-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', init);
    }
  }
}

/**
 * Render standard Google button into target DOM element
 */
export function renderGoogleButton(element, options = {}) {
  if (window.google?.accounts?.id && element) {
    window.google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      ...options,
    });
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
