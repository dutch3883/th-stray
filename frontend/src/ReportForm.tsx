import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { createReport } from './services/apiService';
import { uploadImageAndGetUrl } from './services/storageService';
import LocationPicker from './LocationPicker';

interface Location {
  lat: number;
  lng: number;
  description: string;
}

interface ReportFormProps {
  user: User;
}

export default function ReportForm({ user }: ReportFormProps) {
  /* ───── form state ───── */
  const [numCats, setNumCats] = useState<string>('1');
  const [type, setType] = useState<'stray' | 'injured' | 'sick' | 'kitten'>('stray');
  const [phone, setPhone] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ───── modal toggle ───── */
  const [showPicker, setShowPicker] = useState<boolean>(false);

  /* ───── submit handler ───── */
  const handleSubmit = async (): Promise<void> => {
    if (!location) {
      alert('กรุณาเลือกตำแหน่งแมวก่อน');
      return;
    }

    if (!phone) {
      alert('กรุณากรอกเบอร์โทรติดต่อ');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images first and get their URLs
      const uploadPromises = images.map((file, index) => {
        const path = `reports/${user.uid}/${Date.now()}-${index}.${file.name.split('.').pop()}`;
        return uploadImageAndGetUrl(path, file);
      });

      const uploadedImageUrls = await Promise.all(uploadPromises);

      // Create report with uploaded image URLs and converted number
      await createReport({
        numberOfCats: numCats === 'not sure' ? 0 : parseInt(numCats, 10),
        type,
        contactPhone: phone,
        images: uploadedImageUrls,
        location: {
          lat: location.lat,
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
      setImagePreviewUrls([]);
      setLocation(null);
    } catch (err) {
      console.error(err);
      alert('ส่งรายงานไม่สำเร็จ โปรดลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ───── image handling ───── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);

    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(URL.revokeObjectURL);
    };
  }, [imagePreviewUrls]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ───── Location picker overlay ───── */}
      {showPicker && (
        <LocationPicker
          initialLocation={location}
          onConfirm={(loc: Location) => {
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
            disabled={isSubmitting}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value="not sure">ไม่แน่ใจ</option>
          </select>
        </div>

        {/* ประเภท */}
        <div>
          <label className="block mb-1 font-medium">ประเภท</label>
          <select
            value={type}
            onChange={(e) => {
              const value = e.target.value;
              // Type assertion to tell TypeScript this value is one of the allowed types
              if (value === 'stray' || value === 'injured' || value === 'sick' || value === 'kitten') {
                setType(value);
              }
            }}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
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
            pattern="[0-9]*"
            inputMode="numeric"
            placeholder="0812345678"
            className="w-full border rounded p-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* รูปภาพ */}
        <div>
          <label className="block mb-1 font-medium">รูปภาพ (สูงสุด 3 รูป)</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleImageUpload}
            disabled={isSubmitting}
            className="w-full"
          />
          {imagePreviewUrls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {imagePreviewUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-white py-3 rounded-lg text-lg ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'กำลังส่งรายงาน...' : 'ส่งรายงาน'}
        </button>
      </div>
    </div>
  );
} 