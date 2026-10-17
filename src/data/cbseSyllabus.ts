import { SubjectConfig, QuestionType, Chapter, CustomSubject } from '../types';
import { getLocalCustomSubjects } from '../services/adminService';

export const CBSE_CLASS_10_SYLLABUS: Record<string, SubjectConfig> = {
  mathematics: {
    name: 'Mathematics',
    key: 'mathematics',
    description: 'CBSE Standard & Basic Mathematics syllabus covering algebra, geometry, trigonometry, and calculus basics.',
    iconName: 'Calculator',
    supportedTypes: [
      'MCQ',
      'Very Short Answer',
      'Short Answer',
      'Long Answer',
      'Assertion & Reason',
      'Case Study',
      'Competency-Based',
      'Numerical',
      'HOTS',
      'Mixed'
    ],
    chapters: [
      { id: 'math-1', name: 'Real Numbers', unit: 'Number Systems', topics: ['Fundamental Theorem of Arithmetic', 'Revisiting Irrational Numbers'] },
      { id: 'math-2', name: 'Polynomials', unit: 'Algebra', topics: ['Zeros of a Polynomial', 'Relationship between Zeros and Coefficients'] },
      { id: 'math-3', name: 'Pair of Linear Equations in Two Variables', unit: 'Algebra', topics: ['Graphical Method of Solution', 'Algebraic Methods (Substitution, Elimination)'] },
      { id: 'math-4', name: 'Quadratic Equations', unit: 'Algebra', topics: ['Factorisation', 'Nature of Roots', 'Quadratic Formula'] },
      { id: 'math-5', name: 'Arithmetic Progressions', unit: 'Algebra', topics: ['nth Term of an AP', 'Sum of First n Terms of an AP'] },
      { id: 'math-6', name: 'Triangles', unit: 'Coordinate & Euclidean Geometry', topics: ['Similar Figures', 'Basic Proportionality Theorem (Thales Theorem)', 'Criteria for Similarity'] },
      { id: 'math-7', name: 'Coordinate Geometry', unit: 'Coordinate Geometry', topics: ['Distance Formula', 'Section Formula'] },
      { id: 'math-8', name: 'Introduction to Trigonometry', unit: 'Trigonometry', topics: ['Trigonometric Ratios', 'Trigonometric Ratios of Specific Angles', 'Trigonometric Identities'] },
      { id: 'math-9', name: 'Some Applications of Trigonometry', unit: 'Trigonometry', topics: ['Heights and Distances', 'Angles of Elevation and Depression'] },
      { id: 'math-10', name: 'Circles', unit: 'Geometry', topics: ['Tangent to a Circle', 'Number of Tangents from a Point on a Circle'] },
      { id: 'math-11', name: 'Areas Related to Circles', unit: 'Mensuration', topics: ['Areas of Sector and Segment of a Circle'] },
      { id: 'math-12', name: 'Surface Areas and Volumes', unit: 'Mensuration', topics: ['Surface Area of a Combination of Solids', 'Volume of a Combination of Solids'] },
      { id: 'math-13', name: 'Statistics', unit: 'Statistics & Probability', topics: ['Mean of Grouped Data', 'Mode of Grouped Data', 'Median of Grouped Data'] },
      { id: 'math-14', name: 'Probability', unit: 'Statistics & Probability', topics: ['Classical Definition of Probability', 'Simple Problems on Single Events'] }
    ]
  },
  science: {
    name: 'Science',
    key: 'science',
    description: 'Covers Chemical Substances, World of Living, Natural Phenomena, and Effects of Current.',
    iconName: 'FlaskConical',
    supportedTypes: [
      'MCQ',
      'Very Short Answer',
      'Short Answer',
      'Long Answer',
      'Assertion & Reason',
      'Case Study',
      'Competency-Based',
      'Numerical',
      'HOTS',
      'Mixed'
    ],
    chapters: [
      { id: 'sci-1', name: 'Chemical Reactions and Equations', unit: 'Chemical Substances - Nature and Behaviour', topics: ['Chemical Equations', 'Types of Chemical Reactions', 'Corrosion and Rancidity'] },
      { id: 'sci-2', name: 'Acids, Bases and Salts', unit: 'Chemical Substances - Nature and Behaviour', topics: ['Properties of Acids and Bases', 'pH Scale and Applications', 'Common Salts (Bleaching Powder, Baking Soda, Washing Soda, Plaster of Paris)'] },
      { id: 'sci-3', name: 'Metals and Non-metals', unit: 'Chemical Substances - Nature and Behaviour', topics: ['Physical and Chemical Properties', 'Reactivity Series', 'Ionic Compounds', 'Basic Metallurgical Processes'] },
      { id: 'sci-4', name: 'Carbon and Its Compounds', unit: 'Chemical Substances - Nature and Behaviour', topics: ['Covalent Bonding', 'Versatile Nature of Carbon', 'Homologous Series', 'Functional Groups', 'Combustion, Oxidation, Addition, Substitution'] },
      { id: 'sci-5', name: 'Life Processes', unit: 'World of Living', topics: ['Nutrition (Autotrophic & Heterotrophic)', 'Respiration', 'Transportation in Plants & Animals', 'Excretion in Humans & Plants'] },
      { id: 'sci-6', name: 'Control and Coordination', unit: 'World of Living', topics: ['Tropic Movements in Plants', 'Introduction to Plant Hormones', 'Control and Coordination in Animals', 'Nervous System, Reflex Arc', 'Hormones in Animals'] },
      { id: 'sci-7', name: 'How do Organisms Reproduce?', unit: 'World of Living', topics: ['Modes of Reproduction by Single Organisms', 'Sexual Reproduction in Flowering Plants', 'Reproduction in Human Beings', 'Reproductive Health'] },
      { id: 'sci-8', name: 'Heredity', unit: 'World of Living', topics: ['Heredity and Mendel’s Contribution', 'Laws for Inheritance of Traits', 'Sex Determination'] },
      { id: 'sci-9', name: 'Light – Reflection and Refraction', unit: 'Natural Phenomena', topics: ['Reflection by Spherical Mirrors', 'Mirror Formula & Magnification', 'Refraction through Glass Slab', 'Refractive Index', 'Lens Formula & Power'] },
      { id: 'sci-10', name: 'The Human Eye and the Colourful World', unit: 'Natural Phenomena', topics: ['Refraction of Light through a Prism', 'Dispersion of White Light', 'Atmospheric Refraction', 'Scattering of Light (Tyndall Effect)'] },
      { id: 'sci-11', name: 'Electricity', unit: 'Effects of Current', topics: ['Electric Current and Circuit', 'Electric Potential & Potential Difference', 'Ohm’s Law', 'Resistance and Resistivity', 'Heating Effect of Electric Current & Electric Power'] },
      { id: 'sci-12', name: 'Magnetic Effects of Electric Current', unit: 'Effects of Current', topics: ['Magnetic Field and Field Lines', 'Field due to Current-Carrying Conductor & Solenoid', 'Force on Current-Carrying Conductor (Fleming’s Left-Hand Rule)', 'Domestic Electric Circuits'] },
      { id: 'sci-13', name: 'Our Environment', unit: 'Natural Resources', topics: ['Ecosystem and its Components', 'Food Chains and Food Webs', 'Ozone Layer Depletion', 'Waste Management'] }
    ]
  },
  social_science: {
    name: 'Social Science',
    key: 'social_science',
    description: 'History (India & Contemporary World II), Geography (Contemporary India II), Civics (Democratic Politics II), and Economics.',
    iconName: 'Globe',
    supportedTypes: [
      'MCQ',
      'Very Short Answer',
      'Short Answer',
      'Long Answer',
      'Assertion & Reason',
      'Case Study',
      'Competency-Based',
      'Source-Based',
      'HOTS',
      'Mixed'
    ],
    subCategories: [
      {
        name: 'History (India & the Contemporary World - II)',
        key: 'history',
        chapters: [
          { id: 'hist-1', name: 'The Rise of Nationalism in Europe', topics: ['The French Revolution and the Idea of the Nation', 'The Making of Nationalism in Europe', 'The Age of Revolutions: 1830-1848', 'The Making of Germany and Italy', 'Visualising the Nation', 'Nationalism and Imperialism'] },
          { id: 'hist-2', name: 'Nationalism in India', topics: ['The First World War, Khilafat and Non-Cooperation', 'Differing Strands within the Movement', 'Towards Civil Disobedience', 'The Sense of Collective Belonging'] },
          { id: 'hist-3', name: 'The Making of a Global World', topics: ['The Pre-modern world', 'The Nineteenth Century (1815-1914)', 'The Inter-war Economy', 'Rebuilding a World Economy'] },
          { id: 'hist-4', name: 'The Age of Industrialisation', topics: ['Before the Industrial Revolution', 'Hand Labour and Steam Power', 'Industrialisation in the Colonies', 'Factories Come Up'] },
          { id: 'hist-5', name: 'Print Culture and the Modern World', topics: ['The First Printed Books', 'Print Comes to Europe', 'The Print Revolution and its Impact', 'The Reading Mania', 'Religious Debates and the Fear of Print'] }
        ]
      },
      {
        name: 'Geography (Contemporary India - II)',
        key: 'geography',
        chapters: [
          { id: 'geo-1', name: 'Resources and Development', topics: ['Types of Resources', 'Development of Resources', 'Resource Planning in India', 'Land Resources & Soil Types'] },
          { id: 'geo-2', name: 'Forest and Wildlife Resources', topics: ['Flora and Fauna in India', 'Conservation of Forest and Wildlife', 'Types and Distribution of Forests', 'Community and Conservation'] },
          { id: 'geo-3', name: 'Water Resources', topics: ['Water Scarcity and Need for Water Conservation', 'Multi-Purpose River Projects', 'Rainwater Harvesting'] },
          { id: 'geo-4', name: 'Agriculture', topics: ['Types of Farming', 'Cropping Pattern (Rabi, Kharif, Zaid)', 'Major Crops', 'Technological and Institutional Reforms'] },
          { id: 'geo-5', name: 'Minerals and Energy Resources', topics: ['What is a Mineral?', 'Mode of Occurrence of Minerals', 'Conventional and Non-Conventional Sources of Energy'] },
          { id: 'geo-6', name: 'Manufacturing Industries', topics: ['Importance of Manufacturing', 'Classification of Industries', 'Industrial Pollution and Environmental Degradation'] },
          { id: 'geo-7', name: 'Lifelines of National Economy', topics: ['Roadways, Railways, Pipelines, Waterways, Airways', 'Communication', 'International Trade & Tourism'] }
        ]
      },
      {
        name: 'Political Science (Democratic Politics - II)',
        key: 'political_science',
        chapters: [
          { id: 'pol-1', name: 'Power Sharing', topics: ['Case Studies of Belgium and Sri Lanka', 'Majoritarianism in Sri Lanka', 'Accommodation in Belgium', 'Why is Power Sharing Desirable?', 'Forms of Power Sharing'] },
          { id: 'pol-2', name: 'Federalism', topics: ['What is Federalism?', 'What Makes India a Federal Country?', 'How is Federalism Practised?', 'Decentralisation in India'] },
          { id: 'pol-3', name: 'Gender, Religion and Caste', topics: ['Gender and Politics', 'Religion, Communalism and Politics', 'Caste and Politics'] },
          { id: 'pol-4', name: 'Political Parties', topics: ['Why Do We Need Political Parties?', 'How Many Parties Should We Have?', 'National Political Parties', 'State Parties', 'Challenges to Political Parties'] },
          { id: 'pol-5', name: 'Outcomes of Democracy', topics: ['How Do We Assess Democracy’s Outcomes?', 'Accountable, Responsive and Legitimate Government', 'Economic Growth and Development', 'Reduction of Inequality and Poverty'] }
        ]
      },
      {
        name: 'Economics (Understanding Economic Development)',
        key: 'economics',
        chapters: [
          { id: 'eco-1', name: 'Development', topics: ['What Development Promises – Different People, Different Goals', 'Income and Other Goals', 'National Development', 'How to Compare Different Countries or States?', 'Public Facilities', 'Sustainability of Development'] },
          { id: 'eco-2', name: 'Sectors of the Indian Economy', topics: ['Sectors of Economic Activities (Primary, Secondary, Tertiary)', 'Comparing the Three Sectors', 'Historical Changes in Sectors', 'Rising Importance of Tertiary Sector', 'Where are most people employed?', 'Organised and Unorganised Sectors'] },
          { id: 'eco-3', name: 'Money and Credit', topics: ['Money as a Medium of Exchange', 'Modern Forms of Money', 'Loan Activities of Banks', 'Two Different Credit Situations', 'Terms of Credit', 'Formal Sector Credit in India', 'Self-Help Groups for the Poor'] },
          { id: 'eco-4', name: 'Globalisation and the Indian Economy', topics: ['Production Across Countries', 'Interlinking Production Across Countries', 'Foreign Trade and Integration of Markets', 'What is Globalisation?', 'Factors that have Enabled Globalisation (Technology, Liberalisation)', 'World Trade Organisation (WTO)', 'Impact of Globalisation in India'] },
          { id: 'eco-5', name: 'Consumer Rights', topics: ['The Consumer in the Marketplace', 'Consumer Movement', 'Consumer Rights (Right to Information, Safety, Choice, Seek Redressal)', 'Taking the Consumer Movement Forward'] }
        ]
      }
    ]
  },
  english: {
    name: 'English (Language & Literature)',
    key: 'english',
    description: 'CBSE Class 10 English Language and Literature (First Flight, Footprints Without Feet, Grammar, and Creative Writing).',
    iconName: 'BookOpen',
    supportedTypes: [
      'MCQ',
      'Very Short Answer',
      'Short Answer',
      'Long Answer',
      'Competency-Based',
      'Source-Based',
      'HOTS',
      'Mixed'
    ],
    subCategories: [
      {
        name: 'First Flight (Prose & Poetry)',
        key: 'first_flight',
        chapters: [
          { id: 'ff-1', name: 'A Letter to God & Dust of Snow / Fire and Ice', topics: ['Faith, Irony, Nature symbolism', 'Robert Frost themes'] },
          { id: 'ff-2', name: 'Nelson Mandela: Long Walk to Freedom & A Tiger in the Zoo', topics: ['Struggle against Apartheid, Freedom vs Captivity'] },
          { id: 'ff-3', name: 'Two Stories About Flying & The Ball Poem', topics: ['His First Flight (Liam O’Flaherty)', 'Black Aeroplane (Frederick Forsyth)', 'Loss and Growing Up'] },
          { id: 'ff-4', name: 'From the Diary of Anne Frank & Amanda!', topics: ['Adolescence, Isolation, Imagination vs Restriction'] },
          { id: 'ff-5', name: 'Glimpses of India & The Trees', topics: ['A Baker from Goa', 'Coorg', 'Tea from Assam', 'Nature reclaiming its space'] },
          { id: 'ff-6', name: 'Mijbil the Otter & Fog', topics: ['Pet bonding in London/Camusfearna', 'Carl Sandburg imagery'] },
          { id: 'ff-7', name: 'Madam Rides the Bus & The Tale of Custard the Dragon', topics: ['Valli’s curious journey into adulthood', 'Ogden Nash mock-heroic ballad'] },
          { id: 'ff-8', name: 'The Sermon at Benares & For Anne Gregory', topics: ['Kisa Gotami and the inevitability of death', 'Spiritual vs physical beauty'] },
          { id: 'ff-9', name: 'The Proposal (Play by Anton Chekhov)', topics: ['Russian aristocracy, Quarrels over Oxen Meadows, Farce'] }
        ]
      },
      {
        name: 'Footprints Without Feet (Supplementary Reader)',
        key: 'footprints',
        chapters: [
          { id: 'fw-1', name: 'A Triumph of Surgery', topics: ['Tricki, Mrs. Pumphrey, and Dr. James Herriot'] },
          { id: 'fw-2', name: 'The Thief’s Story', topics: ['Hari Singh, Anil, trust, reform and literacy'] },
          { id: 'fw-3', name: 'The Midnight Visitor', topics: ['Ausable, Fowler, Max, wit triumphing over weapons'] },
          { id: 'fw-4', name: 'A Question of Trust', topics: ['Horace Danby, honour among thieves'] },
          { id: 'fw-5', name: 'Footprints Without Feet', topics: ['Griffin, invisibility, misuse of science'] },
          { id: 'fw-6', name: 'The Making of a Scientist', topics: ['Richard Ebright, butterfly research, curiosity'] },
          { id: 'fw-7', name: 'The Necklace', topics: ['Mathilde Loisel, vanity, cost of a lost necklace'] },
          { id: 'fw-8', name: 'Bholi', topics: ['Sulekha, education empowering against social evils'] },
          { id: 'fw-9', name: 'The Book That Saved the Earth', topics: ['Martian invasion, Mother Goose nursery rhymes'] }
        ]
      },
      {
        name: 'Grammar',
        key: 'grammar',
        chapters: [
          { id: 'eng-g-1', name: 'Tenses', topics: ['Past, Present, and Future Tense Application in Context'] },
          { id: 'eng-g-2', name: 'Modals', topics: ['Can, Could, May, Might, Shall, Should, Must, Ought to'] },
          { id: 'eng-g-3', name: 'Subject-Verb Concord', topics: ['Agreement rules, Singular/Plural subjects, Inverted sentences'] },
          { id: 'eng-g-4', name: 'Reported Speech', topics: ['Commands & Requests', 'Statements', 'Questions and Direct to Indirect transformation'] },
          { id: 'eng-g-5', name: 'Determiners', topics: ['Articles, Demonstratives, Possessives, Quantifiers'] }
        ]
      },
      {
        name: 'Writing Skills',
        key: 'writing',
        chapters: [
          { id: 'eng-w-1', name: 'Formal Letter Writing', topics: ['Letter to the Editor', 'Letter of Complaint', 'Letter of Inquiry', 'Placing an Order'] },
          { id: 'eng-w-2', name: 'Analytical Paragraph Writing', topics: ['Data interpretation from Bar graphs/Charts', 'Map analysis', 'Argumentative/Analytical cues'] }
        ]
      }
    ]
  },
  hindi: {
    name: 'Hindi',
    key: 'hindi',
    description: 'CBSE Class 10 Hindi Course A (Kshitij & Kritika) and Course B (Sparsh & Sanchayan) with complete Vyakaran.',
    iconName: 'Languages',
    supportedTypes: [
      'MCQ',
      'Very Short Answer',
      'Short Answer',
      'Long Answer',
      'Competency-Based',
      'Source-Based',
      'HOTS',
      'Mixed'
    ],
    subCategories: [
      {
        name: 'Hindi Course A (Kshitij & Kritika)',
        key: 'course_a',
        chapters: [
          { id: 'hin-a-1', name: 'क्षितिज भाग 2 - गद्य खंड (नेताजी का चश्मा, बालगोबिन भगत, लखनवी अंदाज़, एक कहानी यह भी, नौबतखाने में इबादत, संस्कृति)', topics: ['देशभक्ति, सामाजिक रूढ़ियों पर प्रहार, व्यंग्य, आत्मकथात्मक शैली, संगीत साधना'] },
          { id: 'hin-a-2', name: 'क्षितिज भाग 2 - काव्य खंड (सूरदास के पद, राम-लक्ष्मण-परशुराम संवाद, उत्साह व अट नहीं रही है, यह दंतुरित मुस्कान व फसल, संगतकार)', topics: ['भक्ति रस, वीर एवं रौद्र रस, प्रकृति वर्णन, वात्सल्य, सह-कलाकार की महत्ता'] },
          { id: 'hin-a-3', name: 'कृतिका भाग 2 (माता का आँचल, साना-साना हाथ जोड़ि, मैं क्यों लिखता हूँ?)', topics: ['ग्रामीण परिवेश, सिक्किम यात्रा वृत्तांत, हिरोशिमा का दर्द व अंतर्मन की प्रेरणा'] },
          { id: 'hin-a-4', name: 'व्याकरण - रचना के आधार पर वाक्य भेद, वाच्य, पद परिचय, अलंकार', topics: ['सरल/संयुक्त/मिश्र वाक्य, कर्तृवाच्य/कर्मवाच्य/भाववाच्य, श्लेष, उत्प्रेक्षा, अतिशयोक्ति, मानवीकरण'] },
          { id: 'hin-a-5', name: 'रचनात्मक लेखन - अनुच्छेद, पत्र, सूचना/बायोडाटा, विज्ञापन, संदेश लेखन', topics: ['समसामयिक विषय, औपचारिक/अनौपचारिक पत्र, जनहित विज्ञापन'] }
        ]
      },
      {
        name: 'Hindi Course B (Sparsh & Sanchayan)',
        key: 'course_b',
        chapters: [
          { id: 'hin-b-1', name: 'स्पर्श भाग 2 - गद्य खंड (बड़े भाई साहब, डायरी का एक पन्ना, तँतारा-वामीरो कथा, तीसरी कसम के शिल्पकार शैलेंद्र, अब कहाँ दूसरे के दुख से दुखी होने वाले, झेन की देन, कारतूस)', topics: ['बाल मनोविज्ञान व शिक्षा व्यवस्था, स्वतंत्रता आंदोलन, लोककथा, मानवीय संवेदनशीलता, मानसिक शांति'] },
          { id: 'hin-b-2', name: 'स्पर्श भाग 2 - काव्य खंड (साखी-कबीर, पद-मीरा, मनुष्यता, पर्वत प्रदेश में पावस, तोप, कर चले हम फ़िदा, आत्मत्राण)', topics: ['नीतिपरक दोहे, कृष्ण भक्ति, मानवता, प्रकृति का अलौकिक रूप, शहादत, आत्मविश्वास'] },
          { id: 'hin-b-3', name: 'संचयन भाग 2 (हरिहर काका, सपनों के से दिन, टोपी शुक्ला)', topics: ['पारिवारिक स्वार्थ, बचपन की स्मृतियाँ, सांप्रदायिक सौहार्द'] },
          { id: 'hin-b-4', name: 'व्याकरण - पदबंध, रचना के आधार पर वाक्य रूपांतरण, समास, मुहावरे', topics: ['संज्ञा/सर्वनाम/विशेषण/क्रिया/क्रियाविशेषण पदबंध, तत्पुरुष/द्विगु/कर्मधारय/द्वंद्व/बहुव्रीहि समास'] },
          { id: 'hin-b-5', name: 'रचनात्मक लेखन - अनुच्छेद, पत्र, सूचना, विज्ञापन, लघु कथा लेखन / ई-मेल लेखन', topics: ['प्रभावी अभिव्यक्ति, सटीक शब्दावली'] }
        ]
      }
    ]
  }
};

