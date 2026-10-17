import mathIcon from './images/math_subject_icon_1789719008364.jpg';
import scienceIcon from './images/science_subject_icon_1789719025860.jpg';
import socialIcon from './images/social_subject_icon_1789719045170.jpg';
import englishIcon from './images/english_subject_icon_1789719056461.jpg';
import hindiIcon from './images/hindi_subject_icon_1789719069300.jpg';

export interface SubjectVisual {
  key: string;
  name: string;
  image: string;
  alt: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    glow: string;
  };
  highlightTopics: string[];
}

export const SUBJECT_VISUALS: Record<string, SubjectVisual> = {
  mathematics: {
    key: 'mathematics',
    name: 'Mathematics',
    image: mathIcon,
    alt: 'CBSE Class 10 Mathematics 3D Icon with Compass, Ruler and Geometry',
    colorScheme: {
      bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
      glow: 'shadow-blue-500/10',
    },
    highlightTopics: ['Real Numbers', 'Polynomials', 'Triangles', 'Trigonometry', 'Statistics'],
  },
  science: {
    key: 'science',
    name: 'Science',
    image: scienceIcon,
    alt: 'CBSE Class 10 Science 3D Icon with Laboratory Glassware and Atom Orbit',
    colorScheme: {
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      glow: 'shadow-emerald-500/10',
    },
    highlightTopics: ['Chemical Reactions', 'Life Processes', 'Light & Electricity', 'Magnetic Effects'],
  },
  social_science: {
    key: 'social_science',
    name: 'Social Science',
    image: socialIcon,
    alt: 'CBSE Class 10 Social Science 3D Icon with Terrestrial Globe, Scroll, and Pillar',
    colorScheme: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
      glow: 'shadow-amber-500/10',
    },
    highlightTopics: ['Nationalism in India', 'Resources', 'Federalism', 'Money & Credit'],
  },
  english: {
    key: 'english',
    name: 'English',
    image: englishIcon,
    alt: 'CBSE Class 10 English Literature 3D Icon with Open Novel and Golden Pen',
    colorScheme: {
      bg: 'from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-700 dark:text-sky-300',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
      glow: 'shadow-sky-500/10',
    },
    highlightTopics: ['First Flight', 'Footprints', 'Analytical Paragraph', 'Grammar'],
  },
  hindi: {
    key: 'hindi',
    name: 'Hindi',
    image: hindiIcon,
    alt: 'CBSE Class 10 Hindi 3D Icon with Feather Quill, Traditional Inkwell and Scripture Book',
    colorScheme: {
      bg: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
      glow: 'shadow-rose-500/10',
    },
    highlightTopics: ['Course A (Kshitij)', 'Course B (Sparsh)', 'Vyakaran', 'Rachnatmak Lekhan'],
  },
};

export function getSubjectVisual(key: string, fallbackName?: string): SubjectVisual {
  if (SUBJECT_VISUALS[key]) {
    return SUBJECT_VISUALS[key];
  }

  // Fallback for custom subject
  return {
    key,
    name: fallbackName || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    image: mathIcon,
    alt: `Class 10 ${fallbackName || key} Curriculum`,
    colorScheme: {
      bg: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
      border: 'border-violet-200 dark:border-violet-800',
      text: 'text-violet-700 dark:text-violet-300',
      badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',
      glow: 'shadow-violet-500/10',
    },
    highlightTopics: ['All Units', 'Board Preparation', 'Competency Questions', 'Model Papers'],
  };
}
