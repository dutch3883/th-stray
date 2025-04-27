// src/ReportForm.jsx
import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import LocationPicker from './LocationPicker';

export default function ReportForm({ user }) {
  /* ───── form state ───── */
  const [numCats, setNumCats]   = useState('1');
  const [type, setType]         = useState('stray');
  const [phone, setPhone]       = useState('');
  const [images, setImages]     = useState([]);
  const [location, setLocation] = useState(null);

  /* ───── modal toggle ───── */
  const [showPicker, setShowPicker] = useState(false);

  const functions = getFunctions(app);

  /* ───── submit handler ───── */
  const handleSubmit = async () => {
    if (!location) {
      alert('กรุณาเลือกตำแหน่งแมวก่อน');
      return;
    }

    try {
      const createReport = httpsCallable(functions, 'createReport');
      await createReport({
        numberOfCats: numCats,
        type,
        contactPhone: phone,
        images,
        location: {
          lat:  location.lat,
          long: location.lng,
          description: location.description,
        },
      });

      alert('ส่งรายงานสำเร็จ!');
      /* reset form */
      setNumCats('1');
      setType('stray');
      setPhone('');
      setImages([]);
      setLocation(null);
    } catch (err) {
      console.error(err);
      alert('ส่งรายงานไม่สำเร็จ โปรดลองอีกครั้ง');
    }
  };

  /* ───── image -> data-URL preview ───── */
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    Promise.all(
      files.map(
        (f) =>
          new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(f);
          })
      )
    ).then(setImages);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ───── Location picker overlay ───── */}
      {showPicker && (
        <LocationPicker
          initialLocation={location}
          onConfirm={(loc) => {
            setLocation(loc);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* ───── scrollable form ───── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h1 className="text-xl font-bold mb-2">รายงานแมวจร</h1>

        {/* จำนวนแมว */}
        <div>
          <label className="block mb-1 font-medium">จำนวนแมว</label>
          <select
            value={numCats}
            onChange={(e) => setNumCats(e.target.value)}
            className="w-full border rounded p-2"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n}>{n}</option>
            ))}
            <option value="not sure">ไม่แน่ใจ</option>
          </select>
        </div>

        {/* ประเภท */}
        <div>
          <label className="block mb-1 font-medium">ประเภท</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="stray">แมวจร</option>
            <option value="injured">บาดเจ็บ</option>
            <option value="sick">ป่วย</option>
            <option value="kitten">ลูกแมว</option>
          </select>
        </div>

        {/* เบอร์โทร */}
        <div>
          <label className="block mb-1 font-medium">เบอร์โทรติดต่อ</label>
          <input
            type="tel"
            className="w-full border rounded p-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* รูปภาพ */}
        <div>
          <label className="block mb-1 font-medium">รูปภาพ (สูงสุด 3 รูป)</label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`cat-${idx}`}
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        {/* ตำแหน่ง */}
        <div>
          <label className="block mb-1 font-medium">ตำแหน่ง</label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg"
          >
            เลือกตำแหน่งบนแผนที่
          </button>

          {location && (
            <p className="text-sm text-gray-700 mt-1">
              เลือกแล้ว: {location.description || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </p>
          )}
        </div>
      </div>

      {/* ───── sticky footer submit ───── */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg"
        >
          ส่งรายงาน
        </button>
      </div>
    </div>
  );
}