/**
 * Merges default CBSE Syllabus with dynamically loaded custom subjects
 */
export function getCombinedSyllabus(customSubjects?: CustomSubject[]): Record<string, SubjectConfig> {
  const customList = customSubjects || getLocalCustomSubjects();
  const merged: Record<string, SubjectConfig> = { ...CBSE_CLASS_10_SYLLABUS };

  if (Array.isArray(customList)) {
    for (const sub of customList) {
      if (sub && sub.key) {
        merged[sub.key] = sub;
      }
    }
  }

  return merged;
}

/**
 * Returns array of all subjects (default CBSE + custom)
 */
export function getAllSubjectsList(customSubjects?: CustomSubject[]): SubjectConfig[] {
  return Object.values(getCombinedSyllabus(customSubjects));
}

/**
 * Utility helper to get flattened list of chapters for any subject or subcategory
 */
export function getChaptersForSubject(subjectKey: string, subCategoryKey?: string, customSubjects?: CustomSubject[]): Chapter[] {
  const syllabus = getCombinedSyllabus(customSubjects);
  const subject = syllabus[subjectKey];
  if (!subject) return [];

  if (subject.chapters && subject.chapters.length > 0) {
    return subject.chapters;
  }

  if (subject.subCategories && subject.subCategories.length > 0) {
    if (subCategoryKey) {
      const match = subject.subCategories.find(s => s.key === subCategoryKey);
      if (match) return match.chapters;
    }
    // Return all chapters combined if no specific subCategory is selected
    return subject.subCategories.flatMap(sc => sc.chapters);
  }

  return [];
}

/**
 * Get all available subcategories for subjects like Social Science, English, Hindi, or custom
 */
export function getSubCategoriesForSubject(subjectKey: string, customSubjects?: CustomSubject[]) {
  const syllabus = getCombinedSyllabus(customSubjects);
  return syllabus[subjectKey]?.subCategories || [];
}
