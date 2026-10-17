import { Question } from '../types';

export const SAMPLE_QUESTIONS_DATABASE: Question[] = [
  // SCIENCE: Electricity - HARD Case Study
  {
    id: 'demo-sci-elec-1',
    subject: 'Science',
    chapter: 'Electricity',
    topic: 'Ohm’s Law & Combination of Resistors',
    difficulty: 'HARD',
    type: 'Case Study',
    question: `A student conducts an experiment to investigate the relationship between current (I) and potential difference (V) across two cylindrical metallic resistors X and Y of identical length and material, but X has double the cross-sectional area of Y. The student records V-I graphs for both resistors at constant temperature. 

Case Question: Which resistor shows a steeper V-I characteristic line with respect to the V-axis (where V is plotted on y-axis and I on x-axis), and what is the ratio of resistance R_X : R_Y?`,
    options: [
      'Resistor Y has steeper slope; ratio R_X : R_Y = 1 : 2',
      'Resistor X has steeper slope; ratio R_X : R_Y = 2 : 1',
      'Resistor Y has steeper slope; ratio R_X : R_Y = 1 : 4',
      'Both have identical slopes because they are made of identical material'
    ],
    answer: 'Resistor Y has steeper slope; ratio R_X : R_Y = 1 : 2',
    explanation: 'Resistance R = ρL/A. Since length L and resistivity ρ are identical, resistance is inversely proportional to cross-sectional area A. A_X = 2 * A_Y, therefore R_X = R_Y / 2, giving R_X : R_Y = 1 : 2. On a V-I graph with V on the y-axis, the slope is ΔV/ΔI = R. Because R_Y > R_X, resistor Y has a steeper slope.'
  },
  // SCIENCE: Chemical Reactions - NORMAL MCQ
  {
    id: 'demo-sci-chem-1',
    subject: 'Science',
    chapter: 'Chemical Reactions and Equations',
    topic: 'Types of Reactions & Redox',
    difficulty: 'NORMAL',
    type: 'MCQ',
    question: 'When aqueous barium chloride is mixed with sodium sulphate solution, a white precipitate of barium sulphate is formed along with sodium chloride solution. This reaction is an example of:',
    options: [
      'Precipitation reaction and Double displacement reaction',
      'Decomposition reaction and Neutralisation reaction',
      'Displacement reaction and Combination reaction',
      'Redox reaction only'
    ],
    answer: 'Precipitation reaction and Double displacement reaction',
    explanation: 'BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s)↓ + 2NaCl(aq). Ions Ba²⁺ and Na⁺ exchange partners (SO₄²⁻ and Cl⁻), constituting a double displacement reaction, and an insoluble white solid (BaSO₄) precipitates out.'
  },
  // SCIENCE: Life Processes - VERY HARD HOTS
  {
    id: 'demo-sci-bio-1',
    subject: 'Science',
    chapter: 'Life Processes',
    topic: 'Respiration & Transportation',
    difficulty: 'VERY HARD',
    type: 'HOTS',
    question: 'A competitive swimmer undergoes an intense 400m sprint race. Blood samples taken immediately after the race reveal elevated levels of lactate and an increased breathing rate that persists even during post-race rest. Explain the biochemical reason why heavy breathing continues long after muscle contractions cease, and state how the body processes the accumulated lactate.',
    answer: 'The phenomenon is known as "Oxygen Debt". During intense sprint exercise, anaerobic respiration occurs in skeletal muscles because oxygen supply cannot meet immediate ATP demand, producing lactic acid. Continued deep breathing after the race provides surplus oxygen required to convert accumulated lactic acid back into pyruvate and glycogen in the liver, as well as replenishing ATP and creatine phosphate stores.',
    explanation: 'When skeletal muscles work under hypoxic conditions, pyruvate is reduced to lactic acid by lactate dehydrogenase to regenerate NAD⁺ for glycolysis. The oxygen debt represents the extra volume of oxygen consumed in recovery to metabolize the accumulated lactate back to pyruvate/glycogen in the liver via the Cori cycle.'
  },
  // MATHEMATICS: Quadratic Equations - HARD Numerical
  {
    id: 'demo-math-quad-1',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    topic: 'Nature of Roots & Real-life Applications',
    difficulty: 'HARD',
    type: 'Numerical',
    question: 'A fast express train takes 1 hour less than a passenger train to travel a distance of 132 km between Mysore and Bangalore. If the average speed of the express train is 11 km/h more than that of the passenger train, formulate the quadratic equation and find the average speed of both trains.',
    answer: 'Speed of passenger train = 33 km/h; Speed of express train = 44 km/h',
    explanation: 'Let speed of passenger train = x km/h. Then speed of express train = (x + 11) km/h. Time difference: 132/x - 132/(x + 11) = 1. Simplifying: 132[(x + 11) - x] / [x(x + 11)] = 1 => 132 * 11 = x² + 11x => x² + 11x - 1452 = 0. Factoring: (x + 44)(x - 33) = 0. Since speed > 0, x = 33 km/h. Express train speed = 33 + 11 = 44 km/h.'
  },
  // MATHEMATICS: Triangles - VERY HARD Competency
  {
    id: 'demo-math-tri-1',
    subject: 'Mathematics',
    chapter: 'Triangles',
    topic: 'Basic Proportionality Theorem & Similarity Criteria',
    difficulty: 'VERY HARD',
    type: 'Competency-Based',
    question: 'In a trapezium ABCD with AB || DC, diagonals AC and BD intersect at point O. A line EF is drawn parallel to AB passing through O, intersecting AD at E and BC at F. Prove that EO = OF and hence deduce that EO/AB + EO/DC = 1.',
    answer: 'Proven using BPT: In ΔADC, EO || DC => EO/DC = AE/AD. In ΔDAB, EO || AB => EO/AB = DE/AD. Adding the two: EO/DC + EO/AB = (AE + DE)/AD = AD/AD = 1. By symmetry in ΔBDC and ΔABC, OF/DC = BF/BC and OF/AB = CF/BC, yielding OF = EO.',
    explanation: 'By applying the Basic Proportionality Theorem to ΔADC (where EO || DC) and ΔDAB (where EO || AB), we establish EO/DC = AE/AD and EO/AB = DE/AD. Adding both equations gives EO(1/DC + 1/AB) = (AE + DE)/AD = 1. Repeating similarly on the right side yields OF = EO.'
  },
  // SOCIAL SCIENCE: History - HARD Source-Based
  {
    id: 'demo-sst-hist-1',
    subject: 'Social Science',
    chapter: 'The Rise of Nationalism in Europe',
    topic: 'Frederic Sorrieu’s Utopian Vision',
    difficulty: 'HARD',
    type: 'Source-Based',
    question: 'Examine Frederic Sorrieu’s 1848 print "The Dream of Worldwide Democratic and Social Republics". What specific allegory did Sorrieu use to personify Liberty, and what two distinct items did this figure hold in her hands?',
    answer: 'Sorrieu personified Liberty as a female figure holding the Torch of Enlightenment in one hand and the Charter of the Rights of Man in the other.',
    explanation: 'In Sorrieu’s print, peoples of Europe and America march past the Statue of Liberty. In accordance with European artistic conventions, Liberty is depicted as a female bearing the torch of Enlightenment to dispel ignorance and despotism, while holding the Charter of the Rights of Man representing individual liberties and constitutionalism.'
  },
  // SOCIAL SCIENCE: Economics - NORMAL MCQ
  {
    id: 'demo-sst-eco-1',
    subject: 'Social Science',
    chapter: 'Money and Credit',
    topic: 'Terms of Credit & Formal Sector',
    difficulty: 'NORMAL',
    type: 'MCQ',
    question: 'Which of the following is NOT typically considered part of the "terms of credit" agreed upon between a lender and a borrower?',
    options: [
      'Interest rate',
      'Collateral security',
      'Borrower’s political affiliation',
      'Documentation requirement and mode of repayment'
    ],
    answer: 'Borrower’s political affiliation',
    explanation: 'As per NCERT Class 10 Economics, Terms of Credit include: interest rate, collateral (security), documentation requirement, and the mode of repayment. Political affiliation has no legal role in formal credit agreements.'
  },
  // ENGLISH: First Flight - HARD Short Answer
  {
    id: 'demo-eng-ff-1',
    subject: 'English',
    chapter: 'A Letter to God & Dust of Snow / Fire and Ice',
    topic: 'Irony in Character & Situational Conflict',
    difficulty: 'HARD',
    type: 'Short Answer',
    question: 'Highlight the profound situational irony at the conclusion of Gregorio Lopez Fuentes’ story "A Letter to God". How does Lencho’s unwavering faith paradoxically obscure his perception of human kindness?',
    answer: 'The irony lies in Lencho labeling the post office employees "a bunch of crooks". In reality, the postmaster and his staff collected money from their own salaries to preserve Lencho’s faith in God. Lencho’s blind belief prevented him from recognizing authentic human charity.',
    explanation: 'Situational irony occurs when the outcome directly contradicts expectation. Lencho expected God to send precisely 100 pesos. Finding only 70 pesos, he blamed the post office workers rather than acknowledging that human beings had extended kindness to him.'
  },
  // HINDI: Course A - NORMAL MCQ
  {
    id: 'demo-hin-a-1',
    subject: 'Hindi',
    chapter: 'क्षितिज भाग 2 - गद्य खंड (नेताजी का चश्मा, बालगोबिन भगत, लखनवी अंदाज़, एक कहानी यह भी, नौबतखाने में इबादत, संस्कृति)',
    topic: 'नेताजी का चश्मा - देशभक्ति का संदेश',
    difficulty: 'NORMAL',
    type: 'MCQ',
    question: 'स्वयं प्रकाश द्वारा रचित कहानी "नेताजी का चश्मा" में कैप्टन चश्मेवाले के प्रति हालदार साहब के मन में श्रद्धा का भाव क्यों जाग उठा?',
    options: [
      'क्योंकि कैप्टन बहुत धनी और रईस व्यक्ति था',
      'क्योंकि वह नेताजी की बिना चश्मे वाली मूर्ति देखकर आहत होता था और देशभक्ति की भावना रखता था',
      'क्योंकि वह स्वतंत्रता संग्राम सेनानी और फौज का रिटायर्ड कैप्टन था',
      'क्योंकि वह नगर पालिका का मुख्य मूर्तिकार था'
    ],
    answer: 'क्योंकि वह नेताजी की बिना चश्मे वाली मूर्ति देखकर आहत होता था और देशभक्ति की भावना रखता था',
    explanation: 'कैप्टन एक साधारण, शारीरिक रूप से दुर्बल फेरीवाला था। नेताजी की मूर्ति पर चश्मा न होना उसे आहत करता था, इसलिए वह अपने चश्मों में से एक चश्मा मूर्ति पर लगा देता था। उसकी यह निस्वार्थ देशभक्ति हालदार साहब को नतमस्तक कर देती है।'
  },
  // SCIENCE: Heredity - VERY HARD Assertion & Reason
  {
    id: 'demo-sci-hered-1',
    subject: 'Science',
    chapter: 'Heredity',
    topic: 'Mendelian Genetics & Dihybrid Cross',
    difficulty: 'VERY HARD',
    type: 'Assertion & Reason',
    question: `Read the following statements:
Assertion (A): In a dihybrid cross involving pea plants heterozygous for round yellow seeds (RrYy x RrYy), the phenotypic ratio obtained in the F2 generation is 9:3:3:1.
Reason (R): The alleles for seed shape and seed color segregate independently of each other during gamete formation in accordance with Mendel's Law of Independent Assortment.

Choose the correct option:`,
    options: [
      'Both (A) and (R) are true, and (R) is the correct explanation of (A)',
      'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A)',
      '(A) is true, but (R) is false',
      '(A) is false, but (R) is true'
    ],
    answer: 'Both (A) and (R) are true, and (R) is the correct explanation of (A)',
    explanation: 'Mendel’s dihybrid cross yields 9 Round-Yellow, 3 Round-Green, 3 Wrinkled-Yellow, and 1 Wrinkled-Green seeds because the two pairs of characters (shape and color) assort independently during meiosis, which validates the Law of Independent Assortment.'
  }
];

export function getSampleQuestionsFor(
  subject: string,
  chapter?: string,
  difficulty?: string,
  count: number = 5
): Question[] {
  let filtered = SAMPLE_QUESTIONS_DATABASE.filter(
    q => q.subject.toLowerCase() === subject.toLowerCase()
  );

  if (chapter && chapter !== 'All Chapters') {
    const chapterMatches = filtered.filter(q =>
      q.chapter.toLowerCase().includes(chapter.toLowerCase()) ||
      chapter.toLowerCase().includes(q.chapter.toLowerCase())
    );
    if (chapterMatches.length > 0) {
      filtered = chapterMatches;
    }
  }

  if (difficulty) {
    const diffMatches = filtered.filter(q => q.difficulty === difficulty);
    if (diffMatches.length > 0) {
      filtered = diffMatches;
    }
  }

  // If filtered set is smaller than requested count, fill up with general samples
  if (filtered.length < count) {
    const remaining = SAMPLE_QUESTIONS_DATABASE.filter(q => !filtered.includes(q));
    filtered = [...filtered, ...remaining];
  }

  return filtered.slice(0, count).map((q, idx) => ({
    ...q,
    id: `q-${Date.now()}-${idx + 1}`
  }));
}
