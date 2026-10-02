import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";
import "./Borrow.css";
import { MdOutlineShoppingBag, MdSearch, MdSwapHoriz, MdHandshake, MdInfoOutline, MdDelete } from "react-icons/md";
import { FaPlus, FaCamera } from "react-icons/fa";

const API = `${import.meta.env.VITE_API_URL}/api`;

const CATEGORIES = ["Textbooks", "Electronics", "Furniture", "Clothing", "Bikes", "Sports", "Appliances", "Gaming", "Others"];

const isLoggedIn = () => {
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("user");
  // Treat partial state (one present, one missing) as logged out,
  // and clean it up so the navbar and API calls never disagree again.
  if (!token || !user) {
    if (token || user) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
    return false;
  }
  return true;
};

const authHeaders = () => {
  const token = sessionStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

//Item Card
function BorrowItemCard({ item, mode, onDelete }) {
  return (
    <div className="borrow-grid-card">
      <div className="borrow-grid-img-wrap">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} className="borrow-grid-img" />
          : <div className="borrow-img-placeholder"><MdOutlineShoppingBag /></div>
        }
        {!item.available && <span className="borrow-unavailable-badge">Unavailable</span>}
      </div>
      <div className="borrow-grid-body">
        <h3 className="borrow-grid-title">{item.title}</h3>
        {item.desc && <p className="borrow-grid-desc">{item.desc}</p>}
        <div className="borrow-grid-footer">
          <span className="borrow-price">₹{item.price}<span className="per-week">/week</span></span>
          {item.lender?.name && <span className="borrow-seller">by {item.lender.name}</span>}
        </div>

        {mode === "mine" && (
          <>
            {item.requests?.length > 0 && (
              <p className="borrow-request-count">
                {item.requests.filter(r => r.status === "pending").length} pending request
                {item.requests.filter(r => r.status === "pending").length !== 1 ? "s" : ""}
              </p>
            )}
            <button className="borrow-delete-btn" onClick={() => onDelete(item._id)}>
              <MdDelete /> Remove Listing
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Add Listing Modal
function AddListingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", desc: "", category: "", price: "", location: "", duration: "" });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.category) e.category = "Required";
    if (!form.price) e.price = "Required";
    if (!form.location.trim()) e.location = "Required";
    return e;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, photo: "Please select an image file." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: "Image must be under 5MB." }));
      return;
    }

    setErrors(prev => ({ ...prev, photo: undefined }));
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    setServerError("");
    try {
      const payload = { ...form, images: photoBase64 ? [photoBase64] : [] };
      const { data } = await axios.post(`${API}/borrow`, payload, authHeaders());
      setSubmitted(true);
      onCreated?.(data.item);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (f, v) => {
    setForm(prev => ({ ...prev, [f]: v }));
    setErrors(prev => ({ ...prev, [f]: undefined }));
  };

  return (
    <div className="bl-overlay" onClick={onClose}>
      <div className="bl-modal" onClick={e => e.stopPropagation()}>
        <button className="bl-close" onClick={onClose}>✕</button>
        {!submitted ? (
          <>
            <h2 className="bl-title">Add Lend Listing</h2>
            <p className="bl-sub">List an item you're willing to lend to other students.</p>
            {serverError && <p className="bl-error-msg" style={{ marginBottom: 8 }}>{serverError}</p>}

            <label className="bl-label">Item Name <span className="bl-req">*</span></label>
            <input className={`bl-input ${errors.title ? "bl-err" : ""}`} placeholder="e.g. Canon DSLR Camera" value={form.title} onChange={e => update("title", e.target.value)} />
            {errors.title && <span className="bl-error-msg">{errors.title}</span>}

            <label className="bl-label">Photo <span className="bl-optional">(optional)</span></label>
            {photoPreview ? (
              <div className="bl-photo-preview-wrap">
                <img src={photoPreview} alt="Preview" className="bl-photo-preview" />
                <button type="button" className="bl-photo-remove" onClick={removePhoto}>✕</button>
              </div>
            ) : (
              <label className="bl-photo-upload">
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                <FaCamera className="bl-photo-icon" />
                <span>Click to upload a photo</span>
              </label>
            )}
            {errors.photo && <span className="bl-error-msg">{errors.photo}</span>}

            <label className="bl-label">Description</label>
            <textarea className="bl-textarea" placeholder="Condition, accessories, any notes..." value={form.desc} onChange={e => update("desc", e.target.value)} rows={3} />

            <div className="bl-row">
              <div className="bl-col">
                <label className="bl-label">Category <span className="bl-req">*</span></label>
                <select className={`bl-select ${errors.category ? "bl-err" : ""}`} value={form.category} onChange={e => update("category", e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="bl-error-msg">{errors.category}</span>}
              </div>
              <div className="bl-col">
                <label className="bl-label">Price/week (₹) <span className="bl-req">*</span></label>
                <input className={`bl-input ${errors.price ? "bl-err" : ""}`} type="number" placeholder="0" value={form.price} onChange={e => update("price", e.target.value)} />
                {errors.price && <span className="bl-error-msg">{errors.price}</span>}
              </div>
            </div>

            <label className="bl-label">Pickup Location <span className="bl-req">*</span></label>
            <input className={`bl-input ${errors.location ? "bl-err" : ""}`} placeholder="e.g. Hostel Block B" value={form.location} onChange={e => update("location", e.target.value)} />
            {errors.location && <span className="bl-error-msg">{errors.location}</span>}

            <label className="bl-label">Max Duration</label>
            <input className="bl-input" placeholder="e.g. Up to 7 days" value={form.duration} onChange={e => update("duration", e.target.value)} />

            <button className="bl-submit" onClick={handleSubmit} disabled={submitting}>
              <FaPlus /> {submitting ? "Posting..." : "Post Listing"}
            </button>
          </>
        ) : (
          <div className="bl-success">
            <div className="bl-success-icon">✓</div>
            <h2>Listing Posted!</h2>
            <p>Your item is now visible to students looking to borrow.</p>
            <button className="bl-submit" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page 
function BorrowPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("borrow");
  const [search, setSearch] = useState("");
  const [checkedCats, setCheckedCats] = useState([]);
  const [sort, setSort] = useState("newest");
  const [showModal, setShowModal] = useState(false);

  const [borrowItems, setBorrowItems] = useState([]);
  const [lendListings, setLendListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mineLoading, setMineLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Browsing the Borrow tab is open to everyone — fetch with category/search/sort as query params ──
  // Backend only supports a single category filter, so when multiple checkboxes are
  // selected we fetch all and refine client-side; with 0 or 1 selected we filter server-side.
  const fetchBorrowItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { sort };
      if (search.trim()) params.search = search.trim();
      if (checkedCats.length === 1) params.category = checkedCats[0];

      const config = authHeaders(); // include token if present, so user's own items are excluded
      const { data } = await axios.get(`${API}/borrow`, { ...config, params });
      setBorrowItems(data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, sort, checkedCats]);

  const fetchMyListings = useCallback(async () => {
    if (!isLoggedIn()) return;
    setMineLoading(true);
    try {
      const { data } = await axios.get(`${API}/borrow/mine`, authHeaders());
      setLendListings(data.items);
    } catch (err) {
      // Silently ignore — the Lend tab will just show an empty state.
    } finally {
      setMineLoading(false);
    }
  }, []);

  // Refetch borrow items whenever search / sort / category changes
  useEffect(() => {
    fetchBorrowItems();
  }, [fetchBorrowItems]);

  // Load "my lend listings" once, only if logged in
  useEffect(() => {
    fetchMyListings();
  }, [fetchMyListings]);

  const toggleCat = (cat) => {
    setCheckedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const requireAuth = (action) => {
    if (!isLoggedIn()) {
      navigate("/", { state: { authRequired: true } });
      return false;
    }
    action();
    return true;
  };

  const handleDeleteListing = async (id) => {
    try {
      await axios.delete(`${API}/borrow/${id}`, authHeaders());
      setLendListings(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete listing.");
    }
  };

  const handleListingCreated = (item) => {
    setLendListings(prev => [item, ...prev]);
  };

  // Client-side refinement for: (a) multi-category selection beyond what the API supports,
  // and (b) instant feedback while typing before the debounce-free fetch above resolves.
  const filtered = borrowItems.filter(item => {
    const matchCat = checkedCats.length <= 1 || checkedCats.includes(item.category);
    return matchCat;
  });

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <div className="bp-hero">
        <div className="bp-hero-icon">
          <MdSwapHoriz />
        </div>
        <h1 className="bp-hero-title">Borrow</h1>
        <p className="bp-hero-sub">
          Rent items you need temporarily, or lend out your own. Save money,<br />
          reduce waste, build community.
        </p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="bp-body">
        <div className="bp-tab-switcher">
          <button
            className={`bp-tab ${tab === "borrow" ? "bp-tab--active" : ""}`}
            onClick={() => setTab("borrow")}
          >
            <MdSwapHoriz className="bp-tab-icon" /> Borrow
          </button>
          <button
            className={`bp-tab ${tab === "lend" ? "bp-tab--active" : ""}`}
            onClick={() => setTab("lend")}
          >
            <MdHandshake className="bp-tab-icon" /> Lend
          </button>
        </div>

        {error && <p className="bl-error-msg" style={{ marginBottom: 16 }}>{error}</p>}

        {/* ──────────────── BORROW TAB (open to everyone) ──────────────── */}
        {tab === "borrow" && (
          <>
            {/* Info Banner */}
            <div className="bp-info-banner">
              <MdInfoOutline className="bp-info-icon" />
              <div>
                <strong>How borrowing works</strong>
                <p>Prices shown are per week. Contact the owner to arrange pickup and return. A small deposit may be required.</p>
              </div>
            </div>

            {/* Search */}
            <div className="bp-search-row">
              <div className="bp-search-box">
                <MdSearch className="bp-search-icon" />
                <input
                  type="text"
                  placeholder="Search items to borrow..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bp-search-input"
                />
              </div>
            </div>

            {/* Sidebar + Grid */}
            <div className="bp-content-layout">
              {/* Sidebar */}
              <aside className="bp-sidebar">
                <h4 className="bp-sidebar-title">Category</h4>
                <div className="bp-cat-list">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="bp-cat-item">
                      <input
                        type="checkbox"
                        checked={checkedCats.includes(cat)}
                        onChange={() => toggleCat(cat)}
                        className="bp-checkbox"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                  {checkedCats.length > 0 && (
                    <button className="bp-clear-cats" onClick={() => setCheckedCats([])}>
                      Clear categories
                    </button>
                  )}
                </div>
              </aside>

              {/* Items */}
              <div className="bp-items-area">
                <div className="bp-items-header">
                  <span className="bp-count">
                    Showing <strong>{filtered.length}</strong> items available
                  </span>
                  <select className="bp-sort" value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="newest">Sort by: Newest</option>
                    <option value="oldest">Sort by: Oldest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {loading ? (
                  <div className="bp-empty">
                    <p>Loading items...</p>
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="bp-grid">
                    {filtered.map(item => (
                      <BorrowItemCard
                        key={item._id}
                        item={item}
                        mode="borrow"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bp-empty">
                    <MdSearch size={44} />
                    <p>
                      {borrowItems.length === 0
                        ? "No items available to borrow yet."
                        : "No items found. Try adjusting your filters."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ──────────────── LEND TAB ──────────────── */}
        {tab === "lend" && (
          <div className="bp-lend-tab">
            {!isLoggedIn() ? (
              <div className="bp-lend-empty">
                <div className="bp-lend-empty-icon">
                  <MdHandshake />
                </div>
                <h3>Log in to lend an item</h3>
                <p>Create an account or log in to list items and manage your lend listings.</p>
                <button
                  className="bp-add-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate("/", { state: { authRequired: true } })}
                >
                  Log In / Sign Up
                </button>
              </div>
            ) : (
              <>
                <div className="bp-lend-header">
                  <div>
                    <h2 className="bp-lend-title">My Lend Listings</h2>
                    <p className="bp-lend-sub">Items you're offering up for others to rent.</p>
                  </div>
                  <button className="bp-add-btn" onClick={() => setShowModal(true)}>
                    <FaPlus /> Add Listing
                  </button>
                </div>

                {mineLoading ? (
                  <p>Loading your listings...</p>
                ) : lendListings.length === 0 ? (
                  <div className="bp-lend-empty">
                    <div className="bp-lend-empty-icon">
                      <MdHandshake />
                    </div>
                    <h3>No lend listings yet</h3>
                    <p>Share something you own and earn while helping others.</p>
                  </div>
                ) : (
                  <div className="bp-grid">
                    {lendListings.map(item => (
                      <BorrowItemCard
                        key={item._id}
                        item={item}
                        mode="mine"
                        onDelete={handleDeleteListing}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <AddListingModal
          onClose={() => setShowModal(false)}
          onCreated={handleListingCreated}
        />
      )}

      <Footer />
    </>
  );
}

export default BorrowPage;