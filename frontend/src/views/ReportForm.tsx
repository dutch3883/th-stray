import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {api} from '../services/apiService';
import { uploadImageAndGetUrl } from '../services/storageService';
import LocationPicker from '../LocationPicker';
import { CatType } from '../types/report';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      alert(t('form.validation.location'));
      return;
    }
    if (formData.canSpeakEnglish === null) {
      alert(t('form.validation.english'));
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

      alert(t('form.submit.success'));
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
      alert(t('form.submit.error'));
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
        <h1 className={`text-xl font-bold mb-2 ${getThemeColor(true, isRescueMode)}`}>
          {t('form.title')}
        </h1>

        {/* จำนวนแมว */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.cat.number')}
          </label>
          <select
            value={formData.numberOfCats}
            onChange={(e) => setFormData({ ...formData, numberOfCats: e.target.value === 'not sure' ? 'not sure' : parseInt(e.target.value, 10) })}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value="not sure">{t('form.cat.not_sure')}</option>
          </select>
        </div>

        {/* ประเภท */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.cat.type.label')}
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CatType })}
            className="w-full border rounded p-2"
            disabled={isSubmitting}
          >
            <option value={CatType.STRAY}>{t('common.cat.type.stray')}</option>
            <option value={CatType.INJURED}>{t('common.cat.type.injured')}</option>
            <option value={CatType.SICK}>{t('common.cat.type.sick')}</option>
            <option value={CatType.KITTEN}>{t('common.cat.type.kitten')}</option>
          </select>
        </div>

        {/* เบอร์โทร */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.contact.phone')}
          </label>
          <input
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            placeholder={t('form.contact.phone')}
            className="w-full border rounded p-2"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        {/* รายละเอียดเพิ่มเติม */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.details.label')}
          </label>
          <textarea
            placeholder={t('form.details.placeholder')}
            className="w-full border rounded p-2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {/* สามารถสื่อสารภาษาอังกฤษได้หรือไม่ */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.contact.english.label')}
          </label>
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
              <span className="ml-2">{t('form.contact.english.yes')}</span>
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
              <span className="ml-2">{t('form.contact.english.no')}</span>
            </label>
          </div>
        </div>

        {/* รูปภาพ */}
        <div>
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.images.label')}
          </label>
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
          <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>
            {t('form.location.label')}
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r ${getSecondaryButtonGradient(isRescueMode)} text-white py-2 rounded-lg`}
          >
            {t('form.location.select')}
          </button>

          {location && (
            <p className={`text-sm mt-1 ${getThemeColor(true, isRescueMode, 700)}`}>
              {t('form.location.selected')} {location.description || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
            </p>
          )}
        </div>
      </div>

      {/* ───── sticky footer submit ───── */}
      <div className={`p-4 border-t ${getThemeBg(isRescueMode)} sticky bottom-0`}>
        {/* Disclaimer */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold">i</div>
          <p>{t('form.disclaimer')}</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white py-3 rounded-lg text-lg ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? t('form.submit.loading') : t('form.submit.button')}
        </button>
      </div>
    </div>
  );
} 