import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import "./authmodal.css";
import {
  FaHome, FaTag, FaExchangeAlt, FaUser,
  FaBars, FaTimes, FaArrowLeft, FaArrowRight, FaSignOutAlt
} from "react-icons/fa";
import { MdOutlineShoppingBag, MdEmail } from "react-icons/md";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;
const SERVER_URL = import.meta.env.VITE_API_URL;

// The backend stores/returns photoUrl as a relative path like "/uploads/abc.jpg".
// That resolves fine when requested straight from the backend, but the frontend
// runs on a different origin (Vite dev server), so a relative src here tries to
// load from the frontend's own origin and 404s silently — the avatar just shows
// initials instead. Always prefix with the backend host unless it's already a
// full URL.
const buildPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${SERVER_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

// ── Validation ────────────────────────────────────────────────────────────────
// Standard email shape: something@something.tld — rejects missing @, missing
// domain, spaces, and other obviously malformed input before it ever reaches
// the backend.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Letters (incl. accented), spaces, hyphens, and apostrophes only — blocks
// numbers, emojis, and random symbols in the name field. 2–50 chars.
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

const isValidEmail = (value) => EMAIL_REGEX.test(value.trim());
const isValidName = (value) => {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 50 && NAME_REGEX.test(trimmed);
};

const getInitials = (name = "") =>
  name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | "login" | "signup" | "otp"
  const [flowType, setFlowType] = useState("login");

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const otpRefs = useRef([]);

  // Treat "user" and "token" as a single unit. If only one of them is present,
  // the session is inconsistent (e.g. one tab cleared storage mid-session, or a
  // previous bug left a partial write) — clear both rather than trusting half a session.
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const stored = sessionStorage.getItem("user");

    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
    } else if (token || stored) {
      // Partial state — one key present without the other. Clean it up so
      // the navbar and any API calls never disagree about login state again.
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
  }, []);



  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetMessages = () => { setErrorMsg(""); setSuccessMsg(""); };

  const openLogin = () => {
    setEmail(""); setOtpDigits(["","","","","",""]); setName("");
    resetMessages(); setFlowType("login"); setModal("login"); setMenuOpen(false);
  };

  const openSignup = () => {
    setEmail(""); setOtpDigits(["","","","","",""]); setName("");
    resetMessages(); setFlowType("signup"); setModal("signup");
  };

  const closeModal = () => {
    setModal(null);
    setEmail(""); setOtpDigits(["","","","","",""]); setName("");
    resetMessages(); setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    navigate("/");
  };

  const goToProfile = () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate("/profile");
  };

  const getOtpString = () => otpDigits.join("");

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    resetMessages();
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
    if (e.key === "Enter") handleVerifyOtp();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setOtpDigits(newDigits);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleLoginSendOtp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. you@university.edu).");
      return;
    }

    setLoading(true); resetMessages();
    try {
      await axios.post(`${API}/login/send-otp`, { email: trimmedEmail });
      setSuccessMsg("OTP sent! Check your inbox.");
      setModal("otp");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const handleSignupSendOtp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!isValidName(trimmedName)) {
      setErrorMsg("Name should only contain letters, spaces, and hyphens (2–50 characters).");
      return;
    }
    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. you@university.edu).");
      return;
    }

    setLoading(true); resetMessages();
    try {
      await axios.post(`${API}/signup/send-otp`, { name: trimmedName, email: trimmedEmail });
      setSuccessMsg("OTP sent! Check your inbox.");
      setModal("otp");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    const otp = getOtpString();
    if (otp.length < 6) { setErrorMsg("Please enter the complete 6-digit OTP."); return; }
    if (!/^\d{6}$/.test(otp)) { setErrorMsg("OTP must contain only digits."); return; }

    setLoading(true); resetMessages();
    try {
      const endpoint = flowType === "login"
        ? `${API}/login/verify-otp`
        : `${API}/signup/verify-otp`;
      const body = flowType === "login"
        ? { email: email.trim(), otp }
        : { email: email.trim(), otp, name: name.trim() };
      const res = await axios.post(endpoint, body);

      // Write both keys together — never one without the other.
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      setSuccessMsg("Login successful! Welcome.");
      setTimeout(() => closeModal(), 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate("/")}>
          Campus<span>Deals</span>
        </div>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <div className="menu-item" onClick={() => { navigate("/"); setMenuOpen(false); }}>
            <FaHome /><p>Home</p>
          </div>
          <div className="menu-item" onClick={() => { navigate("/buy"); setMenuOpen(false); }}><MdOutlineShoppingBag /><p>Buy</p></div>
          <div className="menu-item" onClick={() => { navigate("/sell"); setMenuOpen(false); }}><FaTag /><p>Sell</p></div>
          <div className="menu-item" onClick={() => { navigate("/borrow"); setMenuOpen(false); }}><FaExchangeAlt /><p>Borrow</p></div>

          {!user ? (
            <div className="login mobile-only" onClick={openLogin}>
              <FaUser /><p>Login</p>
            </div>
          ) : (
            <>
              <div className="menu-item mobile-only" onClick={goToProfile}>
                <FaUser /><p>Profile</p>
              </div>
              <div className="menu-item mobile-only logout-mobile" onClick={handleLogout}>
                <FaSignOutAlt /><p>Log Out</p>
              </div>
            </>
          )}
        </div>

        <div className="navbar-right desktop-only">
          {!user ? (
            <div className="login" onClick={openLogin}>
              <FaUser /><p>Login / Sign Up</p>
            </div>
          ) : (
            <div className="profile-avatar-wrapper" ref={dropdownRef}>
              <div
                className="profile-avatar"
                onClick={() => setDropdownOpen((o) => !o)}
                title={user.name}
              >
                {user.photoUrl
                  ? <img src={buildPhotoUrl(user.photoUrl)} alt={user.name} />
                  : <span>{getInitials(user.name)}</span>
                }
              </div>

              {dropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-item" onClick={goToProfile}>
                    <FaUser className="dropdown-icon" /> Profile
                  </div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <FaSignOutAlt className="dropdown-icon" /> Log Out
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {modal === "login" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2>Welcome Back</h2>
            <p className="modal-subtitle">Enter your email to receive a login code</p>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            {successMsg && <div className="auth-success">{successMsg}</div>}
            <div className="field-label">Email Address</div>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); resetMessages(); }}
                onKeyDown={(e) => e.key === "Enter" && handleLoginSendOtp()}
                autoFocus
              />
            </div>
            <button className="auth-btn" onClick={handleLoginSendOtp} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <>Send OTP <FaArrowRight /></>}
            </button>
            <div className="modal-footer">
              <span>New here?</span>
              <button className="signup-link-btn" onClick={openSignup}>Sign Up</button>
            </div>
          </div>
        </div>
      )}

      {modal === "signup" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2>Join CampusDeals</h2>
            <p className="modal-subtitle">Create your account to get started</p>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            {successMsg && <div className="auth-success">{successMsg}</div>}
            <div className="field-label">Full Name</div>
            <input
              className="plain-input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); resetMessages(); }}
              autoFocus
            />
            <div className="field-label">Email Address</div>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); resetMessages(); }}
                onKeyDown={(e) => e.key === "Enter" && handleSignupSendOtp()}
              />
            </div>
            <button className="auth-btn" onClick={handleSignupSendOtp} disabled={loading}>
              {loading ? <span className="btn-spinner" /> : <>Send OTP <FaArrowRight /></>}
            </button>
            <div className="modal-footer">
              <span>Already have an account?</span>
              <button className="signup-link-btn" onClick={openLogin}>Log in</button>
            </div>
          </div>
        </div>
      )}

      {modal === "otp" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2>{flowType === "login" ? "Welcome Back" : "Join CampusDeals"}</h2>
            <p className="modal-subtitle">Enter the 6-digit code sent to your email</p>
            <div className="email-pill">
              <MdEmail className="input-icon" />
              <span>{email}</span>
            </div>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            {successMsg && <div className="auth-success">{successMsg}</div>}
            <div className="otp-label">Enter Verification Code</div>
            <div className="otp-boxes" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button className="auth-btn" onClick={handleVerifyOtp} disabled={loading}>
              {loading
                ? <span className="btn-spinner" />
                : flowType === "login" ? "Verify & Sign In" : "Verify & Create Account"
              }
            </button>
            <button
              className="back-link"
              onClick={() => {
                setOtpDigits(["","","","","",""]);
                resetMessages();
                setModal(flowType === "login" ? "login" : "signup");
              }}
            >
              <FaArrowLeft />
              {flowType === "login" ? "Back to email" : "Back to details"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;