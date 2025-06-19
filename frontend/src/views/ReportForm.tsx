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
    <div className="flex flex-col min-h-screen bg-gray-50">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${getThemeColor(true, isRescueMode)}`}>
              {t('form.title')}
            </h1>
            <p className="text-gray-600 text-lg">
              {isRescueMode ? t('welcome.rescue') : t('welcome.report')}
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* จำนวนแมว */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.cat.number')}
              </label>
              <select
                value={formData.numberOfCats}
                onChange={(e) => setFormData({ ...formData, numberOfCats: e.target.value === 'not sure' ? 'not sure' : parseInt(e.target.value, 10) })}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                disabled={isSubmitting}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="not sure">{t('form.cat.not_sure')}</option>
              </select>
            </div>

            {/* ประเภท */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.cat.type.label')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CatType })}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                disabled={isSubmitting}
              >
                <option value={CatType.STRAY}>{t('common.cat.type.stray')}</option>
                <option value={CatType.INJURED}>{t('common.cat.type.injured')}</option>
                <option value={CatType.SICK}>{t('common.cat.type.sick')}</option>
                <option value={CatType.KITTEN}>{t('common.cat.type.kitten')}</option>
              </select>
            </div>

            {/* เบอร์โทร */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.contact.phone')}
              </label>
              <input
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="081-234-5678"
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="space-y-2">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.details.label')}
              </label>
              <textarea
                placeholder={t('form.details.placeholder')}
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            {/* สามารถสื่อสารภาษาอังกฤษได้หรือไม่ */}
            <div className="space-y-3">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.contact.english.label')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all duration-200 flex-1">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    name="canSpeakEnglish"
                    value="true"
                    checked={formData.canSpeakEnglish === true}
                    onChange={() => setFormData({ ...formData, canSpeakEnglish: true })}
                    disabled={isSubmitting}
                  />
                  <span className="ml-3 font-medium">{t('form.contact.english.yes')}</span>
                </label>
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all duration-200 flex-1">
                  <input
                    type="radio"
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    name="canSpeakEnglish"
                    value="false"
                    checked={formData.canSpeakEnglish === false}
                    onChange={() => setFormData({ ...formData, canSpeakEnglish: false })}
                    disabled={isSubmitting}
                  />
                  <span className="ml-3 font-medium">{t('form.contact.english.no')}</span>
                </label>
              </div>
            </div>

            {/* รูปภาพ */}
            <div className="space-y-3">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.images.label')}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-all duration-200">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload}
                  disabled={isSubmitting}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {imagePreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`cat-${idx}`}
                        className="w-full h-24 object-cover rounded-lg shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = images.filter((_, index) => index !== idx);
                            const newUrls = imagePreviewUrls.filter((_, index) => index !== idx);
                            setImages(newImages);
                            setImagePreviewUrls(newUrls);
                          }}
                          className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ตำแหน่ง */}
            <div className="space-y-3">
              <label className={`block text-sm font-semibold ${getThemeColor(true, isRescueMode)}`}>
                {t('form.location.label')}
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r ${getSecondaryButtonGradient(isRescueMode)} text-white py-4 rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('form.location.select')}
              </button>

              {location && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 font-medium">
                      {t('form.location.selected')} {location.description || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───── sticky footer submit ───── */}
      <div className={`p-4 border-t bg-white shadow-lg sticky bottom-0`}>
        <div className="max-w-2xl mx-auto">
          {/* Disclaimer */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">i</div>
            <p>{t('form.disclaimer')}</p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('form.submit.loading')}
              </div>
            ) : (
              t('form.submit.button')
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 