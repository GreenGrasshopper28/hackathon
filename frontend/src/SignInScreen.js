// frontend/src/SignInScreen.js
import React, { useEffect } from "react";
import { loadGoogleScript, renderGoogleButton } from "./auth";
import "./signin.css"

export default function SignInScreen({ clientId, onSignedIn }) {
  useEffect(() => {
    loadGoogleScript(() => {
      renderGoogleButton("google-signin-button", clientId, {
        callback: async (resp) => {
          // send ID token to backend for verification
          try {
            const id_token = resp.credential;
            const res = await fetch("/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.detail || "Auth failed");
            onSignedIn(j.user);
          } catch (err) {
            console.error("Auth failed:", err);
            alert("Sign-in failed: " + (err.message || err));
          }
        },
      });
    });
  }, [clientId, onSignedIn]);

  // Your original markup adapted to React. Buttons toggle panel classes via CSS class on container.
  // We'll manage the animation purely with CSS (class on root div `.right-panel-active`)
  useEffect(() => {
    // no-op here; animation triggered by internal buttons below
  }, []);

  return (
    <div className="signin-root">
      <div className="container" id="container-react">
        <div className="form-container sign-up-container">
          <form action="#" onSubmit={(e)=>e.preventDefault()}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-google-plus-g" /></a>
            </div>
            <span>or use your email for registration</span>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Sign Up</button>
          </form>
        </div>
        <div className="form-container sign-in-container">
          <form action="#" onSubmit={(e)=>e.preventDefault()}>
            <h1>Sign in</h1>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <a href="#">Forgot your password?</a>
            <div id="google-signin-button" style={{ marginTop: 12, marginBottom: 12 }} />
            <button>Sign In</button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" id="signIn" onClick={()=>{
                document.getElementById("container-react").classList.remove("right-panel-active");
              }}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" id="signUp" onClick={()=>{
                document.getElementById("container-react").classList.add("right-panel-active");
              }}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
