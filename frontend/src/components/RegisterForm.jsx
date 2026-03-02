import { useState } from "react";
import PasswordStrength from "./PasswordStrength";
import Toast from "./Toast";
import "../styles/Auth.css";

function validateField(key, value) {
  switch (key) {
    case "fullname":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 3) return "Name must be at least 3 characters";
      if (!/^[a-zA-Z\s]+$/.test(value.trim()))
        return "Name can only contain letters and spaces";
      return "";

    case "username":
      if (!value.trim()) return "Username is required";
      if (value.length < 3 || value.length > 20)
        return "Username must be 3–20 characters";
      if (!/^[a-zA-Z0-9_]+$/.test(value))
        return "Only letters, numbers, and underscores allowed";
      return "";

    case "password":
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter";
      if (!/[0-9]/.test(value)) return "Must contain at least one number";
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value))
        return "Must contain at least one special character";
      return "";

    case "mobile":
      if (!value.trim()) return "Mobile number is required";
      if (!/^[6-9]\d{9}$/.test(value.trim()))
        return "Enter valid 10-digit Indian number";
      return "";

    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
        return "Enter valid email address";
      return "";

    default:
      return "";
  }
}

// Validation order — one-by-one
const FIELD_ORDER = ["fullname", "username", "mobile", "email", "password"];

