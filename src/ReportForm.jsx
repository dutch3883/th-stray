// src/ReportForm.jsx  — uses modal LocationPicker instead of route navigation
import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import LocationPicker from './LocationPicker';

export default function ReportForm({ user }) {
  /* ---------------- Local state ---------------- */
  const [numCats, setNumCats] = useState('1');
  const [type, setType]   = useState('stray');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null); // { lat, lng, description }
  const [desc, setDesc] = useState('');           // editable text field for manual entry
  const [showPicker, setShowPicker] = useState(false);

  /* --------------- Firebase ---------------- */
  const functions = getFunctions(app);

  const handleSubmit = async () => {
    if (!location) {
      alert('Please choose a location');
      return;
    }
    const createReport = httpsCallable(functions, 'createReport');
    await createReport({
      numberOfCats: numCats,
      type,
      contactPhone: phone,
      images,
      location: {
        lat: location.lat,
        long: location.lng,
        description: location.description || desc,
      },
    });
    alert('Report submitted!');
    // TODO: clear form or redirect
  };

  /* --------------- Image upload ---------------- */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const readers = files.map(
      (file) =>
        new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then(setImages);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-4 relative">
      {/* Modal overlay */}
      {showPicker && (
        <LocationPicker
          initialLocation={location}
          onConfirm={(loc) => {
            setLocation(loc);
            setDesc(loc.description || '');
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      <div>
        <label>Number of Cats</label>
        <select value={numCats} onChange={(e) => setNumCats(e.target.value)}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n}>{n}</option>
          ))}
          <option value="not sure">Not Sure</option>
        </select>
      </div>

      <div>
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="stray">Stray</option>
          <option value="injured">Injured</option>
          <option value="sick">Sick</option>
          <option value="kitten">Kitten</option>
        </select>
      </div>

      <div>
        <label>Contact Phone</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <label>Images (max 3)</label>
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
      </div>

      <div>
        <label>Location Description</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="เช่น ใต้สะพาน หรือ หน้าร้านสะดวกซื้อใกล้ BTS"
        />
      </div>

      <div>
        <button
          onClick={() => setShowPicker(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Pick Location on Map
        </button>
        {location && (
          <div className="mt-1 text-sm text-gray-600">
            Selected: ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
          </div>
        )}
      </div>

      <div>
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit Report
        </button>
      </div>
    </div>
  );
}
