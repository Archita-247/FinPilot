
import { useState } from "react";
import { auth } from "./firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    
// Minimum 8 characters
if (password.length < 8) {
  setError("Password must contain at least 8 characters.");
  return;
}

// At least one uppercase letter
if (!/[A-Z]/.test(password)) {
  setError("Password must contain at least one uppercase letter.");
  return;
}

// At least one numerical digit
if (!/[0-9]/.test(password)) {
  setError("Password must contain at least one number.");
  return;
}

// At least one special character
if (!/[^A-Za-z0-9\s]/.test(password)) {
  setError("Password must contain at least one special character.");
  return;
}


    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      await sendEmailVerification(result.user);
      await signOut(auth);

      setSuccess(
        "Account created! Please verify your email before logging in."
      );

      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Registration error:", err);

      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Please choose a stronger password.",
        "auth/operation-not-allowed":
          "Email and password authentication is not enabled.",
      };

      setError(
        messages[err.code] || "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      setLoading(true);

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (!result.user.emailVerified) {
        await signOut(auth);
        setError(
          "Please verify your email before logging in. Check your inbox."
        );
        return;
      }

      // App.jsx will detect the authenticated user.
    } catch (err) {
      console.error("Login error:", err);

      const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests":
          "Too many attempts. Please try again later.",
        "auth/unauthorized-domain":
          "This website domain is not authorized in Firebase.",
      };

      setError(
        messages[err.code] || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setError("Enter your registered email address first.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim());

      setSuccess("Password reset link sent. Please check your email.");
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err.code === "auth/user-not-found"
          ? "No account found with this email."
          : "Unable to send reset link. Please check your email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px;
          background:
            radial-gradient(circle at 10% 15%, #eeeaff 0, transparent 32%),
            radial-gradient(circle at 90% 85%, #e8f0ff 0, transparent 32%),
            #f7f8fc;
          font-family: 'DM Sans', sans-serif;
        }

        .auth-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 960px;
          min-height: 570px;
          overflow: hidden;
          background: white;
          border-radius: 22px;
          border: 1px solid #ececf4;
          box-shadow: 0 20px 60px #30306a12;
        }

        .auth-intro {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          color: white;
          background: linear-gradient(145deg, #6555d8, #9184f5);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .auth-logo-mark {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #ffffff25;
          font-size: 25px;
        }

        .auth-intro-content h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 35px;
          line-height: 1.3;
          letter-spacing: -1.2px;
          margin: 0 0 18px;
          color: white;
        }

        .auth-intro-content p {
          font-size: 16px;
          line-height: 1.8;
          color: #ffffffd9;
          margin: 0;
        }

        .auth-quote {
          font-size: 13px;
          color: #ffffffc9;
        }

        .auth-form-area {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 45px;
        }

        .auth-form-area h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 27px;
          letter-spacing: -.7px;
          margin: 0 0 8px;
          color: #20243a;
        }

        .auth-subtitle {
          color: #7c8295;
          font-size: 14px;
          margin-bottom: 27px;
          line-height: 1.6;
        }

        .auth-fields {
          display: grid;
          gap: 17px;
        }

        .auth-field {
          display: grid;
          gap: 8px;
        }

        .auth-field label {
          font-size: 13px;
          font-weight: 700;
          color: #555b70;
        }

        .auth-field input {
          width: 100%;
          height: 47px;
          padding: 0 14px;
          border: 1px solid #e3e5ee;
          border-radius: 10px;
          outline: none;
          background: #fafafd;
          color: #20243a;
          font-size: 14px;
          transition: .2s;
        }

        .auth-field input:focus {
          border-color: #7667e8;
          box-shadow: 0 0 0 3px #7667e81a;
        }

        .auth-submit {
          width: 100%;
          padding: 14px;
          margin-top: 7px;
          color: white;
          background: #7667e8;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 800;
          box-shadow: 0 6px 15px #7667e833;
        }

        .auth-submit:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .auth-switch {
          margin-top: 23px;
          text-align: center;
          color: #858a9b;
          font-size: 14px;
        }

        .auth-link {
          color: #7667e8;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
        }

        .auth-forgot {
          display: block;
          margin: 0 0 4px auto;
          text-align: right;
        }

        .auth-message {
          padding: 12px;
          margin-bottom: 17px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.5;
        }

        .auth-error {
          color: #bd465b;
          background: #fff0f2;
        }

        .auth-success {
          color: #258265;
          background: #eaf8f2;
        }

        .auth-back {
          margin-top: 18px;
        }

        @media(max-width: 720px) {
          .auth-page {
            padding: 14px;
          }

          .auth-card {
            grid-template-columns: 1fr;
            max-width: 450px;
          }

          .auth-intro {
            padding: 25px;
          }

          .auth-intro-content {
            padding: 35px 0 20px;
          }

          .auth-intro-content h1 {
            font-size: 26px;
          }

          .auth-intro-content p {
            font-size: 14px;
          }

          .auth-quote {
            display: none;
          }

          .auth-form-area {
            padding: 30px 25px;
          }
        }

/* Password requirements */
.auth-password-hint {
  padding: 11px 13px;
  background: #F5F3FF;
  border: 1px solid #E8E3FF;
  border-radius: 9px;
  color: #65617F;
  font-size: 13px;
  line-height: 1.6;
}

.auth-password-hint strong {
  display: block;
  color: #5146A5;
  margin-bottom: 5px;
}

.auth-password-hint ul {
  margin: 0;
  padding-left: 20px;
}

/* Show password checkbox */
.auth-show-password {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: -3px;
  color: #62697D;
  font-size: 14px;
  cursor: pointer;
}

.auth-show-password input {
  width: 17px;
  height: 17px;
  accent-color: #7667E8;
  cursor: pointer;
}

      `}</style>

      <div className="auth-card">
        <section className="auth-intro">
          <div className="auth-logo">
            <div className="auth-logo-mark">F</div>
            FinPilot
          </div>

          <div className="auth-intro-content">
            <h1>Take control of your financial future.</h1>
            <p>
              Understand your spending, build better savings habits
              and make every rupee count.
            </p>
          </div>

          <div className="auth-quote">
            Your money. Your decisions. Your future.
          </div>
        </section>

        <section className="auth-form-area">
          {mode === "login" && (
            <>
              <h2>Welcome back</h2>
              <p className="auth-subtitle">
                Sign in to continue to your FinPilot dashboard.
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <h2>Create your account</h2>
              <p className="auth-subtitle">
                Start managing your money with FinPilot.
              </p>
            </>
          )}

          {mode === "reset" && (
            <>
              <h2>Reset password</h2>
              <p className="auth-subtitle">
                We'll send you a password reset link.
              </p>
            </>
          )}

          {error && <div className="auth-message auth-error">{error}</div>}
          {success && <div className="auth-message auth-success">{success}</div>}

          <form
            className="auth-fields"
            onSubmit={
              mode === "login"
                ? handleLogin
                : mode === "register"
                ? handleRegister
                : handleReset
            }
          >
            {mode === "register" && (
              <div className="auth-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

   
{mode !== "reset" && (
  <div className="auth-field">
    <label>Password</label>

    {mode === "register" && (
      <div className="auth-password-hint">
        <strong>Password requirements:</strong>
        <ul>
          <li>At least 8 characters</li>
          <li>At least one uppercase letter (A–Z)</li>
          <li>At least one number (0–9)</li>
          <li>At least one special character (!@#$%)</li>
        </ul>
      </div>
    )}

    <input
      type={showPassword ? "text" : "password"}
      placeholder={mode === "register" ? "Create a strong password" : "Enter your password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      autoComplete={mode === "login" ? "current-password" : "new-password"}
      minLength={8}
      required
    />
  </div>
)}

{mode === "register" && (
  <div className="auth-field">
    <label>Confirm Password</label>
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Re-enter your password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      autoComplete="new-password"
      minLength={8}
      required
    />
  </div>
)}

{mode !== "reset" && (
  <label className="auth-show-password">
    <input
      type="checkbox"
      checked={showPassword}
      onChange={(e) => setShowPassword(e.target.checked)}
    />
    Show password
  </label>
)}


            {mode === "login" && (
              <button
                type="button"
                className="auth-link auth-forgot"
                onClick={() => {
                  clearMessages();
                  setMode("reset");
                }}
              >
                Forgot password?
              </button>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : mode === "register"
                ? "Create Account"
                : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login" && (
              <>
                Don't have an account?{" "}
                <button
                  className="auth-link"
                  onClick={() => {
                    clearMessages();
                    setMode("register");
                  }}
                >
                  Create account
                </button>
              </>
            )}

            {mode === "register" && (
              <>
                Already registered?{" "}
                <button
                  className="auth-link"
                  onClick={() => {
                    clearMessages();
                    setMode("login");
                  }}
                >
                  Sign in
                </button>
              </>
            )}

            {mode === "reset" && (
              <button
                className="auth-link auth-back"
                onClick={() => {
                  clearMessages();
                  setMode("login");
                }}
              >
                ← Back to login
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