export default function RegisterForm({ onSwitchToLogin }) {
  // Persist step across refresh so telegram/otp step survives page reload
  const [step, setStep] = useState(() => sessionStorage.getItem("regStep") || "form");
  const goToStep = (s) => { sessionStorage.setItem("regStep", s); setStep(s); };
  const [telegramLink, setTelegramLink] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [toast, setToast] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  // FIX 4: Track pending email so we can cancel it if user goes back
  const [pendingEmail, setPendingEmail] = useState(null);

  const [form, setForm] = useState(() => {
    const saved = sessionStorage.getItem("regForm");
    return saved ? JSON.parse(saved) : { fullname: "", username: "", password: "", mobile: "", email: "" };
  });

  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      sessionStorage.setItem("regForm", JSON.stringify(updated));
      return updated;
    });
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // FIX 4: Call cancel-pending API when user goes back
  // const cancelPending = async () => {
  //   if (!pendingEmail) return;
  //   try {
  //     await fetch("http://localhost:5000/api/auth/cancel-pending", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email: pendingEmail }),
  //     });
  //   } catch (err) {
  //     console.error("Cancel pending error:", err);
  //   }
  //   setPendingEmail(null);
  // };

  // STEP 1: Validate one-by-one and submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // FIX 2: Find the first failing field and show only that error
    for (const key of FIELD_ORDER) {
      const err = validateField(key, form[key]);
      if (err) {
        setErrors({ [key]: err }); // show only this one error
        return;
      }
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/connect-telegram",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const msg = data.message || "";
        const lower = msg.toLowerCase();

        if (lower.includes("username") && (lower.includes("taken") || lower.includes("already") || lower.includes("exists"))) {
          setErrors({ username: "This username is already taken" });
          showToast("error", "Username Taken", "Please choose a different username.");
        } else if (lower.includes("email") && (lower.includes("registered") || lower.includes("already") || lower.includes("exists"))) {
          setErrors({ email: "This email is already registered" });
          showToast("error", "Email Already Registered", "An account with this email exists. Please sign in.");
        } else {
          showToast("error", "Registration Failed", msg || "Something went wrong.");
        }
        return;
      }

      setTelegramLink(data.telegramLink);
      // setPendingEmail(form.email); 
      // // FIX 4: mark as pending
      goToStep("telegram");
    } catch (err) {
      console.error(err);
      showToast("error", "Server Error", "Could not connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Open Telegram → move to OTP input
  const handleConnectTelegram = () => {
    window.open(telegramLink, "_blank");
    goToStep("otp");
  };

  // STEP 3: Verify OTP and register
  const handleRegister = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    if (!/^\d{4,6}$/.test(otp.trim())) {
      setOtpError("Enter a valid OTP (4–6 digits).");
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", "Verification Failed", data.message || "Invalid or expired OTP.");
        setOtpError(data.message || "Invalid or expired OTP.");
        return;
      }

      // setPendingEmail(null); // registration complete
      sessionStorage.removeItem('regStep');
      sessionStorage.removeItem('regForm');
      showToast("success", "🎉 Registered!", "Your account has been created successfully.");
      setTimeout(() => onSwitchToLogin(), 2000);
    } catch (err) {
      console.error(err);
      showToast("error", "Server Error", "Could not verify OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================= TELEGRAM STEP =================
  if (step === "telegram") {
    return (
      <div className="telegramStep">
        {toast && (
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
          />
        )}

        <h3>Connect Your Telegram</h3>
        <p>
          Click the button below and press <strong>START</strong> in Telegram.
          An OTP will be sent to your Telegram automatically.
        </p>

        <button className="submitBtn" onClick={handleConnectTelegram}>
          Connect Telegram &amp; Send OTP →
        </button>

        <button
          type="button"
          className="linkBtn"
          style={{ marginTop: "12px" }}
          onClick={async () => {
            // await cancelPending(); // FIX 4: delete pending record before going back
            sessionStorage.removeItem("regStep");
            sessionStorage.removeItem("regForm");
            goToStep("form");
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ================= OTP STEP =================
  if (step === "otp") {
    return (
      <div className="otpStep">
        {toast && (
          <Toast
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast(null)}
          />
        )}

        <div className="sectionTitle">Enter OTP</div>
        <div className="sectionSub">
          Check your Telegram for the OTP sent to <strong>{form.email}</strong>
        </div>

        <div className="fieldGroup" style={{ marginTop: "20px" }}>
          <label className="fieldLabel">OTP Code</label>
          <div className="fieldWrap">
            <span className="fieldIcon">🔐</span>
            <input
              className={`fieldInput${otpError ? " hasError" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (otpError) setOtpError("");
              }}
            />
          </div>
          {otpError && <div className="errMsg">⚠ {otpError}</div>}
        </div>

        <button
          className="submitBtn"
          onClick={handleRegister}
          disabled={loading}
          style={{ marginTop: "8px" }}
        >
          {loading ? "Registering..." : "Register →"}
        </button>

        <button
          type="button"
          className="linkBtn"
          style={{ marginTop: "12px" }}
          onClick={async () => {
            // await cancelPending(); // FIX 4: delete pending record before going back
            goToStep("telegram");
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ================= FORM STEP =================
  return (
    <>
      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="sectionTitle">Create account</div>
        <div className="sectionSub">Join us — it only takes a minute</div>

        {["fullname", "username", "mobile", "email"].map((field) => (
          <div key={field} className="fieldGroup">
            <label className="fieldLabel">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              className={`fieldInput${errors[field] ? " hasError" : ""}`}
              type="text"
              value={form[field]}
              onChange={(e) => setField(field, e.target.value)}
            />
            {errors[field] && (
              <div className="errMsg">⚠ {errors[field]}</div>
            )}
          </div>
        ))}

        <div className="fieldGroup">
          <label className="fieldLabel">Password</label>
          <div className="fieldWrap">
            <input
              className={`fieldInput${errors.password ? " hasError" : ""}`}
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
            />
            <button
              type="button"
              className="eyeBtn"
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
          <PasswordStrength password={form.password} />
          {errors.password && (
            <div className="errMsg">⚠ {errors.password}</div>
          )}
        </div>

        <button type="submit" className="submitBtn" disabled={loading}>
          {loading ? "Please wait..." : "Continue →"}
        </button>

        <div className="switchLink">
          Already have an account?{" "}
          <button type="button" className="linkBtn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </form>
    </>
  );
}