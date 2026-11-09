export type ToneType = 'cam_dong' | 'hai_huoc' | 'trang_trong' | 'tho_luc_bat' | 'tuoi_hoc_tro';

export type CardThemeId = 'chalkboard' | 'vintage_parchment' | 'lotus_red' | 'warm_sunlight';

export interface GreetingFormData {
  teacher_name: string;
  subject: string;
  tone: ToneType;
  sender_name: string;
  class_name: string;
  memory: string;
}

export interface GreetingResult {
  card_title: string;
  greeting_text: string;
  short_version: string;
  image_prompt: string;
  email_subject: string;
  email_body: string;
}

export interface CardTheme {
  id: CardThemeId;
  name: string;
  description: string;
  badge: string;
  primaryColor: string;
  textColor: string;
  accentColor: string;
}
