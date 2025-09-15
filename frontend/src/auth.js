// frontend/src/auth.js
export function loadGoogleScript(callback) {
  if (window.google) {
    callback && callback();
    return;
  }
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  s.onload = () => callback && callback();
  document.head.appendChild(s);
}

export function renderGoogleButton(containerId, clientId, options = {}) {
  if (!window.google || !document.getElementById(containerId)) return;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: options.callback,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  window.google.accounts.id.renderButton(
    document.getElementById(containerId),
    { theme: options.theme || "outline", size: options.size || "large" }
  );
}
