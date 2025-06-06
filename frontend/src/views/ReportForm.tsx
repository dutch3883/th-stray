import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {api} from '../services/apiService';
import { uploadImageAndGetUrl } from '../services/storageService';
import LocationPicker from '../LocationPicker';
import { CatType } from '../types/report';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColor, getThemeBg, getButtonGradient, getSecondaryButtonGradient } from '../utils/themeUtils';

interface Location {
  lat: number;
  lng: number;
  description: string;
}

interface ReportFormProps {
  user: User;
}

export default function ReportForm({ user }: ReportFormProps) {
  const { isRescueMode } = useTheme();
  /* ───── form state ───── */
  const [formData, setFormData] = useState<{
    type: CatType;
    numberOfCats: number | 'not sure';
    contactPhone: string;
    description: string;
    canSpeakEnglish: boolean | null;
  }>({
    type: CatType.STRAY,
    numberOfCats: 1,
    contactPhone: '',
    description: '',
    canSpeakEnglish: null,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ───── modal toggle ───── */
  const [showPicker, setShowPicker] = useState<boolean>(false);

  /* ───── submit handler ───── */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!location) {
      alert('กรุณาระบุตำแหน่งที่พบแมว');
      return;
    }
    if (formData.canSpeakEnglish === null) {
      alert('กรุณาระบุความสามารถในการสื่อสารภาษาอังกฤษ');
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
      await api.createReport({
        numberOfCats: formData.numberOfCats === 'not sure' ? 0 : formData.numberOfCats,
        type: formData.type,
        contactPhone: formData.contactPhone,
        description: formData.description || undefined,
        images: uploadedImageUrls,
        location: {
          lat: location.lat,
          long: location.lng,
          description: location.description,
        },
        canSpeakEnglish: formData.canSpeakEnglish,
      });

      alert('ส่งรายงานสำเร็จ!');
      /* reset form */
      setFormData({
        type: CatType.STRAY,
        numberOfCats: 1,
        contactPhone: '',
        description: '',
        canSpeakEnglish: null,
      });
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
        <h1 className={`text-xl font-bold mb-2 ${getThemeColor(true, isRescueMode)}`}>รายงานแมวจร</h1>

        {/* จำนวนแมว */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>จำนวนแมว</label>
          <select
            value={formData.numberOfCats}
            onChange={(e) => setFormData({ ...formData, numberOfCats: e.target.value === 'not sure' ? 'not sure' : parseInt(e.target.value, 10) })}
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
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>ประเภท</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CatType })}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
          >
            <option value={CatType.STRAY}>แมวจร</option>
            <option value={CatType.INJURED}>บาดเจ็บ</option>
            <option value={CatType.SICK}>ป่วย</option>
            <option value={CatType.KITTEN}>ลูกแมว</option>
          </select>
        </div>

        {/* เบอร์โทร */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>เบอร์โทรติดต่อ</label>
          <input
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            placeholder="0812345678"
            className="w-full border rounded p-2"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        {/* รายละเอียดเพิ่มเติม */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
          <textarea
            placeholder="เช่น ลักษณะเด่นของแมว, สภาพแวดล้อม, ฯลฯ"
            className="w-full border rounded p-2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {/* สามารถสื่อสารภาษาอังกฤษได้หรือไม่ */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>สามารถสื่อสารภาษาอังกฤษได้หรือไม่? *</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="canSpeakEnglish"
                value="true"
                checked={formData.canSpeakEnglish === true}
                onChange={() => setFormData({ ...formData, canSpeakEnglish: true })}
                disabled={isSubmitting}
              />
              <span className="ml-2">ได้</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="canSpeakEnglish"
                value="false"
                checked={formData.canSpeakEnglish === false}
                onChange={() => setFormData({ ...formData, canSpeakEnglish: false })}
                disabled={isSubmitting}
              />
              <span className="ml-2">ไม่ได้</span>
            </label>
          </div>
        </div>

        {/* รูปภาพ */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>รูปภาพ (สูงสุด 3 รูป)</label>
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
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>ตำแหน่ง</label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r ${getSecondaryButtonGradient(isRescueMode)} text-white py-2 rounded-lg`}
          >
            เลือกตำแหน่งบนแผนที่
          </button>

          {location && (
            <p className={`text-sm mt-1 ${getThemeColor(true, isRescueMode, 700)}`}>
              เลือกแล้ว: {location.description || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </p>
          )}
        </div>
      </div>

      {/* ───── sticky footer submit ───── */}
      <div className={`p-4 border-t ${getThemeBg(isRescueMode)} sticky bottom-0`}>
        {/* Disclaimer */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold">i</div>
          <p>We do our best to help every reported case of stray or injured cats. However, we cannot guarantee assistance in all situations due to limited resources. Thank you for your understanding.</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white py-3 rounded-lg text-lg ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'กำลังส่งรายงาน...' : 'ส่งรายงาน'}
        </button>
      </div>
    </div>
  );
} 