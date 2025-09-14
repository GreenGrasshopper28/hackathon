// frontend/src/auth.js

let googleReady = false;

/**
 * Load Google Identity Services script
 */
export function loadGoogleScript(clientId, callback) {
  if (googleReady) {
    callback && callback();
    return;
  }
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  s.onload = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback,
      });
      googleReady = true;
      callback && callback();
    }
  };
  document.head.appendChild(s);
}

/**
 * Render the Google sign-in button into a container
 */
export function renderGoogleButton(containerId, options = {}) {
  if (!window.google) return;
  window.google.accounts.id.renderButton(
    document.getElementById(containerId),
    {
      theme: options.theme || "outline",
      size: options.size || "large",
    }
  );
}

/**
 * Prompt one-tap sign in (optional)
 */
export function promptGoogleOneTap() {
  if (!window.google) return;
  window.google.accounts.id.prompt();
}
