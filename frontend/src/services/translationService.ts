import Papa from 'papaparse';

export type Language = 'en' | 'th';

export interface Translation {
  text_name: string;
  english_translation: string;
  thai_translation: string;
}

export interface ITranslationService {
  getTranslation(textName: string, language: Language): string;
  initialize(): Promise<void>;
}

export class TranslationService implements ITranslationService {
  private translations: Map<string, Translation> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch('/resources/translation.csv');
      const csvText = await response.text();
      
      Papa.parse<Translation>(csvText, {
        header: true,
        complete: (results) => {
          results.data.forEach((row) => {
            if (row.text_name) {
              this.translations.set(row.text_name, row);
            }
          });
          this.initialized = true;
        },
        error: (error: Error) => {
          console.error('Error parsing translation CSV:', error);
          throw new Error('Failed to parse translation CSV');
        }
      });
    } catch (error) {
      console.error('Error loading translation CSV:', error);
      throw new Error('Failed to load translation CSV');
    }
  }

  getTranslation(textName: string, language: Language): string {
    if (!this.initialized) {
      throw new Error('TranslationService not initialized. Call initialize() first.');
    }

    const translation = this.translations.get(textName);
    if (!translation) {
      console.warn(`Translation not found for key: ${textName}`);
      return textName; // Fallback to key name if translation not found
    }

    return language === 'en' 
      ? translation.english_translation 
      : translation.thai_translation;
  }
}

// Create a singleton instance
export const translationService = new TranslationService(); 