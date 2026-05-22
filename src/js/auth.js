/**
 * auth.js — Google Sign-In via Firebase Auth
 * No passwords. One tap and you're in.
 */
const Auth = (() => {

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  /* ── Google popup sign-in ── */
  async function googleSignIn() {
    const btn = document.getElementById('google-btn');
    const err = document.getElementById('auth-err');
    err.textContent = '';

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<div class="btn-spinner"></div> Signing in…';

    try {
      const result = await auth.signInWithPopup(provider);
      const user   = result.user;
      // onAuthStateChanged will handle the rest
    } catch (e) {
      console.error('[Auth]', e);
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google`;

      if (e.code === 'auth/popup-closed-by-user') return; // user dismissed — no error shown
      if (e.code === 'auth/popup-blocked') {
        err.textContent = 'Popup blocked. Please allow popups for this site and try again.';
      } else if (e.code === 'auth/unauthorized-domain') {
        err.textContent = `This domain (${location.hostname}) is not authorized in Firebase Auth. Open the app at http://localhost:8000, or add this hostname to Authorized domains in Firebase.`;
      } else if (e.code === 'auth/operation-not-allowed') {
        err.textContent = 'Google sign-in is disabled in Firebase Auth. Enable the Google provider in the Firebase console.';
      } else {
         
        // err.textContent =  'Sign-in failed. please try again.'
         err.textContent = `Sign-in failed${e.code ? ` (${e.code})` : ''}${e.message ? `: ${e.message}` : '.'}`;
      }
    }
  }

  /* ── Sign out ── */
  function logout() {
    auth.signOut();
    if (typeof Clock !== 'undefined') Clock.stop();
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('auth-err').textContent = '';
    // Reset Google button
    const btn = document.getElementById('google-btn');
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google`;
  }

  /* ── Listen for auth state — auto-restores session on reload ── */
  function init() {
    auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        // Logged in — extract user info and launch app
        const user = {
          id:    firebaseUser.uid,
          name:  firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
        };
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-screen').classList.remove('hidden');
        App.boot(user);
      } else {
        // Not logged in — show auth screen
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-screen').classList.add('hidden');
      }
    });
  }

  return { googleSignIn, logout, init };
})();
