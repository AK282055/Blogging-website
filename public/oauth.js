/**
 * Google OAuth 2.0 Handler
 * Handles Google Sign-In and login logic
 */

// Initialize Google Sign-In
function initGoogleAuth() {
    // Get Google Client ID from data attribute or environment
    const clientId = "http://533631352291-silmrmc9lq8cr5r5cckhmnhn5gepbtqj.apps.googleusercontent.com"; // Replace with your actual Client ID

    if (!window.google) {
        console.warn("Google Identity Services library not loaded");
        return;
    }

    // Initialize Google Sign-In
    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback
    });
}

/**
 * Handle Google OAuth callback after successful sign-in
 * @param {object} response - Google OAuth response with ID token
 */
async function handleGoogleCallback(response) {
    const token = response.credential;

    if (!token) {
        alert("Authentication failed. Please try again.");
        return;
    }

    // Show loading state
    showLoadingState(true);

    try {
        // Send token to backend for verification
        const res = await fetch("http://localhost:3000/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token })
        });

        const data = await res.json();

        if (data.success) {
            // Store user data in localStorage
            localStorage.setItem("loggedInUser", data.user.username);
            localStorage.setItem("loggedInEmail", data.user.email);
            localStorage.setItem("userProfile", JSON.stringify(data.user));

            // Show success message
            showNotification("✅ Login successful!", "success");

            // Redirect to profile or home after 1.5 seconds
            setTimeout(() => {
                window.location.href = "profile.html";
            }, 1500);
        } else {
            showNotification("❌ " + (data.message || "Login failed"), "error");
        }
    } catch (error) {
        console.error("Google Auth Error:", error);
        showNotification("❌ Network error. Please try again.", "error");
    } finally {
        showLoadingState(false);
    }
}

/**
 * Initiate Google Sign-In flow
 * Called when user clicks the Google button
 */
function startGoogleSignIn() {
    if (!window.google) {
        alert("Google services not available. Please refresh and try again.");
        return;
    }

    // Trigger Google's Sign-In prompt
    google.accounts.id.prompt();
}

/**
 * Handle manual Google button clicks
 */
function setupGoogleButtons() {
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    const googleSignupBtn = document.getElementById("googleSignupBtn");

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener("click", startGoogleSignIn);
    }

    if (googleSignupBtn) {
        googleSignupBtn.addEventListener("click", startGoogleSignIn);
    }
}

/**
 * Show loading state on buttons
 */
function showLoadingState(isLoading) {
    const buttons = document.querySelectorAll(".google-btn");
    buttons.forEach(btn => {
        if (isLoading) {
            btn.classList.add("loading");
            btn.disabled = true;
            btn.textContent = "🔄 Processing...";
        } else {
            btn.classList.remove("loading");
            btn.disabled = false;
            // Restore original text
            if (btn.id === "googleLoginBtn") btn.innerHTML = 'Continue with Google';
            if (btn.id === "googleSignupBtn") btn.innerHTML = 'Sign up with Google';
            // Restore original text
            if (btn.id === "googleLoginBtn") btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google';
            if (btn.id === "googleSignupBtn") btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Sign up with Google';
        }
    });
}

/**
 * Show notification messages
 */
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;

    if (type === "success") {
        notification.style.background = "#4CAF50";
        notification.style.color = "#fff";
    } else if (type === "error") {
        notification.style.background = "#f44336";
        notification.style.color = "#fff";
    } else {
        notification.style.background = "#2196F3";
        notification.style.color = "#fff";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Check if user is already logged in
 */
async function checkUserSession() {
    try {
        const res = await fetch("http://localhost:3000/auth/user");
        const data = await res.json();

        if (data.success) {
            // User is logged in
            updateUIForLoggedInUser(data.user);
            return true;
        }
    } catch (error) {
        console.error("Session check error:", error);
    }
    return false;
}

/**
 * Update UI to show logged-in user
 */
function updateUIForLoggedInUser(user) {
    const userOptions = document.getElementById("userOptions");
    if (!userOptions) return;

    const profileLink = document.querySelector('a[href="profile.html"]');
    if (profileLink) {
        profileLink.textContent = `👤 ${user.name || user.username}`;
    }

    // Replace login/signup with logout
    const loginLink = document.querySelector('a[href="login.html"]');
    const signupLink = document.querySelector('a[href="signup.html"]');

    if (loginLink) loginLink.style.display = "none";
    if (signupLink) signupLink.style.display = "none";

    if (!userOptions.querySelector("#logoutBtn")) {
        const logoutBtn = document.createElement("button");
        logoutBtn.id = "logoutBtn";
        logoutBtn.textContent = "Logout";
        logoutBtn.style.cssText = `
      background: #f44336;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
    `;
        logoutBtn.addEventListener("click", handleLogout);
        userOptions.appendChild(logoutBtn);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        const res = await fetch("http://localhost:3000/auth/logout", {
            method: "POST"
        });

        const data = await res.json();

        if (data.success) {
            // Clear localStorage
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("loggedInEmail");
            localStorage.removeItem("userProfile");

            // Clear Google session
            if (window.google) {
                google.accounts.id.disableAutoSelect();
            }

            showNotification("✅ Logged out successfully!", "success");

            // Redirect to home
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        }
    } catch (error) {
        console.error("Logout error:", error);
        showNotification("❌ Logout failed", "error");
    }
}

/**
 * Initialize on page load
 */
document.addEventListener("DOMContentLoaded", () => {
    // Setup Google OAuth
    initGoogleAuth();
    setupGoogleButtons();

    // Check if user is already logged in
    checkUserSession();

    // Add animation styles
    const style = document.createElement("style");
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
    document.head.appendChild(style);
});
