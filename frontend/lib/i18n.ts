export type LangKey =
  | "dashboard"
  | "upload_video"
  | "import_youtube"
  | "my_videos"
  | "editor"
  | "subtitle_studio"
  | "clips"
  | "brand_kit"
  | "export"
  | "transcript"
  | "smart_framing"
  | "aspect_ratio"
  | "generate_clips"
  | "viral_score"
  | "settings"
  | "processing"
  | "ready"
  | "error"
  | "delete"
  | "download"
  | "preview"
  | "cancel"
  | "save"
  | "edit"
  | "font"
  | "font_size"
  | "color"
  | "position"
  | "animation"
  | "presets"
  | "background"
  | "outline"
  | "shadow"
  | "language_auto"
  | "language_hindi"
  | "language_english"
  | "language_hinglish"
  | "no_videos"
  | "drop_video"
  | "or_paste_youtube"
  | "uploading"
  | "transcribing"
  | "rendering"
  | "clip_library"
  | "add_clip"
  | "burn_subtitles"
  | "quality";

type Translations = Record<LangKey, string>;

export const t: Record<"en" | "hi", Translations> = {
  en: {
    dashboard: "Dashboard",
    upload_video: "Upload Video",
    import_youtube: "Import from YouTube",
    my_videos: "My Videos",
    editor: "Editor",
    subtitle_studio: "Subtitle Studio",
    clips: "Clips",
    brand_kit: "Brand Kit",
    export: "Export",
    transcript: "Transcript",
    smart_framing: "Smart Framing",
    aspect_ratio: "Aspect Ratio",
    generate_clips: "Generate Viral Clips",
    viral_score: "Viral Score",
    settings: "Settings",
    processing: "Processing…",
    ready: "Ready",
    error: "Error",
    delete: "Delete",
    download: "Download",
    preview: "Preview",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    font: "Font",
    font_size: "Font Size",
    color: "Color",
    position: "Position",
    animation: "Animation",
    presets: "Presets",
    background: "Background",
    outline: "Outline",
    shadow: "Shadow",
    language_auto: "Auto Detect",
    language_hindi: "Hindi",
    language_english: "English",
    language_hinglish: "Hinglish",
    no_videos: "No videos yet. Upload one to get started!",
    drop_video: "Drop your video here or click to browse",
    or_paste_youtube: "Or paste a YouTube URL",
    uploading: "Uploading…",
    transcribing: "Transcribing…",
    rendering: "Rendering…",
    clip_library: "Clip Library",
    add_clip: "Add Clip",
    burn_subtitles: "Burn Subtitles",
    quality: "Quality",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    upload_video: "वीडियो अपलोड करें",
    import_youtube: "YouTube से Import करें",
    my_videos: "मेरे वीडियो",
    editor: "एडिटर",
    subtitle_studio: "सबटाइटल स्टूडियो",
    clips: "क्लिप्स",
    brand_kit: "ब्रांड किट",
    export: "Export करें",
    transcript: "ट्रांसक्रिप्ट",
    smart_framing: "स्मार्ट फ्रेमिंग",
    aspect_ratio: "आस्पेक्ट रेशियो",
    generate_clips: "वायरल क्लिप्स बनाएं",
    viral_score: "वायरल स्कोर",
    settings: "सेटिंग्स",
    processing: "प्रोसेसिंग हो रही है…",
    ready: "तैयार",
    error: "त्रुटि",
    delete: "हटाएं",
    download: "डाउनलोड",
    preview: "प्रिव्यू",
    cancel: "रद्द करें",
    save: "सेव करें",
    edit: "संपादित करें",
    font: "फॉन्ट",
    font_size: "फॉन्ट साइज़",
    color: "रंग",
    position: "पोजीशन",
    animation: "एनिमेशन",
    presets: "प्रीसेट्स",
    background: "बैकग्राउंड",
    outline: "आउटलाइन",
    shadow: "शैडो",
    language_auto: "ऑटो डिटेक्ट",
    language_hindi: "हिंदी",
    language_english: "अंग्रेज़ी",
    language_hinglish: "हिंग्लिश",
    no_videos: "अभी कोई वीडियो नहीं है। शुरू करने के लिए एक अपलोड करें!",
    drop_video: "यहाँ वीडियो छोड़ें या ब्राउज़ करें",
    or_paste_youtube: "या YouTube URL पेस्ट करें",
    uploading: "अपलोड हो रहा है…",
    transcribing: "ट्रांसक्राइब हो रहा है…",
    rendering: "रेंडर हो रहा है…",
    clip_library: "क्लिप लाइब्रेरी",
    add_clip: "क्लिप जोड़ें",
    burn_subtitles: "सबटाइटल बर्न करें",
    quality: "गुणवत्ता",
  },
};

export function useTranslation(lang: "en" | "hi") {
  return (key: LangKey) => t[lang][key] || t.en[key] || key;
}
