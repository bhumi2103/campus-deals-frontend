import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";
import Footer from "./footer";
import "./SellPage.css";
import { FaTag, FaPlus, FaTrash, FaCheckCircle, FaUpload, FaEdit } from "react-icons/fa";
import { MdLocationOn, MdCamera, MdClose } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
const API = `${import.meta.env.VITE_API_URL}/api`;
const CATEGORIES = ["Textbooks","Electronics","Furniture","Gaming","Bikes","Appliances","Sports","Others"];
const CONDITIONS  = ["Brand New","Like New","Good","Fair","Poor"];

const authHeader = () => ({
  headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
});

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

function StepIndicator({ current }) {
  const steps = ["Photos", "Details", "Price"];
  return (
    <div className="sm-stepper">
      {steps.map((label, i) => {
        const n    = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={n}>
            <div className="sm-step">
              <div className={`sm-circle ${done ? "done" : active ? "active" : "pending"}`}>
                {done ? <FaCheckCircle /> : n}
              </div>
              <span className={`sm-label ${active ? "active" : ""}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`sm-line ${current > n ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ListingModal({ onClose, onPublish, onUpdate, editItem }) {
  const isEdit = !!editItem;

  const [step, setStep]     = useState(isEdit ? 2 : 1);
  const [photos, setPhotos] = useState([]);
  const [existingImages, setExistingImages] = useState(editItem?.images || []);
  const [form, setForm]     = useState({
    title:     editItem?.title     || "",
    desc:      editItem?.desc      || "",
    category:  editItem?.category  || "",
    condition: editItem?.condition || "",
  });
  const [price, setPrice]   = useState(editItem?.price?.toString() || "");
  const [location, setLoc]  = useState(editItem?.location || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:""})); };

  const addPhotos = (e) => {
    const total = photos.length + existingImages.length;
    const files = Array.from(e.target.files).slice(0, 5 - total);
    setPhotos(p => [...p, ...files.map(f => ({ file:f, preview:URL.createObjectURL(f) }))]);
  };

  const removeExistingImage = (i) => setExistingImages(imgs => imgs.filter((_,j)=>j!==i));
  const removeNewPhoto      = (i) => setPhotos(p => p.filter((_,j)=>j!==i));

  const validate2 = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required.";
    if (!form.category)     e.category = "Select a category.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validate3 = () => {
    const e = {};
    if (!price || isNaN(price) || Number(price) <= 0) e.price = "Enter a valid price.";
    if (!location.trim()) e.location = "Meetup location is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && validate2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!validate3()) return;
    setSaving(true);
    try {
      const newBase64 = await Promise.all(photos.map(p => toBase64(p.file)));
      const images = [...existingImages, ...newBase64];

      const payload = {
        title:     form.title.trim(),
        desc:      form.desc.trim(),
        category:  form.category,
        condition: form.condition,
        price:     Number(price),
        location:  location.trim(),
        images,
      };

      if (isEdit) {
        const { data } = await axios.put(
          `${API}/items/${editItem._id}`,
          payload,
          authHeader()
        );
        onUpdate(data.item);
      } else {
        const { data } = await axios.post(`${API}/items`, payload, authHeader());
        onPublish(data.item);
      }
      onClose();
    } catch (err) {
      setErrors({ location: err.response?.data?.message || `Failed to ${isEdit ? "update" : "publish"}. Try again.` });
    } finally {
      setSaving(false);
    }
  };

  const totalPhotos = existingImages.length + photos.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sell-modal" onClick={e => e.stopPropagation()}>
        <div className="sell-modal-header">
          <h2>{isEdit ? "Edit Listing" : "Add New Listing"}</h2>
          <button className="sell-modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="sell-modal-stepper"><StepIndicator current={step} /></div>
        <div className="sell-modal-body">

          {step === 1 && (
            <>
              <div className="photos-grid">
                {existingImages.map((src, i) => (
                  <div className="photo-thumb" key={`ex-${i}`}>
                    <img src={src} alt="" />
                    <button className="photo-remove" onClick={() => removeExistingImage(i)}><MdClose /></button>
                  </div>
                ))}
                {photos.map((p, i) => (
                  <div className="photo-thumb" key={`new-${i}`}>
                    <img src={p.preview} alt="" />
                    <button className="photo-remove" onClick={() => removeNewPhoto(i)}><MdClose /></button>
                  </div>
                ))}
                {totalPhotos < 5 && (
                  <div className="photo-add-btn" onClick={() => fileRef.current?.click()}>
                    <MdCamera /><span>Add</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={addPhotos} />
              <p className="sell-hint">Upload up to 5 photos. First photo is the cover.</p>
              <div className="sell-modal-actions">
                <button className="sell-btn-outline" onClick={onClose}>Cancel</button>
                <button className="sell-btn-primary" onClick={next}>Continue</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="sell-field">
                <label>Title</label>
                <input className={`sell-input ${errors.title?"err":""}`} placeholder="What are you selling?"
                  value={form.title} onChange={e=>set("title",e.target.value)} />
                {errors.title && <p className="sell-error">{errors.title}</p>}
              </div>
              <div className="sell-field">
                <label>Description</label>
                <textarea className="sell-textarea" placeholder="Describe your item..." rows={4}
                  value={form.desc} onChange={e=>set("desc",e.target.value)} />
              </div>
              <div className="sell-row">
                <div className="sell-field">
                  <label>Category</label>
                  <select className={`sell-select ${errors.category?"err":""}`} value={form.category} onChange={e=>set("category",e.target.value)}>
                    <option value="">Select</option>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="sell-error">{errors.category}</p>}
                </div>
                <div className="sell-field">
                  <label>Condition</label>
                  <select className="sell-select" value={form.condition} onChange={e=>set("condition",e.target.value)}>
                    <option value="">Select</option>
                    {CONDITIONS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="sell-modal-actions">
                {isEdit
                  ? <button className="sell-btn-outline" onClick={onClose}>Cancel</button>
                  : <button className="sell-btn-outline" onClick={()=>setStep(1)}>Back</button>
                }
                <button className="sell-btn-primary" onClick={next}>Continue</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="sell-field">
                <label>Price (₹)</label>
                <div className={`sell-input-icon-wrap ${errors.price?"err":""}`}>
                  <span className="sell-rupee-icon">₹</span>
                  <input type="number" min="0" step="1" placeholder="0"
                    value={price} onChange={e=>{setPrice(e.target.value);setErrors(er=>({...er,price:""}));}} />
                </div>
                {errors.price && <p className="sell-error">{errors.price}</p>}
              </div>
              <div className="sell-field">
                <label>Meetup Location</label>
                <div className={`sell-input-icon-wrap ${errors.location?"err":""}`}>
                  <MdLocationOn className="sell-input-icon" />
                  <input type="text" placeholder="e.g. West Campus, Library"
                    value={location} onChange={e=>{setLoc(e.target.value);setErrors(er=>({...er,location:""}));}} />
                </div>
                {errors.location && <p className="sell-error">{errors.location}</p>}
              </div>
              <div className="sell-visibility-note">
                <FaCheckCircle className="vis-icon" />
                Your listing will be visible to other students (except you)
              </div>
              <div className="sell-modal-actions">
                <button className="sell-btn-outline" onClick={()=>setStep(2)}>Back</button>
                <button className="sell-btn-primary publish" onClick={handleSubmit} disabled={saving}>
                  {saving
                    ? <span className="btn-spinner" />
                    : isEdit
                      ? <><FaEdit /> Save Changes</>
                      : <><FaUpload /> Publish Listing</>
                  }
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function ListingCard({ item, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/items/${item._id}`, authHeader());
      onDelete(item._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete.");
      setDeleting(false);
    }
  };

  return (
    <div className="listing-card">
      <div className="listing-img-wrap">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.title} />
          : <div className="listing-img-placeholder"><BsBoxSeam /></div>
        }
        {item.category && <span className="listing-badge">{item.category}</span>}
      </div>
      <div className="listing-body">
        <div className="listing-top">
          <div>
            <h3 className="listing-title">{item.title}</h3>
            {item.desc && <p className="listing-desc">{item.desc}</p>}
          </div>
          <div className="listing-actions">
            <button className="listing-edit" onClick={() => onEdit(item)} title="Edit">
              <FaEdit />
            </button>
            <button className="listing-delete" onClick={handleDelete} disabled={deleting} title="Delete">
              <FaTrash />
            </button>
          </div>
        </div>
        <div className="listing-footer">
          <span className="listing-price">₹{item.price}</span>
          <span className="listing-meta">
            {item.condition && <span className="listing-condition">{item.condition}</span>}
            {item.location  && <span className="listing-location"><MdLocationOn />{item.location}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function SellPage() {
  const [listings, setListings]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    const fetchMine = async () => {
      try {
        const token = sessionStorage.getItem("token");
        
        if (!token) {
          setError("🔐 Please log in to view your listings.");
          setLoading(false);
          return;
        }

        // Call the correct protected endpoint
        const { data } = await axios.get(`${API}/items/user/my-items`, authHeader());

        console.log("✅ Fetched user items:", data.items?.length);
        setListings(data.items || []);
        setError("");
      } catch (err) {
        console.error("❌ Fetch error:", err);
        
        if (err.response?.status === 401) {
          setError("🔑 Your session expired. Please log in again.");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
        } else {
          setError(err.response?.data?.message || "Failed to load your listings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMine();
  }, []);

  const handleEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditItem(null);
  };

  const handleUpdate = (updatedItem) => {
    setListings(l => l.map(i => i._id === updatedItem._id ? updatedItem : i));
  };

  return (
    <>
      <Navbar />
      <div className="sell-hero">
        <div className="sell-hero-icon"><FaTag /></div>
        <h1>Sell</h1>
        <p>Turn your unused items into cash. List in minutes, sell to students nearby.</p>
      </div>

      <div className="sell-body">
        <div className="sell-listings-header">
          <div>
            <h2 className="sell-listings-title">My Listings</h2>
            <p className="sell-listings-count">{listings.length} item{listings.length !== 1 ? "s" : ""} listed</p>
          </div>
          <button className="sell-add-btn" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <FaPlus /> Add Listing
          </button>
        </div>

        {loading ? (
          <div className="sell-empty"><p style={{color:"#9ca3af"}}>⏳ Loading...</p></div>
        ) : error ? (
          <div className="sell-empty"><p style={{color:"#ef4444"}}>{error}</p></div>
        ) : listings.length === 0 ? (
          <div className="sell-empty">
            <BsBoxSeam className="sell-empty-icon" />
            <h3>No listings yet</h3>
            <p>Start selling by adding your first item</p>
          </div>
        ) : (
          <div className="sell-listings-grid">
            {listings.map(item => (
              <ListingCard
                key={item._id}
                item={item}
                onDelete={id => setListings(l => l.filter(i => i._id !== id))}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <ListingModal
          onClose={handleModalClose}
          onPublish={item => setListings(l => [item, ...l])}
          onUpdate={handleUpdate}
          editItem={editItem}
        />
      )}
      <Footer />
    </>
  );
}

export default SellPage;