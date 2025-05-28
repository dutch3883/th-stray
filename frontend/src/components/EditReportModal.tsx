import React, { useState } from 'react';
import { Report, CatType } from '../types/report';
import { api } from '../services/apiService';
import { uploadImageAndGetUrl } from '../services/storageService';
import LocationPicker from '../LocationPicker';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColor, getThemeBg, getButtonGradient, getSecondaryButtonGradient } from '../utils/themeUtils';

interface Location {
  lat: number;
  lng: number;
  description: string;
}

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  onReportUpdated: () => void;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onReportUpdated,
}) => {
  console.log('EditReportModal rendered with props:', { isOpen, report });
  const { isRescueMode } = useTheme();
  const [formData, setFormData] = useState<{
    numberOfCats: number;
    type: CatType;
    contactPhone: string;
    description: string;
    canSpeakEnglish: boolean;
  }>({
    numberOfCats: report.numberOfCats,
    type: report.type,
    contactPhone: report.contactPhone,
    description: report.description || '',
    canSpeakEnglish: report.canSpeakEnglish,
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(report.images);
  const [location, setLocation] = useState<Location>({
    lat: report.location.lat,
    lng: report.location.long,
    description: report.location.description,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.updateReport({
        reportId: report.id,
        data: {
          numberOfCats: formData.numberOfCats,
          type: formData.type,
          contactPhone: formData.contactPhone,
          description: formData.description || undefined,
          images: report.images,
          location: report.location,
          canSpeakEnglish: formData.canSpeakEnglish,
        },
      });
      onClose();
      onReportUpdated();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);

    // Create preview URLs
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(previewUrls);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className={`text-xl font-bold mb-4 ${getThemeColor(true, isRescueMode)}`}>แก้ไขรายงาน</h2>

        {/* Location picker overlay */}
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

        <div className="space-y-4">
          {/* จำนวนแมว */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>จำนวนแมว</label>
            <select
              value={formData.numberOfCats.toString()}
              onChange={(e) => setFormData({ ...formData, numberOfCats: parseInt(e.target.value, 10) })}
              className="w-full border rounded p-2"
              disabled={isSubmitting}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
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
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>สามารถสื่อสารภาษาอังกฤษได้หรือไม่?</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="canSpeakEnglish"
                  value="true"
                  checked={formData.canSpeakEnglish === true}
                  onChange={() => setFormData({ ...formData, canSpeakEnglish: true })}
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

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white rounded ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข'}
          </button>
        </div>
      </div>
    </div>
  );
}; 