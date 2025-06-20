import React, { useState } from 'react';
import { Report, CatType } from '../types/report';
import { api } from '../services/apiService';
import { uploadImageAndGetUrl } from '../services/storageService';
import LocationPicker from '../LocationPicker';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      alert(t('modal.edit_report.error'));
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
        <h2 className={`text-xl font-bold mb-4 ${getThemeColor(true, isRescueMode)}`}>{t('modal.edit_report.title')}</h2>

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
          {/* Number of Cats */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.cat.number')}</label>
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

          {/* Type */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.cat.type.label')}</label>
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

          {/* Contact Phone */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.contact.phone')}</label>
            <input
              type="tel"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder={t('form.contact.phone_placeholder')}
              className="w-full border rounded p-2"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          {/* Additional Details */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.details.label')}</label>
            <textarea
              placeholder={t('form.details.placeholder')}
              className="w-full border rounded p-2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* English Communication */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.contact.english.label')}</label>
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
                />
                <span className="ml-2">{t('form.contact.english.no')}</span>
              </label>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.images.label')}</label>
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
                    alt={t('form.images.alt_text')}
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className={`block mb-1 font-medium ${getThemeColor(true, isRescueMode)}`}>{t('form.location.label')}</label>
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

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 bg-gradient-to-r ${getButtonGradient(isRescueMode)} text-white rounded ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? t('modal.edit_report.updating') : t('modal.edit_report.save')}
          </button>
        </div>
      </div>
    </div>
  );
}; 