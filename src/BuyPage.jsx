import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";
import "./BuyPage.css";
import {
  MdOutlineShoppingBag,
  MdLocationOn,
  MdSearch,
  MdClose,
  MdChat,
  MdPhone,
  MdEmail,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { FaHeart, FaRegHeart, FaTag, FaUser, FaWhatsapp } from "react-icons/fa";

const API = `${import.meta.env.VITE_API_URL}/api`;
const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Furniture",
  "Gaming",
  "Bikes",
  "Appliances",
  "Sports",
  "Others",
];

const BADGE_COLORS = {
  Textbooks: { bg: "#e0f2fe", color: "#0369a1" },
  Electronics: { bg: "#ede9fe", color: "#7c3aed" },
  Furniture: { bg: "#fef9c3", color: "#a16207" },
  Gaming: { bg: "#fce7f3", color: "#be185d" },
  Transport: { bg: "#dcfce7", color: "#15803d" },
  Appliances: { bg: "#ffedd5", color: "#c2410c" },
  Sports: { bg: "#f0fdf4", color: "#166534" },
  Others: { bg: "#f3f4f6", color: "#374151" },
};

function ItemCard({ item, onClick }) {
  const [liked, setLiked] = useState(false);
  const badge = BADGE_COLORS[item.category] || { bg: "#f3f4f6", color: "#374151" };
  const hasMultipleImages = item.images && item.images.length > 1;
  const hasPhone = item.seller?.phone && item.seller.phone.trim() !== "";

  return (
    <div className="item-card" onClick={() => onClick(item)}>
      <div className="item-image-wrap">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="item-image" />
        ) : (
          <div className="item-image-placeholder">
            <MdOutlineShoppingBag />
          </div>
        )}
        {item.category && (
          <span className="item-badge" style={{ background: badge.bg, color: badge.color }}>
            {item.category}
          </span>
        )}
        {hasMultipleImages && (
          <span className="item-image-count">
            📷 {item.images.length}
          </span>
        )}
        <button
          className="item-heart"
          onClick={(e) => {
            e.stopPropagation();
            setLiked((l) => !l);
          }}
          aria-label="Wishlist"
        >
          {liked ? <FaHeart style={{ color: "#ef4444" }} /> : <FaRegHeart />}
        </button>
      </div>
      <div className="item-body">
        <h3 className="item-title">{item.title}</h3>
        {(item.desc || item.description) && (
          <p className="item-desc">{item.desc || item.description}</p>
        )}
        <div className="item-footer">
          <span className="item-price">₹{item.price}</span>
          <span className="item-location">
            {item.location && (
              <>
                <MdLocationOn /> {item.location}
              </>
            )}
          </span>
        </div>
        <div className="item-details-row">
          {item.seller?.name && <p className="item-seller">by {item.seller.name}</p>}
          {hasPhone && (
            <p className="item-phone">
              📞 {item.seller.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose }) {
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showContact, setShowContact] = useState(false);

  if (!item) return null;

  const images =
    item.images && item.images.length > 0
      ? item.images
      : [
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        ];

  const badge = BADGE_COLORS[item.category] || { bg: "#dbeafe", color: "#2563eb" };

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImg = (e) => {
    e.stopPropagation();
    setCurrentImgIdx((prev) => (prev + 1) % images.length);
  };

  const sellerProfile = item.seller || {};
  const sellerPhone = sellerProfile.phone && sellerProfile.phone.trim() ? sellerProfile.phone : null;
  const sellerEmail = sellerProfile.email || "seller@campus.edu";
  const sellerName = sellerProfile.name || "Campus Student";
  const sellerAvatar = sellerProfile.photoUrl || null;
  const whatsappNum = sellerPhone ? sellerPhone.replace(/\D/g, "") : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-left">
          <div className="modal-image-container">
            <img
              src={images[currentImgIdx]}
              alt={item.title}
              className="modal-product-img"
            />

            {images.length > 1 && (
              <>
                <button
                  className="carousel-btn prev"
                  onClick={handlePrevImg}
                  aria-label="Previous image"
                >
                  <MdChevronLeft />
                </button>
                <button
                  className="carousel-btn next"
                  onClick={handleNextImg}
                  aria-label="Next image"
                >
                  <MdChevronRight />
                </button>

                <div className="carousel-dots">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === currentImgIdx ? "active" : ""}`}
                      onClick={() => setCurrentImgIdx(idx)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Image ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="carousel-counter">
                  {currentImgIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="modal-right">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <MdClose />
          </button>

          <div className="modal-content-wrapper">
            {item.category && (
              <div className="modal-category-wrap">
                <span
                  className="modal-category-badge"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {item.category}
                </span>
              </div>
            )}

            <h2 className="modal-item-title">{item.title}</h2>
            <div className="modal-item-price">₹{item.price}</div>

            <p className="modal-item-desc">
              {item.desc || item.description || "No description provided."}
            </p>

            <div className="modal-meta-list">
              <div className="modal-meta-row">
                <FaTag className="modal-meta-icon" />
                <span className="modal-meta-label">Condition:</span>
                <span className="modal-cond-badge">{item.condition || "Like New"}</span>
              </div>

              <div className="modal-meta-row">
                <MdLocationOn className="modal-meta-icon" />
                <span className="modal-meta-label">Location:</span>
                <span className="modal-meta-value">{item.location || "On Campus"}</span>
              </div>

              <div className="modal-meta-row">
                <FaUser className="modal-meta-icon" />
                <span className="modal-meta-label">Seller:</span>
                <span className="modal-meta-value">{sellerName}</span>
              </div>
            </div>

            <div className="modal-action-row">
              <button
                className="modal-contact-btn"
                onClick={() => setShowContact(!showContact)}
              >
                <MdChat className="btn-icon" />
                <span>{showContact ? "Hide Contact" : "Contact"}</span>
              </button>

              <button
                className="modal-heart-btn"
                onClick={() => setLiked(!liked)}
                aria-label="Wishlist"
              >
                {liked ? <FaHeart style={{ color: "#ef4444" }} /> : <FaRegHeart />}
              </button>
            </div>

            {showContact && (
              <div className="seller-contact-drawer">
                <div className="seller-profile-header">
                  <div className="seller-avatar-wrap">
                    {sellerAvatar ? (
                      <img src={sellerAvatar} alt={sellerName} className="seller-avatar-img" />
                    ) : (
                      <div className="seller-avatar-placeholder">
                        {sellerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="seller-name-info">
                    <h4 className="seller-profile-name">{sellerName}</h4>
                    <p className="seller-status">Campus Student</p>
                  </div>
                </div>

                <div className="contact-info-row">
                  <MdPhone className="contact-icon" />
                  <div className="contact-details">
                    <span className="contact-label">Phone</span>
                    {sellerPhone ? (
                      <a href={`tel:${sellerPhone}`} className="contact-link">
                        {sellerPhone}
                      </a>
                    ) : (
                      <span className="contact-unavailable">Not shared</span>
                    )}
                  </div>
                </div>

                <div className="contact-info-row">
                  <MdEmail className="contact-icon" />
                  <div className="contact-details">
                    <span className="contact-label">Email</span>
                    <a href={`mailto:${sellerEmail}`} className="contact-link">
                      {sellerEmail}
                    </a>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${whatsappNum}?text=Hi%20${encodeURIComponent(
                    sellerName
                  )},%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(
                    item.title
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-chat-btn"
                  style={{ display: sellerPhone ? "flex" : "none" }}
                >
                  <FaWhatsapp /> Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Re-read category/search from the URL any time it changes — not just on
  // first mount. This covers navigating here again from Home/Categories/Hero
  // while already on /buy, since React Router won't remount the component
  // for a same-route navigation.
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    const urlSearch = searchParams.get("search") || "";

    setCategory(CATEGORIES.includes(urlCategory) ? urlCategory : "All");
    setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        // Fetch all items EXCEPT user's own items
        // Backend will filter out user's own items if logged in
        const { data } = await axios.get(`${API}/items`, config);

        console.log("📦 Fetched items:", data.items?.length);
        setItems(data.items || []);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching items:", err);
        setError("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Keep the URL in sync when the user changes category via the pills,
  // so refreshing or sharing the link preserves the filter.
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "All") {
        next.delete("category");
      } else {
        next.set("category", cat);
      }
      return next;
    });
  };

  // Same idea for the search box: typing here updates the URL too, so the
  // filter survives a refresh or a shared link, just like category does.
  const handleSearchChange = (value) => {
    setSearch(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value.trim() === "") {
        next.delete("search");
      } else {
        next.set("search", value);
      }
      return next;
    });
  };

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    const matchSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      (item.desc || item.description)?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <div className="buy-hero">
        <div className="buy-hero-icon">
          <MdOutlineShoppingBag />
        </div>
        <h1>Buy</h1>
        <p>
          Find amazing deals on textbooks, electronics, furniture, and more from students near
          you.
        </p>
      </div>

      <div className="buy-body">
        <div className="buy-search-wrap">
          <MdSearch className="search-icon" />
          <input
            className="buy-search"
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="buy-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="buy-loading">
            <div className="buy-spinner" />
            <p>Loading items...</p>
          </div>
        ) : error ? (
          <div className="buy-empty">
            <MdSearch size={48} />
            <p style={{ color: "#ef4444" }}>{error}</p>
          </div>
        ) : (
          <>
            <p className="buy-results-count">
              Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.length > 0 ? (
              <div className="buy-grid">
                {filtered.map((item) => (
                  <ItemCard
                    key={item._id || item.id}
                    item={item}
                    onClick={(sel) => setSelectedItem(sel)}
                  />
                ))}
              </div>
            ) : (
              <div className="buy-empty">
                <MdSearch size={48} />
                <p>
                  {search ? (
                    <>
                      No items found for "<strong>{search}</strong>"
                    </>
                  ) : (
                    "No items available in this category yet."
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <Footer />
    </>
  );
}

export default BuyPage;