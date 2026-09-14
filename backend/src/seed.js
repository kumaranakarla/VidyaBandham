// Resets the database to a known demo state: one class, one teacher login,
// one parent login, four students, and a little sample data.
//
// Two ways this runs:
//   1. Manually, from a terminal: `npm run seed` (see the bottom of this file).
//   2. Automatically, on server startup, if the database is empty — see
//      `seedIfEmpty()`, called from server.js. This matters on free hosts
//      like Render, whose free tier wipes the database file on every
//      sleep/restart: without this, the server would come back up with an
//      empty database and no way to log in, and nobody could run `npm run
//      seed` by hand on a server they don't have a terminal into.

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

// A starter TET (Teacher Eligibility Test) question bank — real questions with
// their official answers from published AP TET Paper 1 exams (June 2018,
// two different shifts, so far — see the README for why other years aren't
// in here yet), not invented ones. Only questions where the original paper's
// full set of four options was available are included, so nothing here is a
// guessed or fabricated distractor. Not tied to any class — shared reference
// material for anyone using the app.
const TET_QUESTIONS = [
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      'A father who had failed in the Civil Services examination felt as if he himself had succeeded when his son later cleared it. This is an example of which defense mechanism?',
    options: ['Withdrawal', 'Projection', 'Repression', 'Identification'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      'Prasanthi was selected for both a teaching post and a bank clerk post, and likes both equally. What type of conflict is this?',
    options: ['Approach-Avoidance', 'Approach-Approach', 'Avoidance-Avoidance', 'Double Approach-Avoidance'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'Children who show security and self-reliance typically come from parents who:',
    options: ['Over-care for their children', 'Are submissive to their children', 'Play with their children', 'Are authoritarian'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'The "naive hedonistic orientation" stage belongs to which level of moral development?',
    options: ['Conventional', 'Post-conventional', 'Pre-conventional', 'Natural moral level'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'The concept of the "Zone of Proximal Development" was proposed by:',
    options: ['Bandura', 'Bruner', 'Piaget', 'Vygotsky'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'A main objective of Continuous and Comprehensive Evaluation (CCE) is to:',
    options: ['Encourage rote memory', 'Provide continuous feedback for improvement', 'Be strictly teacher-centered', 'Assess only cognitive skills'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: "Maturation refers to the emergence of an organism's genetic potential, as described by:",
    options: ['Anderson', 'Erickson', 'Gessel', 'Craig'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'According to Piaget, children will learn the concept of object permanence during the:',
    options: ['Sensory motor stage', 'Pre-operational stage', 'Concrete operational stage', 'Formal operational stage'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: "\"The moral development of a person depends on the person's cognitive abilities\" was opined by:",
    options: ['Chomsky', 'Tolman', 'Piaget', 'Kohlberg'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      'According to Erikson, the psychosocial critical situation faced by children during adolescence is:',
    options: ['Trust vs. Mistrust', 'Autonomy vs. Doubt', 'Role identity vs. Role confusion', 'Integrity vs. Despair'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      'Rishi wants to purchase a car but he is scared of its maintenance cost. What type of conflict is this?',
    options: ['Approach-Approach', 'Avoidance-Avoidance', 'Approach-Avoidance', 'Double Approach-Avoidance'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      'Abhishek was scolded by his class teacher for no reason. He got angry with his teacher but showed his anger at his younger brother at home instead. Which defense mechanism is this?',
    options: ['Displacement', 'Repression', 'Identification', 'Regression'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: "Maslow's theory of hierarchy of needs was proposed by:",
    options: ['Watson', 'Hurlock', 'Maslow', 'Atkinson'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question:
      "In Pavlov's experiment, a dog salivated when food was given along with the sound of a bell. Here, the salivation of the dog on hearing the bell alone is a:",
    options: ['Conditioned stimulus', 'Conditioned response', 'Unconditioned stimulus', 'Unconditioned response'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'Non-directive counseling was introduced by:',
    options: ['Freud', 'Williamson', 'Rogers', 'Thorne'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Child Development & Pedagogy',
    question: 'The teaching method explained by Kilpatrick is the:',
    options: ['Lecture method', 'Heuristic method', 'Project method', 'Historical method'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'What does the phrase "healthy appetite" mean?',
    options: ['Ready to work', 'Desire to eat', 'A complaint', 'An amusing ability'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the correct synonym for "vanish":',
    options: ['Live', 'Move', 'Fall', 'Disappear'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the correct antonym for "feeble":',
    options: ['Happy', 'Strong', 'Active', 'Serious'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the correctly spelled word:',
    options: ['Harmoneous', 'Harmonious', 'Harmonies', 'Harmonus'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'English',
    question: '"She did not go to school as she was ill" is which type of sentence?',
    options: ['Simple', 'Compound', 'Complex', 'Interrogative'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the grammatically correct sentence:',
    options: ['She not understanding', 'She does not understand', 'She was not understanding', 'She not understand'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'English',
    question:
      '"The crew of the ship was very friendly and courteous." Choose the antonym of the word \'courteous\':',
    options: ['Affable', 'Civil', 'Rude', 'Respectful'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the word with the wrong spelling:',
    options: ['Commemorate', 'Epilipsy', 'Virulent', 'Museum'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the conjunction that can be used to write a complex sentence:',
    options: ['But', 'Else', 'Because', 'And'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'English',
    question: 'Choose the grammatically correct sentence from the following:',
    options: [
      'One of my friend is visiting me tomorrow',
      'One of my friend are visiting me tomorrow',
      'One of my friends are visiting me tomorrow',
      'One of my friends is visiting me tomorrow',
    ],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'English',
    question:
      '"The teacher said to Ravi, \'You are absolutely right.\'" Choose the correct reported speech of the sentence:',
    options: [
      'The teacher said to Ravi that he is absolutely right',
      'The teacher said to Ravi that he was absolutely right',
      'The teacher told Ravi that he was absolutely right',
      'The teacher told Ravi that you are absolutely right',
    ],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'English',
    question:
      'The type of reading that is useful for getting every detail of a text is:',
    options: ['Extensive reading', 'Intensive reading', 'Slow reading', 'Graphic reading'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'What is the multiplicative inverse of 13/19?',
    options: ['13/19', '19/13', '19/13', '1'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'Which of the following represents the commutative property?',
    options: ['a(b+c) = ab+ac', 'a+(b+c) = (a+b)+c', 'a(b+c) = (ab)+(ac)', 'ab = ba'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'How many perfect cube numbers are there between 1 and 100?',
    options: ['9', '10', '3', '13'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'What is the arithmetic mean of the first five prime numbers (2, 3, 5, 7, 11)?',
    options: ['5.6', '4.5', '3.6', '2.5'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'In triangle ABC, angle A = 30° and angle B = 60°. What is angle C?',
    options: ['30°', '90°', '60°', '45°'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'The ratio of ₹5 and ₹0.50 is:',
    options: ['100:1', '50:1', '10:1', '5:1'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'The four-digit number known as "Kaprekar\'s constant" is:',
    options: ['7641', '7146', '6741', '6174'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question:
      '30 men can finish a piece of work in 17 days. To finish the same work in 10 days, the number of extra men required is:',
    options: ['21', '30', '51', '11'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'The diagonal of a square is 18 cm. The side of the square (in cm) is:',
    options: ['6', '9', '9√2', '18√2'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Mathematics',
    question: 'The additive inverse of 7/13 is:',
    options: ['-7/13', '7/13', '13/7', '-13/7'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Which of these does NOT belong to our solar system’s planets?',
    options: ['Neptune', 'Pluto', 'Uranus', 'Saturn'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Open defecation is a major cause of the spread of which disease?',
    options: ['Malaria', 'Elephantiasis', 'Cholera', 'Dengue'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Which of these is often referred to as the "lungs of the Earth"?',
    options: ['Mountains', 'Deserts', 'Forests', 'Rivers'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Pick up the incorrect statement:',
    options: ['Plants release oxygen', 'Oxygen does not dissolve in water', 'Oxygen helps organisms to live', 'Animals release carbon dioxide'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'This type of mirror is used as a rearview mirror in vehicles:',
    options: ['Convex mirror', 'Concave mirror', 'Plane mirror', 'Mirror with irregular surface'],
    correct: 1,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'The unit used to measure the consumption of electricity in our homes is:',
    options: ['Watt', 'Watt-hour', 'Kilowatt-hour', 'Volt'],
    correct: 3,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Which of these is a less polluting fuel?',
    options: ['Coal', 'Petrol', 'Kerosene', 'Natural gas'],
    correct: 4,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'The largest flower in the world is:',
    options: ['Bird of Paradise', 'Rafflesia', 'Passiflora', 'Bottle Brush'],
    correct: 2,
  },
  {
    year: 2018,
    subject: 'Science & EVS',
    question: 'Jim Corbett National Park is located in which state?',
    options: ['Uttar Pradesh', 'Madhya Pradesh', 'Uttarakhand', 'Chhattisgarh'],
    correct: 3,
  },

  // --- AP TET Paper 2A, August 2022 (Child Development & Pedagogy section) ---
  // Questions and options are transcribed verbatim from the official paper.
  // The scanned answer key for this paper was too garbled to read reliably
  // (repeated extraction attempts gave inconsistent digits), so the correct
  // option below was instead determined independently — standard, well
  // documented facts from educational psychology (Mendel = father of
  // genetics, Thorndike's "Animal Intelligence", Maslow's hierarchy, etc.) —
  // rather than copied from an unreadable key. See README for why.
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'One of the following is related to physical change:',
    options: ['Growth', 'Development', 'Maturity', 'Experience'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question:
      'Balu got a good voice from his parents. In addition, with proper training and encouragement he became a good singer. This shows the following developmental principle:',
    options: [
      'Development is a product of interaction',
      'Development is a continuous process',
      'Development follows an orderly sequence',
      'Development is uniform in all the stages',
    ],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The father of Genetics is:',
    options: ['Mendel', 'Maslow', 'Dalton', 'Kohlberg'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: "'Emotional catharsis' means:",
    options: ['Emotional release', 'Controlling emotional release', 'More emotional control', 'Uncontrolled emotion'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question:
      "\"A child's mind has the ability to keep up norms of universal language and universal grammatical constructions at birth.\" Stated by:",
    options: ['Bandura', 'Chomsky', 'Piaget', 'Skinner'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: "According to Guilford's theory of the structure of intelligence, the number of intelligence factors is:",
    options: ['5', '6', '30', '150'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: "The word 'Themes' in the Thematic Apperception Test (TAT) refers to:",
    options: ['Concept', 'Character', 'Story', 'Location'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: "According to Guilford, the following does NOT belong to the nature of creativity:",
    options: ['Fluency', 'Flexibility', 'Originality', 'Accuracy'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: '"Animal Intelligence: Experimental Studies" was authored by:',
    options: ['Guilford', 'Pavlov', 'Thorndike', 'Herbart'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'A person who is not accepted by the majority of members in a group is called an:',
    options: ['Isolate', 'Star', 'Extrovert', 'Introvert'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'According to Bruner, the "construction of content" should always proceed:',
    options: ['Unknown to known', 'Whole to parts', 'Difficult to easy', 'Known to unknown'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The following does NOT belong to the laws (schedules) of reinforcement:',
    options: ['Fixed Interval Reinforcement', 'Continuous Reinforcement', 'Positive Reinforcement', 'Fixed Ratio Reinforcement'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The author who proposed the "Theory of Hierarchy of Needs" is:',
    options: ['MacIver', 'McClelland', 'Atkinson', 'Maslow'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question:
      "Identification, the mental process of deliberate \"adoption\" of another person's behaviour, was defined by:",
    options: ['Binet', 'Bandura', 'Bruner', 'Vygotsky'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question:
      'Once conditioned to a stimulus, the same response occurring to any similar stimulus is called:',
    options: ['Law of Generalization', 'Law of Discrimination', 'Law of Extinction', 'Law of Spontaneous Recovery'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question:
      'According to this theory, feedback and reinforcement should be provided as soon as the organism shows a response:',
    options: ['Classical Conditioning', 'Insightful Learning', 'Trial & Error method', 'Operant Conditioning'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'Having knowledge of Sanskrit has no effect on learning swimming. This is an example of:',
    options: ['Positive Transfer', 'Zero Transfer', 'Bilateral Transfer', 'Negative Transfer'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The gradual development of innate abilities in a person with age is called:',
    options: ['Practice', 'Learning', 'Motivation', 'Maturation'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'ENIAC and EDSAC belong to the:',
    options: ['First Generation Computers', 'Second Generation Computers', 'Third Generation Computers', 'Fourth Generation Computers'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'Learning through the sense organs is called:',
    options: ['Motor Learning', 'Verbal Learning', 'Conceptual Learning', 'Perceptual Learning'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: '"85% of cumulative brain development occurs before the age of six years" is stated by:',
    options: ['RTE - 2009', 'NCERT', 'NEP - 2020', 'NCF – 2005'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The first school for the blind was established in Paris in 1784 by:',
    options: ['Lal Behari Shah', 'Sir Valentin Haüy', 'Braille', 'Helen Keller'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'The Indian constitution prohibits the employment of children in factories under this article:',
    options: ['18', '19', '23', '24'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'Child Development & Pedagogy',
    question: 'Quarterly, half-yearly, and annual exams come under:',
    options: ['Formative evaluation', 'Summative evaluation', 'Board exams', 'Competency based assessment'],
    correct: 2,
  },

  // --- AP TET Paper 2A, August 2022 (English section) ---
  // Same sourcing note as above: real questions and options from the
  // official paper, correct option determined independently through
  // standard English grammar/usage rules since the scanned key was
  // unreadable, rather than copied from a garbled scan.
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: '"Don\'t sleep." Choose the passive voice of the sentence:',
    options: ['You ordered not to sleep.', 'You ordered to not sleep.', 'You are instructed not to sleep.', 'You are requested not to sleep.'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the grammatically correct question:',
    options: ['Does the rainbow appear in the sky?', 'Do the rainbow appear in the sky?', 'Do the rainbow appears in the sky?', 'Does the rainbow appears in the sky?'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the expression used to give a negative reply in a polite way:',
    options: ['Thank you.', 'No, thanks.', 'Yes, please.', "You're welcome."],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the article which is used before superlative adjectives:',
    options: ['a', 'an', 'the', 'None'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: '"We haven\'t had our dinner yet, _______?" Choose the correct question tag:',
    options: ['have we?', 'had we?', "haven't we?", "didn't we?"],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: "Choose the correct prefix to get the opposite word for 'use':",
    options: ['ir', 'mis', 'im', 'il'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the word that falls between these guide words: sceptic – scientist',
    options: ['scripture', 'scrawl', 'schedule', 'scandal'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the correct spelling of the word:',
    options: ['militaristic', 'militerstic', 'militarestic', 'militiristic'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the word that must always begin with a capital letter:',
    options: ['bike', 'boy', 'birthday', 'Bobby'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: "\"It scooted into the sugarcane field.\" Choose the synonym of the word 'scooted':",
    options: ['crawled', 'crept', 'rushed', 'poked'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      '"...do some boating in the serene waters of the reservoir." Choose the antonym of the word \'serene\':',
    options: ['placid', 'agitated', 'lush', 'gloomy'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: '"The teacher said, \'You may go now.\'" Choose the indirect speech of the sentence:',
    options: [
      'The teacher told me that he might go now.',
      'The teacher requested me to go then.',
      'The teacher permitted me to go then.',
      'The teacher said that you may go now.',
    ],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Shakespeare is ________ dramatist. Choose the expression that fits the blank:',
    options: ['greater than most other', 'greater than all other', 'the greatest', 'so great as than that'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      'Since the eruption _______, all the villages on the slopes of the volcano have been evacuated. Choose the verb that fits the blank:',
    options: ['has been starting', 'started', 'has to start', 'was starting'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      'So far this week there _______ three burglaries in our street. Choose the verb that fits the blank:',
    options: ['will be being', 'has been', 'have been', 'is'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: "\"He came from America.\" The meaning of 'came from' is:",
    options: ['originated from', 'thought well', 'destroyed', 'arrived at'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      '"The man who is standing next to Percy is my brother." Choose the simple sentence form:',
    options: [
      'My brother and Percy are standing next to the man.',
      'My brother is Percy and she is next to me.',
      'The man standing next to Percy is my brother.',
      'Percy is my brother standing next to me.',
    ],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'My brother was ______ for the new jobs in the company. Choose the option that fits the blank:',
    options: ['over the year', 'between the two chairs', 'among the successful applicants', 'until the last of him'],
    correct: 3,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      'I pushed the button ______ the door, but there was no answer. Choose the word that does NOT fit the blank:',
    options: ['beside', 'by', 'next to', 'among'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      'Both the siblings were mentally unstable _______ their disturbed childhood. Choose the expression that fits the blank:',
    options: ['on account of', 'seeing that', 'on the top', 'moreover'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'I got stuck in the traffic, ______ I missed the flight. Choose the linker that fits the blank:',
    options: ['on the top', 'on account of', 'seeing that', 'consequently'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the grammatically correct sentence:',
    options: [
      "Don't ask me for money.",
      'Sanjana is going to home.',
      'The earth is moving round the sun.',
      'I am owning a car.',
    ],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the grammatically correct sentence regarding simple future:',
    options: ['She lost her will power.', 'She will lost her power.', 'She lost power to her will.', 'She will lose her power.'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the feminine noun from the following:',
    options: ['witch', 'wizard', 'drake', 'czar'],
    correct: 1,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Choose the word that can be used as a subject:',
    options: ['them', 'our', 'myself', 'mine'],
    correct: 4,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: '"Preethi could swim when she was five years old." This sentence indicates:',
    options: ['future possibility', 'past ability', 'taking permission', 'slight possibility'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question:
      'The players, as well as the captain, ______ to win. Choose the word that fits the blank:',
    options: ['wanting', 'want', 'wants', 'was wanted'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: "In the passage on nutritional diseases, 'Obesity' means:",
    options: ['having many diseases', 'having overweight', 'having no proteins in food', 'taking food without fats'],
    correct: 2,
  },
  {
    year: 2022,
    paper: 'AP TET Paper 2A, August 2022',
    subject: 'English',
    question: 'Inadequacy of proteins and carbohydrates in food leads to:',
    options: ['Marasmus', 'Kwashiorkor', 'Obesity', 'Producing oils'],
    correct: 1,
  },

  // --- AP TET Paper 2A, March 2024 (English section) ---
  // Same sourcing note: real questions/options from the official 6 March
  // 2024 paper; no answer key was available for this session at all, so
  // the correct option was determined independently via straightforward
  // reading comprehension and grammar — no historical/scientific trivia
  // involved in this small batch, so confidence is high.
  {
    year: 2024,
    paper: 'AP TET Paper 2A, March 2024',
    subject: 'English',
    question:
      'Read the conversation: A: "My examinations are in the next month." B: "If I were you, I would not waste time." In this conversation, B offered:',
    options: ['his help', 'his suggestion', 'his time', 'his message'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 2A, March 2024',
    subject: 'English',
    question: '"The teacher said to the boy, \'Keep it up.\'" The purpose of the sentence in inverted commas is:',
    options: ['to permit', 'to disappoint', 'to offer help', 'to encourage'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 2A, March 2024',
    subject: 'English',
    question: 'Choose the option that shows an appropriate way to address the recipient in a professional email:',
    options: ['Hey', 'Dear Mr. Smith', 'Hitherto', 'Go'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 2A, March 2024',
    subject: 'English',
    question: 'Choose the option that is NOT a tip for writing a short story:',
    options: ['starting a short story', 'developing compelling characters', 'writing as much detail as possible', 'seeking feedback from others'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 2A, March 2024',
    subject: 'English',
    question: 'Choose the correctly punctuated sentence:',
    options: [
      "Ravi said, 'I want to go to New York next year.'",
      "Ravi said, 'I want to go to New York next year",
      "Ravi said, 'I want to go to New York next year'.",
      "Ravi said, 'I want to go to New York next year').",
    ],
    correct: 1,
  },

  // --- AP TET Paper 1A (Set-1), 2024 ---
  // Found via a link the user shared from the AP Commissioner of School
  // Education site (cse.ap.gov.in), which pointed to a compiled previous-
  // papers PDF covering 2017-2024. This document had a much cleaner,
  // reliably-readable answer key than the 2022/2024 Paper 2A papers used
  // above, so most answers here ARE a direct read of that key — but every
  // one was still independently spot-checked (grammar rules, arithmetic,
  // or well-established facts) before being included, and a handful of
  // math questions that failed that check (the extracted numbers didn't
  // actually work out) were left out rather than included anyway.
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The most successful child-rearing style is:',
    options: ['Authoritative style', 'Authoritarian style', 'Permissive style', 'Uninvolved style'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is wrongly mentioned as a principle of development?',
    options: ['Development is continuous', 'There exist individual differences in development', 'Development is cumulative', 'Development cannot be predicted'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is wrongly stated with regard to the Sensori-Motor Stage?',
    options: [
      'In this stage the child is a reflexive organism',
      'The concept of object permanence is formed in this stage',
      'Children in this stage can think abstractly',
      'This stage takes place from birth to 2 years of age',
    ],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'According to Erikson, the social conflict faced by children during 3 to 6 years of age is:',
    options: ['Trust vs. Mistrust', 'Initiative vs. Guilt', 'Industry vs. Inferiority', 'Intimacy vs. Isolation'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: '"Army Alpha test" is an example of:',
    options: ['Individual Test of Intelligence', 'Group test of Intelligence', 'Performance Test', 'Non-verbal test of Intelligence'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The "Two factor theory of intelligence" was proposed by:',
    options: ['Thorndike', 'Gardner', 'Spearman', 'Thurstone'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The number of sub-tests in the Differential Aptitude Test is:',
    options: ['6', '8', '10', '11'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The second stage in the creative process is:',
    options: ['Verification stage', 'Stage of Preparation', 'Stage of Incubation', 'Stage of Insight'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Persons with this type of thinking have the ability to generate multiple solutions:',
    options: ['Concrete thinking', 'Convergent thinking', 'Divergent thinking', 'Non-directive thinking'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is NOT a projective test of personality?',
    options: ["Rorschach Ink Blot test", "Children's Apperception test", 'Personality Inventory', 'Word Association Test'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question:
      'Ayan wants to avoid doing his homework, but also wants to avoid being punished for not doing it. This conflict is:',
    options: ['Approach-Approach', 'Approach-Avoidance', 'Avoidance-Avoidance', 'Double Approach-Avoidance'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The Clinical Method is also known as:',
    options: ['Case study Method', 'Introspection Method', 'Action research', 'Longitudinal Method'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is wrongly stated regarding the characteristics of learning?',
    options: ['Learning is a goal-directed activity', 'Learning is cumulative in nature', 'Learning is dynamic', 'Learning is not a process, it is a product'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'A Hindi speaker learning Sanskrit shows which type of transfer of learning?',
    options: ['Positive', 'Negative', 'Zero', 'Bilateral'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The book "On Memory" was written by:',
    options: ['Ebbinghaus', 'Bartlett', 'Freud', 'Galton'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: "In Pavlov's experiment, 'food' is the:",
    options: ['Conditioned stimulus', 'Conditioned response', 'Unconditioned stimulus', 'Unconditioned response'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is NOT a Gestaltist?',
    options: ['Kohler', 'Koffka', 'Wertheimer', 'Skinner'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: "'Figure-ground relationship' is related to:",
    options: ['Attitude', 'Perception', 'Aptitude', 'Creativity'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is NOT related to the cognitive domain?',
    options: ['Analysis', 'Evaluation', 'Application', 'Imitation'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: "Persons with 'dyslexia' will face difficulties mainly in:",
    options: ['Reading', 'Speaking', 'Writing', 'Calculating'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The first step in the Project Method is:',
    options: ['Creating a Situation', 'Planning', 'Implementation', 'Evaluation'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is NOT an input device?',
    options: ['Scanner', 'Keyboard', 'Touch pad', 'Printer'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: '1 kilobyte equals:',
    options: ['1000 Bytes', '1024 Bytes', '1024 Bits', '1000 Bits'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'The expanded form of MOOC is:',
    options: ['Mobile Open Online Course', 'Massive Open Online Course', 'Master of Online Certification', 'Mobile Oriented Online Certificate'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: "According to RTE-2009, 'Elementary Education' means:",
    options: ['Classes 1 to 5', 'Pre-Primary Education', 'Classes 1 to 7', 'Classes 1 to 8'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'As per NEP 2020, by which year is teacher education to be moved entirely into multidisciplinary institutions?',
    options: ['2025', '2030', '2032', '2035'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Under the "Jagananna Amma Vodi" scheme, the minimum school attendance required is:',
    options: ['50%', '70%', '75%', '80%'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Directive counselling was introduced by:',
    options: ['Williamson', 'F.C. Thorne', 'Rogers', 'James'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Child Development & Pedagogy',
    question: 'Which of the following is NOT a teacher-centered method?',
    options: ['Lecture Method', 'Heuristic Method', 'Historical Method', 'Lecture Demonstration Method'],
    correct: 2,
  },

  // --- AP TET Paper 1A (Set-1), 2024 — English ---
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Take this book if you ________.',
    options: ['like', 'will like', 'would like', 'are like'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'She ______ a cup of coffee for me a few minutes ago.',
    options: ['maked', 'make', 'makes', 'made'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the grammatically correct sentence:',
    options: ['I came here by walk.', 'I came here by foot.', 'I came here on foot.', 'I came here by foot by walk.'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'The purpose of using dialogue tags is:',
    options: ['to confuse readers about who is speaking', 'to attribute speech to characters', 'to omit punctuation marks', 'to create tension'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the punctuation mark which separates items in a list:',
    options: ['Semicolon (;)', 'Comma (,)', 'Quotation marks (" ")', "Apostrophe (')"],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the correct dictionary (alphabetical) sequence for: A. message  B. memorable  C. mentor  D. member',
    options: ['B D A C', 'A C D B', 'D B C A', 'C A D B'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Identify the linker that indicates contrast:',
    options: ['however', 'next', 'first', 'afterwards'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Identify the complex sentence:',
    options: [
      "She doesn't use a computer.",
      'I went to the market and I bought some milk.',
      'They will meet us at the skating area.',
      "Although it was cold outside, she didn't wear a coat.",
    ],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the correct irregular plural of "mouse":',
    options: ['mouses', 'mousis', 'mice', 'mouseys'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: '"_____ can come to the party if ______ want to." Choose the correct pair of pronouns:',
    options: ['Everybody, he', 'Nobody, she', 'Anybody, they', 'Anybody, you'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the phrasal verb that means "to refuse or reject something":',
    options: ['put up', 'set in', 'turn down', 'set out'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Which of the following is true about imperative sentences?',
    options: [
      'They usually express strong emotions.',
      'They always begin with interrogative words.',
      'They give commands, instructions or requests.',
      'They provide information or state facts.',
    ],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the indirect speech of: He said to me, "Let\'s go home together."',
    options: [
      'He proposed to me that we should go home together.',
      'He urged me to go home with him.',
      'He asked me to go home with him.',
      'He proposed me to go home together.',
    ],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Some of the fruit cake _______ gone. Choose the correct verb:',
    options: ['is', 'are', 'were', 'be'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the one-word substitute for "Belonging to all parts of the world":',
    options: ['native', 'cosmopolitan', 'omnipresent', 'puritan'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the correctly spelt word:',
    options: ['gypses', 'gypsies', 'gypsees', 'gypseis'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the meaning of "monsoon mist":',
    options: ['sunshine', 'fog', 'snow', 'haze'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the antonym of "more" as used in the given context:',
    options: ['additional', 'extra', 'less', 'further'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'LAD, the inborn human trait described in psycho-linguistics, stands for:',
    options: ['Learning Activities Device', 'Learning Acquisition Design', 'Language Acquisition Device', 'Language Activities Design'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Identify the pair of graphic-motor skills:',
    options: ['Listening and reading', 'Listening and writing', 'Reading and writing', 'Listening and speaking'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Identify the content word:',
    options: ['as', 'before', 'within', 'brave'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'The main aim of composition (writing) is to:',
    options: [
      "communicate one's thoughts in an organized way",
      "communicate one's thoughts in a zig-zag way",
      'explore phonetics',
      "improve one's handwriting",
    ],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'If a teacher lacks imagination, the Bilingual Method tends to end up as the:',
    options: ['Innovative Method', 'Grammar Translation Method', 'Direct Method', 'Deductive Method'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: '"The Silent Way" method of language teaching was introduced by:',
    options: ['Holmer', 'Hymes', 'Michel West', 'Gattegno'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'I will walk ______ the supermarket.',
    options: ['to upto', 'off of', 'upto', 'due to'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Noun clauses replace _______ in a sentence:',
    options: ['individual nouns', 'compound adjectives', 'compound prepositions', 'relative pronouns'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'What function does "ought to" perform in "You ought to apologize"?',
    options: ['Past habit', 'Conditional statement', 'Moral obligation', 'Future intention'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'English',
    question: 'Choose the correct statement about the article used in "He is a doctor":',
    options: ["The article should be omitted.", "The article should be 'the'.", 'The article is used correctly.', "The article should be 'an'."],
    correct: 3,
  },

  // --- AP TET Paper 1A (Set-1), 2024 — Mathematics ---
  // Only the questions whose numbers independently recompute to the stated
  // answer are included; a few (a fraction-simplification problem and an
  // average-of-innings problem, among others) didn't check out on
  // recalculation and were left out rather than guessed at.
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'In a game, Avinash won 5 marbles from each of his 6 friends. How many marbles did Avinash win in total?',
    options: ['36', '5', '25', '30'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'The product of a number and 5 is zero. The number is:',
    options: ['–5', '5', '0', '1'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: '24 girls and 16 boys attended a picnic. What is the ratio of girls to boys?',
    options: ['2:3', '3:2', '1:3', '3:1'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'Convert 5/4 to a percentage:',
    options: ['50%', '75%', '100%', '125%'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'A pair of roller skates costs Rs. 450, with 5% sales tax added. What is the total bill amount?',
    options: ['Rs. 427.50', 'Rs. 472.50', 'Rs. 427', 'Rs. 450'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'A principal of Rs. 1200 is invested at 12% simple interest per annum for 3 years. What amount is to be paid at the end?',
    options: ['Rs. 1623', 'Rs. 1632', 'Rs. 1600', 'Rs. 1625'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'What is the perimeter of a square with a side of 7 cm?',
    options: ['25 cm', '28 cm', '35 cm', '40 cm'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'A rhombus with 4 right angles is called a:',
    options: ['Rectangle', 'Trapezium', 'Square', 'Parallelogram'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'What is the total number of faces on a cuboid?',
    options: ['4', '12', '6', '8'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Mathematics',
    question: 'What is the circumference of a circle with a diameter of 28 cm? (use π = 22/7)',
    options: ['120 cm', '100 cm', '70 cm', '88 cm'],
    correct: 4,
  },

  // --- AP TET Paper 1A (Set-1), 2024 — Science & EVS ---
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The Indian giant squirrel is a(n):',
    options: ['Endangered species', 'Extinct species', 'Endemic species', 'Invasive species'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The force exerted by a charged body on another charged (or uncharged) body is called:',
    options: ['Muscular force', 'Electrostatic force', 'Gravitational force', 'Magnetic force'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'Which of the following is a fossil fuel?',
    options: ['Coal', 'Hydrogen', 'Wood', 'Cow dung cake'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'Which thread is stronger than a steel wire of the same thickness?',
    options: ['Cotton thread', 'Nylon thread', 'Woolen thread', 'Silk thread'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The reddish-brown gland situated in the right upper part of the abdomen is the:',
    options: ['Pancreas', 'Liver', 'Spleen', 'Adrenal gland'],
    correct: 2,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'Aquatic animals like fish excrete their nitrogenous waste mainly in the form of:',
    options: ['Urea', 'Uric acid', 'Ammonia', 'Nitrogen'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The pattern made by veins in a leaf is called:',
    options: ['Petiole', 'Lamina', 'Venation', 'Mid rib'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The mission initiated by the Government of India to provide toilets for everyone is:',
    options: ['Vande Bharat', 'Nipun Bharat', 'Sreshta Bharat', 'Swachh Bharat'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'Bones become soft and bent due to a deficiency of:',
    options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'],
    correct: 4,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'The pipe-like structure that passes swallowed food into the stomach is the:',
    options: ['Oesophagus', 'Intestine', 'Trachea', 'Duodenum'],
    correct: 1,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'An example of a vehicle that is pulled by animals is:',
    options: ['Car', 'Cycle', 'Tonga', 'Auto rickshaw'],
    correct: 3,
  },
  {
    year: 2024,
    paper: 'AP TET Paper 1A (Set 1), 2024',
    subject: 'Science & EVS',
    question: 'Choose the correct set of indoor games:',
    options: ['Chess, Cricket, Ludo', 'Chinese checker, Carroms, Kho-Kho', 'Ludo, Chess, Carroms', 'Kabaddi, Kho-Kho, Tennikoit'],
    correct: 3,
  },
];

function seedTetQuestions() {
  db.exec('DELETE FROM tet_questions;');
  const insert = db.prepare(
    `INSERT INTO tet_questions (id, subject, question, option_a, option_b, option_c, option_d, correct_option, source, year)
     VALUES (@id, @subject, @question, @option_a, @option_b, @option_c, @option_d, @correct_option, @source, @year)`
  );
  for (const q of TET_QUESTIONS) {
    insert.run({
      id: id(),
      subject: q.subject,
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_option: q.correct,
      source: q.paper || `AP TET Paper 1, June ${q.year}`,
      year: q.year,
    });
  }
}

function seed() {
  db.exec(`
    DELETE FROM fee_history;
    DELETE FROM fees;
    DELETE FROM attendance;
    DELETE FROM homework;
    DELETE FROM diary_entries;
    DELETE FROM students;
    DELETE FROM users;
    DELETE FROM classes;
  `);

  seedTetQuestions();

  const classId = 'class-6b';
  db.prepare('INSERT INTO classes (id, name) VALUES (?, ?)').run(classId, 'Class 6-B');

  const teacherId = id();
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, class_id, student_id) VALUES (?, ?, ?, ?, ?, ?, NULL)'
  ).run(teacherId, 'teacher@vidyabandham.local', bcrypt.hashSync('teacher123', 10), 'teacher', 'Ms. Anjali Rao', classId);

  const students = [
    { name: 'Aarav Mehta', roll: '07' },
    { name: 'Diya Kulkarni', roll: '08' },
    { name: 'Ishaan Verma', roll: '09' },
    { name: 'Meher Kaur', roll: '10' },
  ];

  const studentIds = {};
  for (const s of students) {
    const sid = id();
    studentIds[s.name] = sid;
    db.prepare('INSERT INTO students (id, name, roll, class_id, parent_user_id) VALUES (?, ?, ?, ?, NULL)').run(
      sid,
      s.name,
      s.roll,
      classId
    );
  }

  // One parent login, linked to Aarav, so there's something to sign in with on day one.
  const parentId = id();
  const aaravId = studentIds['Aarav Mehta'];
  db.prepare(
    'INSERT INTO users (id, email, password_hash, role, name, class_id, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(parentId, 'parent@vidyabandham.local', bcrypt.hashSync('parent123', 10), 'parent', "Aarav's Parent", classId, aaravId);
  db.prepare('UPDATE students SET parent_user_id = ? WHERE id = ?').run(parentId, aaravId);

  db.prepare('INSERT INTO diary_entries (id, class_id, who, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id(),
    classId,
    'Ms. Anjali Rao',
    'PTM this Saturday, 20 Sep at 10 AM. Please bring the last unit test copy along.',
    now()
  );

  db.prepare('INSERT INTO homework (id, class_id, subject, task, due, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id(),
    classId,
    'Mathematics',
    'Exercise 4.2, questions 1-10',
    'Due tomorrow',
    now()
  );

  db.prepare(
    'INSERT INTO fees (student_id, class_id, term, amount, due_date, paid, parent_marked_paid_at, paid_at) VALUES (?, ?, ?, ?, ?, 0, NULL, NULL)'
  ).run(aaravId, classId, 'Term 2', 18500, '30 Sep');

  console.log('Seed complete.');
  console.log('Teacher login:  teacher@vidyabandham.local / teacher123');
  console.log('Parent login:   parent@vidyabandham.local / parent123  (linked to Aarav Mehta)');
}

// Only seeds if the database has no class yet — safe to call on every server
// startup without wiping data someone's actually added (e.g. on your own
// computer, where the file persists between restarts).
function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) AS count FROM classes').get();
  if (row.count === 0) {
    console.log('Database is empty — seeding demo data...');
    seed();
  }
}

module.exports = { seed, seedIfEmpty };

// Allows `npm run seed` / `node src/seed.js` to still work exactly as before,
// always resetting to fresh demo data regardless of what's already there.
if (require.main === module) {
  seed();
}
