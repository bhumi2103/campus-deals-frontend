import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";
import "./ProfilePage.css";
import { FaUser, FaSignOutAlt, FaSave, FaCamera, FaPhone } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/auth`;
const SERVER_URL = import.meta.env.VITE_API_URL;
// The backend stores/returns photoUrl as a relative path like "/uploads/abc.jpg".
// That resolves fine when requested straight from the backend, but the frontend
// runs on a different origin (Vite dev server on 5174), so a relative src there
// tries to load from the frontend's own origin and 404s silently — which is why
// the photo appears to "disappear" after a refresh. Always prefix with the
// backend host unless it's already a full URL (or a data: URL preview).
const buildPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${SERVER_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

const getInitials = (name = "") =>
  name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }
    try {
      const u = JSON.parse(stored);
      setUser(u);
      setName(u.name || "");
      setPhone(u.phone || "");
      setPhotoPreview(buildPhotoUrl(u.photoUrl));
    } catch (_) {
      navigate("/");
    }
  }, [navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result); // data: URL, used as-is
    reader.readAsDataURL(file);
    setErrorMsg("");
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and common phone formatting characters
    const cleaned = value.replace(/[^\d\-\s+()]/g, "");
    setPhone(cleaned);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber.trim()) return true; // Optional field
    // Remove all non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    return digitsOnly.length >= 10; // At least 10 digits
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Name cannot be empty.");
      return;
    }

    if (!validatePhone(phone)) {
      setErrorMsg("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await axios.post(`${API}/update-profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
      };

      // Store the raw path/URL exactly as the backend returned it — do NOT
      // bake the absolute host into what's persisted, since the backend host
      // may differ between environments (dev/prod). We normalize only when
      // displaying it (see buildPhotoUrl), everywhere it's rendered.
      if (response.data.photoUrl) {
        updated.photoUrl = response.data.photoUrl;
      }

      sessionStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setPhotoFile(null);
      setPhotoPreview(buildPhotoUrl(updated.photoUrl));
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          <h1 className="profile-title">My Profile</h1>

          {/* ── Profile Photo card ── */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Profile Photo</h3>
              <p>Upload a photo so others can recognize you</p>
            </div>
            <div className="photo-row">
              <div className="avatar-lg">
                {photoPreview ? (
                  <img src={photoPreview} alt="profile" />
                ) : (
                  <span>{getInitials(name)}</span>
                )}
              </div>
              <div className="photo-controls">
                <button
                  className="change-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCamera /> Change Photo
                </button>
                <p className="photo-hint">
                  JPG, PNG or GIF (Max. 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>

          {/* ── Personal Information card ── */}
          <div className="profile-card">
            <div className="card-header">
              <h3>Personal Information</h3>
              <p>Update your details so buyers and sellers can contact you</p>
            </div>

            {errorMsg && <div className="profile-error">{errorMsg}</div>}
            {successMsg && <div className="profile-success">{successMsg}</div>}

            <div className="field-group">
              <label className="field-label">
                <FaUser className="label-icon" /> Full Name
              </label>
              <input
                className="profile-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                placeholder="Your full name"
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                <MdEmail className="label-icon" /> Email Address
              </label>
              <input
                className="profile-input readonly"
                type="email"
                value={user.email || ""}
                readOnly
                tabIndex={-1}
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                <FaPhone className="label-icon" /> Phone Number
              </label>
              <input
                className="profile-input"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
                maxLength="20"
              />
              <p className="field-hint">
                {phone.trim() ? "✓ Visible to other users" : "Optional - Leave empty to keep private"}
              </p>
            </div>
          </div>

          {/* ── Actions row ── */}
          <div className="profile-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Log Out
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <span className="btn-spinner-dark" />
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProfilePage;