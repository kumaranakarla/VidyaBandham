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
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "A father who had failed in the Civil Services examination felt as if he himself had succeeded when his son later cleared it. This is an example of which defense mechanism?",
    "options": [
      "Withdrawal",
      "Projection",
      "Repression",
      "Identification"
    ],
    "correct": 4,
    "question_te": "సివిల్ సర్వీసెస్ పరీక్షలో విఫలమైన తండ్రి, తన కుమారుడు తర్వాత ఆ పరీక్షలో ఉత్తీర్ణుడైనప్పుడు తానే విజయం సాధించినట్లు భావించాడు. ఇది ఏ రక్షణ యంత్రాంగానికి ఉదాహరణ?",
    "options_te": [
      "ఉపసంహరణ",
      "ప్రక్షేపణం",
      "దమనం",
      "తాదాత్మ్యీకరణ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Prasanthi was selected for both a teaching post and a bank clerk post, and likes both equally. What type of conflict is this?",
    "options": [
      "Approach-Avoidance",
      "Approach-Approach",
      "Avoidance-Avoidance",
      "Double Approach-Avoidance"
    ],
    "correct": 2,
    "question_te": "ప్రశాంతికి ఉపాధ్యాయ ఉద్యోగం మరియు బ్యాంకు క్లర్క్ ఉద్యోగం రెండూ వచ్చాయి, ఆమెకు రెండూ సమానంగా ఇష్టం. ఇది ఏ రకమైన సంఘర్షణ?",
    "options_te": [
      "సామీప్య-పరిహార్య సంఘర్షణ",
      "సామీప్య-సామీప్య సంఘర్షణ",
      "పరిహార్య-పరిహార్య సంఘర్షణ",
      "ద్వంద్వ సామీప్య-పరిహార్య సంఘర్షణ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Children who show security and self-reliance typically come from parents who:",
    "options": [
      "Over-care for their children",
      "Are submissive to their children",
      "Play with their children",
      "Are authoritarian"
    ],
    "correct": 3,
    "question_te": "భద్రత మరియు ఆత్మనిర్భరత కనబరిచే పిల్లలు సాధారణంగా ఎలాంటి తల్లిదండ్రుల నుండి వస్తారు?",
    "options_te": [
      "పిల్లలను అతిగా జాగ్రత్తగా చూసుకునే",
      "పిల్లల మాట వినే (విధేయత చూపే)",
      "పిల్లలతో ఆడుకునే",
      "నిరంకుశంగా ప్రవర్తించే"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "The \"naive hedonistic orientation\" stage belongs to which level of moral development?",
    "options": [
      "Conventional",
      "Post-conventional",
      "Pre-conventional",
      "Natural moral level"
    ],
    "correct": 3,
    "question_te": "\"అమాయక సుఖవాద ధోరణి\" దశ నైతిక వికాసంలో ఏ స్థాయికి చెందుతుంది?",
    "options_te": [
      "సాంప్రదాయిక స్థాయి",
      "ఉత్తర సాంప్రదాయిక స్థాయి",
      "పూర్వ సాంప్రదాయిక స్థాయి",
      "సహజ నైతిక స్థాయి"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "The concept of the \"Zone of Proximal Development\" was proposed by:",
    "options": [
      "Bandura",
      "Bruner",
      "Piaget",
      "Vygotsky"
    ],
    "correct": 4,
    "question_te": "\"సన్నిహిత వికాస మండలం\" (Zone of Proximal Development) భావనను ప్రతిపాదించినది:",
    "options_te": [
      "బండూరా",
      "బ్రూనర్",
      "పియాజె",
      "వైగోట్‌స్కీ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "A main objective of Continuous and Comprehensive Evaluation (CCE) is to:",
    "options": [
      "Encourage rote memory",
      "Provide continuous feedback for improvement",
      "Be strictly teacher-centered",
      "Assess only cognitive skills"
    ],
    "correct": 2,
    "question_te": "నిరంతర సమగ్ర మూల్యాంకనం (CCE) యొక్క ప్రధాన లక్ష్యం:",
    "options_te": [
      "బట్టీ చదువును ప్రోత్సహించడం",
      "మెరుగుదల కోసం నిరంతర స్పందన అందించడం",
      "పూర్తిగా ఉపాధ్యాయ కేంద్రీకృతంగా ఉండడం",
      "జ్ఞానాత్మక నైపుణ్యాలను మాత్రమే మూల్యాంకనం చేయడం"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Maturation refers to the emergence of an organism's genetic potential, as described by:",
    "options": [
      "Anderson",
      "Erickson",
      "Gessel",
      "Craig"
    ],
    "correct": 3,
    "question_te": "జీవి యొక్క జన్యుపరమైన సామర్థ్యం వ్యక్తమవడాన్ని పరిపక్వత అంటారని పేర్కొన్నది:",
    "options_te": [
      "ఆండర్సన్",
      "ఎరిక్సన్",
      "గెసెల్",
      "క్రెయిగ్"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "According to Piaget, children will learn the concept of object permanence during the:",
    "options": [
      "Sensory motor stage",
      "Pre-operational stage",
      "Concrete operational stage",
      "Formal operational stage"
    ],
    "correct": 1,
    "question_te": "పియాజె ప్రకారం, పిల్లలు \"వస్తు స్థిరత్వం\" భావనను ఏ దశలో నేర్చుకుంటారు?",
    "options_te": [
      "ఇంద్రియ చాలక దశ",
      "పూర్వ-సంక్రియా దశ",
      "మూర్త సంక్రియా దశ",
      "అమూర్త సంక్రియా దశ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "\"The moral development of a person depends on the person's cognitive abilities\" was opined by:",
    "options": [
      "Chomsky",
      "Tolman",
      "Piaget",
      "Kohlberg"
    ],
    "correct": 4,
    "question_te": "\"వ్యక్తి నైతిక వికాసం అతని జ్ఞానాత్మక సామర్థ్యాలపై ఆధారపడి ఉంటుంది\" అని అభిప్రాయపడినది:",
    "options_te": [
      "చామ్‌స్కీ",
      "టోల్‌మన్",
      "పియాజె",
      "కోల్‌బర్గ్"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "According to Erikson, the psychosocial critical situation faced by children during adolescence is:",
    "options": [
      "Trust vs. Mistrust",
      "Autonomy vs. Doubt",
      "Role identity vs. Role confusion",
      "Integrity vs. Despair"
    ],
    "correct": 3,
    "question_te": "ఎరిక్సన్ ప్రకారం, కౌమార దశలో పిల్లలు ఎదుర్కొనే మానసిక-సామాజిక సంక్షోభం:",
    "options_te": [
      "విశ్వాసం vs అవిశ్వాసం",
      "స్వతంత్రత vs సందేహం",
      "పాత్ర గుర్తింపు vs పాత్ర గందరగోళం",
      "సమగ్రత vs నిరాశ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Rishi wants to purchase a car but he is scared of its maintenance cost. What type of conflict is this?",
    "options": [
      "Approach-Approach",
      "Avoidance-Avoidance",
      "Approach-Avoidance",
      "Double Approach-Avoidance"
    ],
    "correct": 3,
    "question_te": "రిషి కారు కొనాలనుకుంటున్నాడు, కానీ దాని నిర్వహణ ఖర్చు గురించి భయపడుతున్నాడు. ఇది ఏ రకమైన సంఘర్షణ?",
    "options_te": [
      "సామీప్య-సామీప్య సంఘర్షణ",
      "పరిహార్య-పరిహార్య సంఘర్షణ",
      "సామీప్య-పరిహార్య సంఘర్షణ",
      "ద్వంద్వ సామీప్య-పరిహార్య సంఘర్షణ"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Abhishek was scolded by his class teacher for no reason. He got angry with his teacher but showed his anger at his younger brother at home instead. Which defense mechanism is this?",
    "options": [
      "Displacement",
      "Repression",
      "Identification",
      "Regression"
    ],
    "correct": 1,
    "question_te": "అభిషేక్‌ను అతని తరగతి ఉపాధ్యాయురాలు కారణం లేకుండా తిట్టింది. అతను తన ఉపాధ్యాయురాలిపై కోపం తెచ్చుకున్నా, ఆ కోపాన్ని ఇంట్లో తన తమ్ముడిపై చూపించాడు. ఇది ఏ రక్షణ యంత్రాంగం?",
    "options_te": [
      "స్థానభ్రంశం",
      "దమనం",
      "తాదాత్మ్యీకరణ",
      "తిరోగమనం"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Maslow's theory of hierarchy of needs was proposed by:",
    "options": [
      "Watson",
      "Hurlock",
      "Maslow",
      "Atkinson"
    ],
    "correct": 3,
    "question_te": "అవసరాల శ్రేణీక్రమ సిద్ధాంతాన్ని ప్రతిపాదించినది:",
    "options_te": [
      "వాట్సన్",
      "హర్లాక్",
      "మాస్లో",
      "అట్కిన్సన్"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "In Pavlov's experiment, a dog salivated when food was given along with the sound of a bell. Here, the salivation of the dog on hearing the bell alone is a:",
    "options": [
      "Conditioned stimulus",
      "Conditioned response",
      "Unconditioned stimulus",
      "Unconditioned response"
    ],
    "correct": 2,
    "question_te": "పావ్లోవ్ ప్రయోగంలో, ఆహారంతో పాటు గంట శబ్దం వినిపించినప్పుడు కుక్క లాలాజలం స్రవించింది. ఇక్కడ, గంట శబ్దం మాత్రమే విన్నప్పుడు కుక్క లాలాజలం స్రవించడం అనేది:",
    "options_te": [
      "అనుకూలిత ప్రేరణ",
      "అనుకూలిత ప్రతిస్పందన",
      "అసంకేతిత ప్రేరణ",
      "అసంకేతిత ప్రతిస్పందన"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "Non-directive counseling was introduced by:",
    "options": [
      "Freud",
      "Williamson",
      "Rogers",
      "Thorne"
    ],
    "correct": 3,
    "question_te": "అనిర్దేశిత సలహా పద్ధతిని ప్రవేశపెట్టినది:",
    "options_te": [
      "ఫ్రాయిడ్",
      "విలియమ్సన్",
      "రోజర్స్",
      "థార్న్"
    ]
  },
  {
    "year": 2018,
    "subject": "Child Development & Pedagogy",
    "question": "The teaching method explained by Kilpatrick is the:",
    "options": [
      "Lecture method",
      "Heuristic method",
      "Project method",
      "Historical method"
    ],
    "correct": 3,
    "question_te": "కిల్‌పాట్రిక్ వివరించిన బోధనా పద్ధతి:",
    "options_te": [
      "ఉపన్యాస పద్ధతి",
      "అన్వేషణ పద్ధతి",
      "ప్రాజెక్టు పద్ధతి",
      "చారిత్రక పద్ధతి"
    ]
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "What does the phrase \"healthy appetite\" mean?",
    "options": [
      "Ready to work",
      "Desire to eat",
      "A complaint",
      "An amusing ability"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the correct synonym for \"vanish\":",
    "options": [
      "Live",
      "Move",
      "Fall",
      "Disappear"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the correct antonym for \"feeble\":",
    "options": [
      "Happy",
      "Strong",
      "Active",
      "Serious"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the correctly spelled word:",
    "options": [
      "Harmoneous",
      "Harmonious",
      "Harmonies",
      "Harmonus"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "\"She did not go to school as she was ill\" is which type of sentence?",
    "options": [
      "Simple",
      "Compound",
      "Complex",
      "Interrogative"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the grammatically correct sentence:",
    "options": [
      "She not understanding",
      "She does not understand",
      "She was not understanding",
      "She not understand"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "\"The crew of the ship was very friendly and courteous.\" Choose the antonym of the word 'courteous':",
    "options": [
      "Affable",
      "Civil",
      "Rude",
      "Respectful"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the word with the wrong spelling:",
    "options": [
      "Commemorate",
      "Epilipsy",
      "Virulent",
      "Museum"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the conjunction that can be used to write a complex sentence:",
    "options": [
      "But",
      "Else",
      "Because",
      "And"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "Choose the grammatically correct sentence from the following:",
    "options": [
      "One of my friend is visiting me tomorrow",
      "One of my friend are visiting me tomorrow",
      "One of my friends are visiting me tomorrow",
      "One of my friends is visiting me tomorrow"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "\"The teacher said to Ravi, 'You are absolutely right.'\" Choose the correct reported speech of the sentence:",
    "options": [
      "The teacher said to Ravi that he is absolutely right",
      "The teacher said to Ravi that he was absolutely right",
      "The teacher told Ravi that he was absolutely right",
      "The teacher told Ravi that you are absolutely right"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "subject": "English",
    "question": "The type of reading that is useful for getting every detail of a text is:",
    "options": [
      "Extensive reading",
      "Intensive reading",
      "Slow reading",
      "Graphic reading"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "What is the multiplicative inverse of 13/19?",
    "options": [
      "13/19",
      "19/13",
      "19/13",
      "1"
    ],
    "correct": 3,
    "question_te": "13/19 యొక్క గుణకార విలోమం ఎంత?",
    "options_te": [
      "13/19",
      "19/13",
      "19/13",
      "1"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "Which of the following represents the commutative property?",
    "options": [
      "a(b+c) = ab+ac",
      "a+(b+c) = (a+b)+c",
      "a(b+c) = (ab)+(ac)",
      "ab = ba"
    ],
    "correct": 4,
    "question_te": "కింది వాటిలో స్థిత్యంతర (వినిమయ) ధర్మాన్ని సూచించేది ఏది?",
    "options_te": [
      "a(b+c) = ab+ac",
      "a+(b+c) = (a+b)+c",
      "a(b+c) = (ab)+(ac)",
      "ab = ba"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "How many perfect cube numbers are there between 1 and 100?",
    "options": [
      "9",
      "10",
      "3",
      "13"
    ],
    "correct": 3,
    "question_te": "1 నుండి 100 మధ్య పూర్ణ ఘనసంఖ్యలు ఎన్ని ఉన్నాయి?",
    "options_te": [
      "9",
      "10",
      "3",
      "13"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "What is the arithmetic mean of the first five prime numbers (2, 3, 5, 7, 11)?",
    "options": [
      "5.6",
      "4.5",
      "3.6",
      "2.5"
    ],
    "correct": 1,
    "question_te": "మొదటి ఐదు ప్రధాన సంఖ్యల (2, 3, 5, 7, 11) అంకగణిత సగటు ఎంత?",
    "options_te": [
      "5.6",
      "4.5",
      "3.6",
      "2.5"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "In triangle ABC, angle A = 30° and angle B = 60°. What is angle C?",
    "options": [
      "30°",
      "90°",
      "60°",
      "45°"
    ],
    "correct": 2,
    "question_te": "త్రిభుజం ABCలో, కోణం A = 30° మరియు కోణం B = 60°. కోణం C ఎంత?",
    "options_te": [
      "30°",
      "90°",
      "60°",
      "45°"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "The ratio of ₹5 and ₹0.50 is:",
    "options": [
      "100:1",
      "50:1",
      "10:1",
      "5:1"
    ],
    "correct": 3,
    "question_te": "₹5 మరియు ₹0.50ల నిష్పత్తి:",
    "options_te": [
      "100:1",
      "50:1",
      "10:1",
      "5:1"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "The four-digit number known as \"Kaprekar's constant\" is:",
    "options": [
      "7641",
      "7146",
      "6741",
      "6174"
    ],
    "correct": 4,
    "question_te": "\"కాప్రేకర్ స్థిరాంకం\" అని పిలువబడే నాలుగు అంకెల సంఖ్య:",
    "options_te": [
      "7641",
      "7146",
      "6741",
      "6174"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "30 men can finish a piece of work in 17 days. To finish the same work in 10 days, the number of extra men required is:",
    "options": [
      "21",
      "30",
      "51",
      "11"
    ],
    "correct": 1,
    "question_te": "30 మంది పురుషులు ఒక పనిని 17 రోజుల్లో పూర్తి చేయగలరు. అదే పనిని 10 రోజుల్లో పూర్తి చేయడానికి అవసరమైన అదనపు మంది సంఖ్య:",
    "options_te": [
      "21",
      "30",
      "51",
      "11"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "The diagonal of a square is 18 cm. The side of the square (in cm) is:",
    "options": [
      "6",
      "9",
      "9√2",
      "18√2"
    ],
    "correct": 3,
    "question_te": "ఒక చతురస్రం యొక్క వికర్ణం 18 సెం.మీ. ఆ చతురస్రం భుజం (సెం.మీలలో):",
    "options_te": [
      "6",
      "9",
      "9√2",
      "18√2"
    ]
  },
  {
    "year": 2018,
    "subject": "Mathematics",
    "question": "The additive inverse of 7/13 is:",
    "options": [
      "-7/13",
      "7/13",
      "13/7",
      "-13/7"
    ],
    "correct": 1,
    "question_te": "7/13 యొక్క సంకలన విలోమం:",
    "options_te": [
      "-7/13",
      "7/13",
      "13/7",
      "-13/7"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Which of these does NOT belong to our solar system’s planets?",
    "options": [
      "Neptune",
      "Pluto",
      "Uranus",
      "Saturn"
    ],
    "correct": 2,
    "question_te": "కింది వాటిలో మన సౌర కుటుంబంలోని గ్రహాలకు చెందనిది ఏది?",
    "options_te": [
      "నెప్ట్యూన్",
      "ప్లూటో",
      "యురేనస్",
      "శని"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Open defecation is a major cause of the spread of which disease?",
    "options": [
      "Malaria",
      "Elephantiasis",
      "Cholera",
      "Dengue"
    ],
    "correct": 3,
    "question_te": "బహిరంగ మల విసర్జన ప్రధానంగా ఏ వ్యాధి వ్యాప్తికి కారణమవుతుంది?",
    "options_te": [
      "మలేరియా",
      "బోదకాలు వ్యాధి",
      "కలరా",
      "డెంగ్యూ"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Which of these is often referred to as the \"lungs of the Earth\"?",
    "options": [
      "Mountains",
      "Deserts",
      "Forests",
      "Rivers"
    ],
    "correct": 3,
    "question_te": "\"భూమి ఊపిరితిత్తులు\"గా వేటిని పిలుస్తారు?",
    "options_te": [
      "పర్వతాలు",
      "ఎడారులు",
      "అడవులు",
      "నదులు"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Pick up the incorrect statement:",
    "options": [
      "Plants release oxygen",
      "Oxygen does not dissolve in water",
      "Oxygen helps organisms to live",
      "Animals release carbon dioxide"
    ],
    "correct": 2,
    "question_te": "కింది వాటిలో తప్పుడు ప్రకటన ఏది?",
    "options_te": [
      "మొక్కలు ఆక్సిజన్‌ను విడుదల చేస్తాయి",
      "ఆక్సిజన్ నీటిలో కరగదు",
      "ఆక్సిజన్ జీవులు జీవించడానికి సహాయపడుతుంది",
      "జంతువులు కార్బన్ డై ఆక్సైడ్‌ను విడుదల చేస్తాయి"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "This type of mirror is used as a rearview mirror in vehicles:",
    "options": [
      "Convex mirror",
      "Concave mirror",
      "Plane mirror",
      "Mirror with irregular surface"
    ],
    "correct": 1,
    "question_te": "వాహనాల్లో వెనుక దృశ్య దర్పణంగా ఈ రకమైన అద్దం ఉపయోగిస్తారు:",
    "options_te": [
      "కుంభాకార దర్పణం",
      "పుటాకార దర్పణం",
      "సమతల దర్పణం",
      "అసమాన తలం గల దర్పణం"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "The unit used to measure the consumption of electricity in our homes is:",
    "options": [
      "Watt",
      "Watt-hour",
      "Kilowatt-hour",
      "Volt"
    ],
    "correct": 3,
    "question_te": "మన ఇళ్లలో విద్యుత్ వినియోగాన్ని కొలవడానికి ఉపయోగించే యూనిట్:",
    "options_te": [
      "వాట్",
      "వాట్-గంట",
      "కిలోవాట్-గంట",
      "వోల్ట్"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Which of these is a less polluting fuel?",
    "options": [
      "Coal",
      "Petrol",
      "Kerosene",
      "Natural gas"
    ],
    "correct": 4,
    "question_te": "కింది వాటిలో తక్కువ కాలుష్యం కలిగించే ఇంధనం ఏది?",
    "options_te": [
      "బొగ్గు",
      "పెట్రోల్",
      "కిరోసిన్",
      "సహజ వాయువు"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "The largest flower in the world is:",
    "options": [
      "Bird of Paradise",
      "Rafflesia",
      "Passiflora",
      "Bottle Brush"
    ],
    "correct": 2,
    "question_te": "ప్రపంచంలో అతిపెద్ద పుష్పం:",
    "options_te": [
      "బర్డ్ ఆఫ్ పారడైజ్",
      "రఫ్లేసియా",
      "పాసిఫ్లోరా",
      "బాటిల్ బ్రష్"
    ]
  },
  {
    "year": 2018,
    "subject": "Science & EVS",
    "question": "Jim Corbett National Park is located in which state?",
    "options": [
      "Uttar Pradesh",
      "Madhya Pradesh",
      "Uttarakhand",
      "Chhattisgarh"
    ],
    "correct": 3,
    "question_te": "జిమ్ కార్బెట్ జాతీయ పార్కు ఏ రాష్ట్రంలో ఉంది?",
    "options_te": [
      "ఉత్తర ప్రదేశ్",
      "మధ్య ప్రదేశ్",
      "ఉత్తరాఖండ్",
      "ఛత్తీస్‌గఢ్"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "One of the following is related to physical change:",
    "options": [
      "Growth",
      "Development",
      "Maturity",
      "Experience"
    ],
    "correct": 1,
    "question_te": "కిందివాటిలో శారీరక మార్పుకు సంబంధించినది:",
    "options_te": [
      "పెరుగుదల",
      "వికాసం",
      "పరిపక్వత",
      "అనుభవం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Balu got a good voice from his parents. In addition, with proper training and encouragement he became a good singer. This shows the following developmental principle:",
    "options": [
      "Development is a product of interaction",
      "Development is a continuous process",
      "Development follows an orderly sequence",
      "Development is uniform in all the stages"
    ],
    "correct": 1,
    "question_te": "బాలుకు తల్లిదండ్రుల నుండి మంచి కంఠస్వరం లభించింది. దానికి తోడు సరైన శిక్షణ మరియు ప్రోత్సాహంతో అతను మంచి గాయకుడయ్యాడు. ఇది కింది వికాస సూత్రాన్ని తెలియజేస్తుంది:",
    "options_te": [
      "వికాసం అనేది పరస్పర చర్య ఫలితం",
      "వికాసం ఒక నిరంతర ప్రక్రియ",
      "వికాసం క్రమానుగత శ్రేణిని అనుసరిస్తుంది",
      "వికాసం అన్ని దశలలో ఏకరీతిగా ఉంటుంది"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The father of Genetics is:",
    "options": [
      "Mendel",
      "Maslow",
      "Dalton",
      "Kohlberg"
    ],
    "correct": 1,
    "question_te": "జన్యుశాస్త్ర పితామహుడు:",
    "options_te": [
      "మెండల్",
      "మాస్లో",
      "డాల్టన్",
      "కోల్‌బర్గ్"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "'Emotional catharsis' means:",
    "options": [
      "Emotional release",
      "Controlling emotional release",
      "More emotional control",
      "Uncontrolled emotion"
    ],
    "correct": 1,
    "question_te": "'ఉద్వేగ విరేచనం' (Emotional catharsis) అంటే:",
    "options_te": [
      "ఉద్వేగ విడుదల",
      "ఉద్వేగ విడుదలను నియంత్రించడం",
      "ఎక్కువ ఉద్వేగ నియంత్రణ",
      "అనియంత్రిత ఉద్వేగం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "\"A child's mind has the ability to keep up norms of universal language and universal grammatical constructions at birth.\" Stated by:",
    "options": [
      "Bandura",
      "Chomsky",
      "Piaget",
      "Skinner"
    ],
    "correct": 2,
    "question_te": "\"పిల్లల మనస్సుకు జననం నుండే సార్వత్రిక భాష మరియు సార్వత్రిక వ్యాకరణ నిర్మాణాల నియమాలను కలిగి ఉండే సామర్థ్యం ఉంటుంది\" అని పేర్కొన్నది:",
    "options_te": [
      "బండూరా",
      "చామ్‌స్కీ",
      "పియాజె",
      "స్కిన్నర్"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "According to Guilford's theory of the structure of intelligence, the number of intelligence factors is:",
    "options": [
      "5",
      "6",
      "30",
      "150"
    ],
    "correct": 4,
    "question_te": "గిల్‌ఫర్డ్ బుద్ధి నిర్మాణ సిద్ధాంతం ప్రకారం, బుద్ధి కారకాల సంఖ్య:",
    "options_te": [
      "5",
      "6",
      "30",
      "150"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The word 'Themes' in the Thematic Apperception Test (TAT) refers to:",
    "options": [
      "Concept",
      "Character",
      "Story",
      "Location"
    ],
    "correct": 3,
    "question_te": "థీమాటిక్ అపెర్సెప్షన్ టెస్ట్ (TAT)లో 'థీమ్స్' (ఇతివృత్తాలు) అనే పదం దేనిని సూచిస్తుంది?",
    "options_te": [
      "భావన",
      "పాత్ర",
      "కథ",
      "స్థలం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "According to Guilford, the following does NOT belong to the nature of creativity:",
    "options": [
      "Fluency",
      "Flexibility",
      "Originality",
      "Accuracy"
    ],
    "correct": 4,
    "question_te": "గిల్‌ఫర్డ్ ప్రకారం, కిందివి సృజనాత్మకత లక్షణానికి చెందనిది:",
    "options_te": [
      "ప్రవాహత",
      "నమ్యత",
      "మౌలికత",
      "కచ్చితత్వం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "\"Animal Intelligence: Experimental Studies\" was authored by:",
    "options": [
      "Guilford",
      "Pavlov",
      "Thorndike",
      "Herbart"
    ],
    "correct": 3,
    "question_te": "\"యానిమల్ ఇంటెలిజెన్స్: ఎక్స్‌పెరిమెంటల్ స్టడీస్\" గ్రంథ రచయిత:",
    "options_te": [
      "గిల్‌ఫర్డ్",
      "పావ్లోవ్",
      "థారన్డైక్",
      "హెర్బార్ట్"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "A person who is not accepted by the majority of members in a group is called an:",
    "options": [
      "Isolate",
      "Star",
      "Extrovert",
      "Introvert"
    ],
    "correct": 1,
    "question_te": "సమూహంలోని అధిక సభ్యులచే ఆమోదించబడని వ్యక్తిని ఇలా పిలుస్తారు:",
    "options_te": [
      "ఏకాకి",
      "స్టార్ (ప్రముఖుడు)",
      "బహిర్ముఖి",
      "అంతర్ముఖి"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "According to Bruner, the \"construction of content\" should always proceed:",
    "options": [
      "Unknown to known",
      "Whole to parts",
      "Difficult to easy",
      "Known to unknown"
    ],
    "correct": 4,
    "question_te": "బ్రూనర్ ప్రకారం, \"విషయ నిర్మాణం\" ఎల్లప్పుడూ ఎలా జరగాలి?",
    "options_te": [
      "తెలియని దాని నుండి తెలిసిన దానికి",
      "సమగ్రం నుండి భాగాలకు",
      "కష్టతరమైన దాని నుండి సులభమైన దానికి",
      "తెలిసిన దాని నుండి తెలియని దానికి"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The following does NOT belong to the laws (schedules) of reinforcement:",
    "options": [
      "Fixed Interval Reinforcement",
      "Continuous Reinforcement",
      "Positive Reinforcement",
      "Fixed Ratio Reinforcement"
    ],
    "correct": 3,
    "question_te": "కిందివాటిలో బలనిర్మాణ నియమాలు (షెడ్యూళ్లు)కు చెందనిది:",
    "options_te": [
      "స్థిర విరామ బలనిర్మాణం",
      "నిరంతర బలనిర్మాణం",
      "సానుకూల బలనిర్మాణం",
      "స్థిర నిష్పత్తి బలనిర్మాణం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The author who proposed the \"Theory of Hierarchy of Needs\" is:",
    "options": [
      "MacIver",
      "McClelland",
      "Atkinson",
      "Maslow"
    ],
    "correct": 4,
    "question_te": "\"అవసరాల శ్రేణీక్రమ సిద్ధాంతం\" ప్రతిపాదించిన రచయిత:",
    "options_te": [
      "మాక్ఐవర్",
      "మెక్‌క్లెలాండ్",
      "అట్కిన్సన్",
      "మాస్లో"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Identification, the mental process of deliberate \"adoption\" of another person's behaviour, was defined by:",
    "options": [
      "Binet",
      "Bandura",
      "Bruner",
      "Vygotsky"
    ],
    "correct": 2,
    "question_te": "మరొక వ్యక్తి ప్రవర్తనను ఉద్దేశపూర్వకంగా \"అలవరచుకునే\" మానసిక ప్రక్రియ అయిన తాదాత్మ్యీకరణను నిర్వచించినది:",
    "options_te": [
      "బినే",
      "బండూరా",
      "బ్రూనర్",
      "వైగోట్‌స్కీ"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Once conditioned to a stimulus, the same response occurring to any similar stimulus is called:",
    "options": [
      "Law of Generalization",
      "Law of Discrimination",
      "Law of Extinction",
      "Law of Spontaneous Recovery"
    ],
    "correct": 1,
    "question_te": "ఒక ప్రేరణకు అనుకూలితమైన తర్వాత, అదే ప్రతిస్పందన సారూప్య ప్రేరణలకు కూడా కలగడాన్ని అంటారు:",
    "options_te": [
      "సాధారణీకరణ నియమం",
      "విభేదీకరణ నియమం",
      "విలోపన నియమం",
      "స్వతః పునరుద్ధరణ నియమం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "According to this theory, feedback and reinforcement should be provided as soon as the organism shows a response:",
    "options": [
      "Classical Conditioning",
      "Insightful Learning",
      "Trial & Error method",
      "Operant Conditioning"
    ],
    "correct": 4,
    "question_te": "ఈ సిద్ధాంతం ప్రకారం, జీవి ప్రతిస్పందన చూపిన వెంటనే స్పందన మరియు బలనిర్మాణం అందించాలి:",
    "options_te": [
      "సంప్రదాయ నిబంధన",
      "అంతర్దృష్టి అభ్యసనం",
      "ప్రయత్న-పొరపాటు పద్ధతి",
      "క్రియా నిబంధన"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Having knowledge of Sanskrit has no effect on learning swimming. This is an example of:",
    "options": [
      "Positive Transfer",
      "Zero Transfer",
      "Bilateral Transfer",
      "Negative Transfer"
    ],
    "correct": 2,
    "question_te": "సంస్కృత భాషా జ్ఞానం ఈత నేర్చుకోవడంపై ఎలాంటి ప్రభావం చూపదు. ఇది దేనికి ఉదాహరణ?",
    "options_te": [
      "సానుకూల బదిలీ",
      "శూన్య బదిలీ",
      "ద్విపార్శ్విక బదిలీ",
      "ప్రతికూల బదిలీ"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The gradual development of innate abilities in a person with age is called:",
    "options": [
      "Practice",
      "Learning",
      "Motivation",
      "Maturation"
    ],
    "correct": 4,
    "question_te": "వయస్సుతో పాటు వ్యక్తిలో సహజ సామర్థ్యాలు క్రమంగా వికసించడాన్ని అంటారు:",
    "options_te": [
      "అభ్యాసం",
      "అభ్యసనం",
      "ప్రేరణ",
      "పరిపక్వత"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "ENIAC and EDSAC belong to the:",
    "options": [
      "First Generation Computers",
      "Second Generation Computers",
      "Third Generation Computers",
      "Fourth Generation Computers"
    ],
    "correct": 1,
    "question_te": "ENIAC మరియు EDSAC ఏ తరానికి చెందిన కంప్యూటర్లు?",
    "options_te": [
      "మొదటి తరం కంప్యూటర్లు",
      "రెండవ తరం కంప్యూటర్లు",
      "మూడవ తరం కంప్యూటర్లు",
      "నాలుగవ తరం కంప్యూటర్లు"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Learning through the sense organs is called:",
    "options": [
      "Motor Learning",
      "Verbal Learning",
      "Conceptual Learning",
      "Perceptual Learning"
    ],
    "correct": 4,
    "question_te": "జ్ఞానేంద్రియాల ద్వారా జరిగే అభ్యసనాన్ని అంటారు:",
    "options_te": [
      "చాలక అభ్యసనం",
      "వాచిక అభ్యసనం",
      "భావనాత్మక అభ్యసనం",
      "గ్రాహక అభ్యసనం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "\"85% of cumulative brain development occurs before the age of six years\" is stated by:",
    "options": [
      "RTE - 2009",
      "NCERT",
      "NEP - 2020",
      "NCF – 2005"
    ],
    "correct": 3,
    "question_te": "\"ఆరు సంవత్సరాల వయస్సు లోపే మెదడు యొక్క సంచిత వికాసంలో 85% జరుగుతుంది\" అని పేర్కొన్నది:",
    "options_te": [
      "విద్యాహక్కు చట్టం - 2009",
      "ఎన్‌సిఇఆర్‌టి",
      "జాతీయ విద్యా విధానం - 2020",
      "జాతీయ పాఠ్యప్రణాళిక చట్రం – 2005"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The first school for the blind was established in Paris in 1784 by:",
    "options": [
      "Lal Behari Shah",
      "Sir Valentin Haüy",
      "Braille",
      "Helen Keller"
    ],
    "correct": 2,
    "question_te": "1784లో పారిస్‌లో అంధుల కోసం మొదటి పాఠశాలను స్థాపించినది:",
    "options_te": [
      "లాల్ బెహారీ షా",
      "సర్ వాలెంటైన్ హాయ్",
      "బ్రెయిలీ",
      "హెలెన్ కెల్లర్"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "The Indian constitution prohibits the employment of children in factories under this article:",
    "options": [
      "18",
      "19",
      "23",
      "24"
    ],
    "correct": 4,
    "question_te": "బాలలను కర్మాగారాల్లో నియమించడాన్ని భారత రాజ్యాంగం ఏ అధికరణం ద్వారా నిషేధిస్తుంది?",
    "options_te": [
      "18",
      "19",
      "23",
      "24"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "Child Development & Pedagogy",
    "question": "Quarterly, half-yearly, and annual exams come under:",
    "options": [
      "Formative evaluation",
      "Summative evaluation",
      "Board exams",
      "Competency based assessment"
    ],
    "correct": 2,
    "question_te": "త్రైమాసిక, అర్ధవార్షిక మరియు వార్షిక పరీక్షలు దేని కిందకు వస్తాయి?",
    "options_te": [
      "నిర్మాణాత్మక మూల్యాంకనం",
      "సంగ్రహణాత్మక మూల్యాంకనం",
      "బోర్డు పరీక్షలు",
      "సామర్థ్య ఆధారిత మూల్యాంకనం"
    ]
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"Don't sleep.\" Choose the passive voice of the sentence:",
    "options": [
      "You ordered not to sleep.",
      "You ordered to not sleep.",
      "You are instructed not to sleep.",
      "You are requested not to sleep."
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the grammatically correct question:",
    "options": [
      "Does the rainbow appear in the sky?",
      "Do the rainbow appear in the sky?",
      "Do the rainbow appears in the sky?",
      "Does the rainbow appears in the sky?"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the expression used to give a negative reply in a polite way:",
    "options": [
      "Thank you.",
      "No, thanks.",
      "Yes, please.",
      "You're welcome."
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the article which is used before superlative adjectives:",
    "options": [
      "a",
      "an",
      "the",
      "None"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"We haven't had our dinner yet, _______?\" Choose the correct question tag:",
    "options": [
      "have we?",
      "had we?",
      "haven't we?",
      "didn't we?"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the correct prefix to get the opposite word for 'use':",
    "options": [
      "ir",
      "mis",
      "im",
      "il"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the word that falls between these guide words: sceptic – scientist",
    "options": [
      "scripture",
      "scrawl",
      "schedule",
      "scandal"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the correct spelling of the word:",
    "options": [
      "militaristic",
      "militerstic",
      "militarestic",
      "militiristic"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the word that must always begin with a capital letter:",
    "options": [
      "bike",
      "boy",
      "birthday",
      "Bobby"
    ],
    "correct": 4
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"It scooted into the sugarcane field.\" Choose the synonym of the word 'scooted':",
    "options": [
      "crawled",
      "crept",
      "rushed",
      "poked"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"...do some boating in the serene waters of the reservoir.\" Choose the antonym of the word 'serene':",
    "options": [
      "placid",
      "agitated",
      "lush",
      "gloomy"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"The teacher said, 'You may go now.'\" Choose the indirect speech of the sentence:",
    "options": [
      "The teacher told me that he might go now.",
      "The teacher requested me to go then.",
      "The teacher permitted me to go then.",
      "The teacher said that you may go now."
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Shakespeare is ________ dramatist. Choose the expression that fits the blank:",
    "options": [
      "greater than most other",
      "greater than all other",
      "the greatest",
      "so great as than that"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Since the eruption _______, all the villages on the slopes of the volcano have been evacuated. Choose the verb that fits the blank:",
    "options": [
      "has been starting",
      "started",
      "has to start",
      "was starting"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "So far this week there _______ three burglaries in our street. Choose the verb that fits the blank:",
    "options": [
      "will be being",
      "has been",
      "have been",
      "is"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"He came from America.\" The meaning of 'came from' is:",
    "options": [
      "originated from",
      "thought well",
      "destroyed",
      "arrived at"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"The man who is standing next to Percy is my brother.\" Choose the simple sentence form:",
    "options": [
      "My brother and Percy are standing next to the man.",
      "My brother is Percy and she is next to me.",
      "The man standing next to Percy is my brother.",
      "Percy is my brother standing next to me."
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "My brother was ______ for the new jobs in the company. Choose the option that fits the blank:",
    "options": [
      "over the year",
      "between the two chairs",
      "among the successful applicants",
      "until the last of him"
    ],
    "correct": 3
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "I pushed the button ______ the door, but there was no answer. Choose the word that does NOT fit the blank:",
    "options": [
      "beside",
      "by",
      "next to",
      "among"
    ],
    "correct": 4
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Both the siblings were mentally unstable _______ their disturbed childhood. Choose the expression that fits the blank:",
    "options": [
      "on account of",
      "seeing that",
      "on the top",
      "moreover"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "I got stuck in the traffic, ______ I missed the flight. Choose the linker that fits the blank:",
    "options": [
      "on the top",
      "on account of",
      "seeing that",
      "consequently"
    ],
    "correct": 4
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the grammatically correct sentence:",
    "options": [
      "Don't ask me for money.",
      "Sanjana is going to home.",
      "The earth is moving round the sun.",
      "I am owning a car."
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the grammatically correct sentence regarding simple future:",
    "options": [
      "She lost her will power.",
      "She will lost her power.",
      "She lost power to her will.",
      "She will lose her power."
    ],
    "correct": 4
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the feminine noun from the following:",
    "options": [
      "witch",
      "wizard",
      "drake",
      "czar"
    ],
    "correct": 1
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Choose the word that can be used as a subject:",
    "options": [
      "them",
      "our",
      "myself",
      "mine"
    ],
    "correct": 4
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "\"Preethi could swim when she was five years old.\" This sentence indicates:",
    "options": [
      "future possibility",
      "past ability",
      "taking permission",
      "slight possibility"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "The players, as well as the captain, ______ to win. Choose the word that fits the blank:",
    "options": [
      "wanting",
      "want",
      "wants",
      "was wanted"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "In the passage on nutritional diseases, 'Obesity' means:",
    "options": [
      "having many diseases",
      "having overweight",
      "having no proteins in food",
      "taking food without fats"
    ],
    "correct": 2
  },
  {
    "year": 2022,
    "paper": "AP TET Paper 2A, August 2022",
    "subject": "English",
    "question": "Inadequacy of proteins and carbohydrates in food leads to:",
    "options": [
      "Marasmus",
      "Kwashiorkor",
      "Obesity",
      "Producing oils"
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 2A, March 2024",
    "subject": "English",
    "question": "Read the conversation: A: \"My examinations are in the next month.\" B: \"If I were you, I would not waste time.\" In this conversation, B offered:",
    "options": [
      "his help",
      "his suggestion",
      "his time",
      "his message"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 2A, March 2024",
    "subject": "English",
    "question": "\"The teacher said to the boy, 'Keep it up.'\" The purpose of the sentence in inverted commas is:",
    "options": [
      "to permit",
      "to disappoint",
      "to offer help",
      "to encourage"
    ],
    "correct": 4
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 2A, March 2024",
    "subject": "English",
    "question": "Choose the option that shows an appropriate way to address the recipient in a professional email:",
    "options": [
      "Hey",
      "Dear Mr. Smith",
      "Hitherto",
      "Go"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 2A, March 2024",
    "subject": "English",
    "question": "Choose the option that is NOT a tip for writing a short story:",
    "options": [
      "starting a short story",
      "developing compelling characters",
      "writing as much detail as possible",
      "seeking feedback from others"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 2A, March 2024",
    "subject": "English",
    "question": "Choose the correctly punctuated sentence:",
    "options": [
      "Ravi said, 'I want to go to New York next year.'",
      "Ravi said, 'I want to go to New York next year",
      "Ravi said, 'I want to go to New York next year'.",
      "Ravi said, 'I want to go to New York next year')."
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The most successful child-rearing style is:",
    "options": [
      "Authoritative style",
      "Authoritarian style",
      "Permissive style",
      "Uninvolved style"
    ],
    "correct": 1,
    "question_te": "అత్యంత విజయవంతమైన పిల్లల పెంపక శైలి:",
    "options_te": [
      "ప్రజాస్వామిక (అధికారయుత) శైలి",
      "నిరంకుశ శైలి",
      "అనుజ్ఞాత్మక శైలి",
      "నిర్లిప్త శైలి"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is wrongly mentioned as a principle of development?",
    "options": [
      "Development is continuous",
      "There exist individual differences in development",
      "Development is cumulative",
      "Development cannot be predicted"
    ],
    "correct": 4,
    "question_te": "కిందివాటిలో వికాస సూత్రంగా తప్పుగా పేర్కొన్నది ఏది?",
    "options_te": [
      "వికాసం నిరంతరాయంగా జరుగుతుంది",
      "వికాసంలో వ్యక్తిగత భేదాలు ఉంటాయి",
      "వికాసం సంచితంగా ఉంటుంది",
      "వికాసాన్ని అంచనా వేయలేము"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is wrongly stated with regard to the Sensori-Motor Stage?",
    "options": [
      "In this stage the child is a reflexive organism",
      "The concept of object permanence is formed in this stage",
      "Children in this stage can think abstractly",
      "This stage takes place from birth to 2 years of age"
    ],
    "correct": 3,
    "question_te": "సెన్సరీ-మోటార్ దశకు సంబంధించి తప్పుగా పేర్కొన్నది ఏది?",
    "options_te": [
      "ఈ దశలో పిల్లవాడు ప్రతివర్తన జీవిగా ఉంటాడు",
      "ఈ దశలో వస్తు స్థిరత్వ భావన ఏర్పడుతుంది",
      "ఈ దశలో పిల్లలు అమూర్తంగా ఆలోచించగలరు",
      "ఈ దశ జననం నుండి 2 సంవత్సరాల వరకు ఉంటుంది"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "According to Erikson, the social conflict faced by children during 3 to 6 years of age is:",
    "options": [
      "Trust vs. Mistrust",
      "Initiative vs. Guilt",
      "Industry vs. Inferiority",
      "Intimacy vs. Isolation"
    ],
    "correct": 2,
    "question_te": "ఎరిక్సన్ ప్రకారం, 3 నుండి 6 సంవత్సరాల వయస్సు మధ్య పిల్లలు ఎదుర్కొనే సామాజిక సంఘర్షణ:",
    "options_te": [
      "విశ్వాసం vs అవిశ్వాసం",
      "చొరవ vs అపరాధభావం",
      "శ్రామికత్వం vs న్యూనతాభావం",
      "సాన్నిహిత్యం vs ఏకాకితనం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "\"Army Alpha test\" is an example of:",
    "options": [
      "Individual Test of Intelligence",
      "Group test of Intelligence",
      "Performance Test",
      "Non-verbal test of Intelligence"
    ],
    "correct": 2,
    "question_te": "\"ఆర్మీ ఆల్ఫా టెస్ట్\" దేనికి ఉదాహరణ?",
    "options_te": [
      "వ్యక్తిగత బుద్ధి పరీక్ష",
      "సమూహ బుద్ధి పరీక్ష",
      "నిర్వహణ పరీక్ష",
      "అమౌఖిక బుద్ధి పరీక్ష"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The \"Two factor theory of intelligence\" was proposed by:",
    "options": [
      "Thorndike",
      "Gardner",
      "Spearman",
      "Thurstone"
    ],
    "correct": 3,
    "question_te": "\"బుద్ధి ద్వికారక సిద్ధాంతం\" ప్రతిపాదించినది:",
    "options_te": [
      "థారన్డైక్",
      "గార్డనర్",
      "స్పియర్‌మన్",
      "థర్‌స్టోన్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The number of sub-tests in the Differential Aptitude Test is:",
    "options": [
      "6",
      "8",
      "10",
      "11"
    ],
    "correct": 2,
    "question_te": "\"డిఫరెన్షియల్ ఆప్టిట్యూడ్ టెస్ట్\"లో ఉప పరీక్షల సంఖ్య:",
    "options_te": [
      "6",
      "8",
      "10",
      "11"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The second stage in the creative process is:",
    "options": [
      "Verification stage",
      "Stage of Preparation",
      "Stage of Incubation",
      "Stage of Insight"
    ],
    "correct": 3,
    "question_te": "సృజనాత్మక ప్రక్రియలో రెండవ దశ:",
    "options_te": [
      "నిర్ధారణ దశ",
      "సన్నద్ధతా దశ",
      "పరిపక్వతా (ఉద్భవన) దశ",
      "అంతర్దృష్టి దశ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Persons with this type of thinking have the ability to generate multiple solutions:",
    "options": [
      "Concrete thinking",
      "Convergent thinking",
      "Divergent thinking",
      "Non-directive thinking"
    ],
    "correct": 3,
    "question_te": "బహుళ పరిష్కారాలను ఆలోచించగల సామర్థ్యం ఉన్నవారి ఆలోచనా విధానం:",
    "options_te": [
      "మూర్త ఆలోచన",
      "అభిసారి ఆలోచన",
      "అపసారి ఆలోచన",
      "అనిర్దేశిత ఆలోచన"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is NOT a projective test of personality?",
    "options": [
      "Rorschach Ink Blot test",
      "Children's Apperception test",
      "Personality Inventory",
      "Word Association Test"
    ],
    "correct": 3,
    "question_te": "కిందివాటిలో వ్యక్తిత్వ ప్రక్షేపణ పరీక్ష కానిది ఏది?",
    "options_te": [
      "రోర్‌షాక్ ఇంక్ బ్లాట్ పరీక్ష",
      "చిల్డ్రన్స్ అపెర్సెప్షన్ పరీక్ష",
      "వ్యక్తిత్వ సూచిక (ఇన్వెంటరీ)",
      "పద సాహచర్య పరీక్ష"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Ayan wants to avoid doing his homework, but also wants to avoid being punished for not doing it. This conflict is:",
    "options": [
      "Approach-Approach",
      "Approach-Avoidance",
      "Avoidance-Avoidance",
      "Double Approach-Avoidance"
    ],
    "correct": 3,
    "question_te": "అయాన్ తన హోంవర్క్ చేయకుండా ఉండాలని, కానీ చేయకపోతే శిక్ష పడకుండా కూడా ఉండాలని కోరుకుంటున్నాడు. ఇది ఏ రకమైన సంఘర్షణ?",
    "options_te": [
      "సామీప్య-సామీప్య సంఘర్షణ",
      "సామీప్య-పరిహార్య సంఘర్షణ",
      "పరిహార్య-పరిహార్య సంఘర్షణ",
      "ద్వంద్వ సామీప్య-పరిహార్య సంఘర్షణ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The Clinical Method is also known as:",
    "options": [
      "Case study Method",
      "Introspection Method",
      "Action research",
      "Longitudinal Method"
    ],
    "correct": 1,
    "question_te": "క్లినికల్ పద్ధతిని ఇలా కూడా పిలుస్తారు:",
    "options_te": [
      "సందర్భ అధ్యయన పద్ధతి",
      "ఆత్మవిమర్శ పద్ధతి",
      "క్రియాత్మక పరిశోధన",
      "అనుదైర్ఘ్య పద్ధతి"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is wrongly stated regarding the characteristics of learning?",
    "options": [
      "Learning is a goal-directed activity",
      "Learning is cumulative in nature",
      "Learning is dynamic",
      "Learning is not a process, it is a product"
    ],
    "correct": 4,
    "question_te": "అభ్యసన లక్షణాలకు సంబంధించి తప్పుగా పేర్కొన్నది ఏది?",
    "options_te": [
      "అభ్యసనం లక్ష్య నిర్దేశిత కార్యకలాపం",
      "అభ్యసనం స్వభావరీత్యా సంచితం",
      "అభ్యసనం గతిశీలమైనది",
      "అభ్యసనం ఒక ప్రక్రియ కాదు, అది ఫలితం మాత్రమే"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "A Hindi speaker learning Sanskrit shows which type of transfer of learning?",
    "options": [
      "Positive",
      "Negative",
      "Zero",
      "Bilateral"
    ],
    "correct": 1,
    "question_te": "హిందీ మాట్లాడేవారు సంస్కృతం నేర్చుకోవడం ఏ రకమైన అభ్యసన బదిలీని చూపిస్తుంది?",
    "options_te": [
      "సానుకూల బదిలీ",
      "ప్రతికూల బదిలీ",
      "శూన్య బదిలీ",
      "ద్విపార్శ్విక బదిలీ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The book \"On Memory\" was written by:",
    "options": [
      "Ebbinghaus",
      "Bartlett",
      "Freud",
      "Galton"
    ],
    "correct": 1,
    "question_te": "\"ఆన్ మెమరీ\" గ్రంథ రచయిత:",
    "options_te": [
      "ఎబ్బింగ్‌హాస్",
      "బార్ట్‌లెట్",
      "ఫ్రాయిడ్",
      "గాల్టన్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "In Pavlov's experiment, 'food' is the:",
    "options": [
      "Conditioned stimulus",
      "Conditioned response",
      "Unconditioned stimulus",
      "Unconditioned response"
    ],
    "correct": 3,
    "question_te": "పావ్లోవ్ ప్రయోగంలో, 'ఆహారం' అనేది:",
    "options_te": [
      "అనుకూలిత ప్రేరణ",
      "అనుకూలిత ప్రతిస్పందన",
      "అసంకేతిత ప్రేరణ",
      "అసంకేతిత ప్రతిస్పందన"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is NOT a Gestaltist?",
    "options": [
      "Kohler",
      "Koffka",
      "Wertheimer",
      "Skinner"
    ],
    "correct": 4,
    "question_te": "కిందివారిలో గెస్టాల్ట్ వాది కానివారు ఎవరు?",
    "options_te": [
      "కోలర్",
      "కాఫ్కా",
      "వెర్తీమర్",
      "స్కిన్నర్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "'Figure-ground relationship' is related to:",
    "options": [
      "Attitude",
      "Perception",
      "Aptitude",
      "Creativity"
    ],
    "correct": 2,
    "question_te": "'ఆకృతి-నేపథ్య సంబంధం' దేనికి సంబంధించినది?",
    "options_te": [
      "దృక్పథం",
      "గ్రహణ శక్తి (అవగాహన)",
      "అభిరుచి",
      "సృజనాత్మకత"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is NOT related to the cognitive domain?",
    "options": [
      "Analysis",
      "Evaluation",
      "Application",
      "Imitation"
    ],
    "correct": 4,
    "question_te": "కిందివాటిలో జ్ఞానాత్మక రంగానికి సంబంధించనిది ఏది?",
    "options_te": [
      "విశ్లేషణ",
      "మూల్యాంకనం",
      "అనువర్తనం",
      "అనుకరణ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Persons with 'dyslexia' will face difficulties mainly in:",
    "options": [
      "Reading",
      "Speaking",
      "Writing",
      "Calculating"
    ],
    "correct": 1,
    "question_te": "'డిస్లెక్సియా' ఉన్నవారు ప్రధానంగా వేటిలో ఇబ్బంది పడతారు?",
    "options_te": [
      "పఠనం",
      "మాట్లాడటం",
      "రాయడం",
      "గణించడం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The first step in the Project Method is:",
    "options": [
      "Creating a Situation",
      "Planning",
      "Implementation",
      "Evaluation"
    ],
    "correct": 1,
    "question_te": "ప్రాజెక్టు పద్ధతిలో మొదటి సోపానం:",
    "options_te": [
      "పరిస్థితిని కల్పించడం",
      "ప్రణాళిక రూపొందించడం",
      "అమలు చేయడం",
      "మూల్యాంకనం చేయడం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is NOT an input device?",
    "options": [
      "Scanner",
      "Keyboard",
      "Touch pad",
      "Printer"
    ],
    "correct": 4,
    "question_te": "కిందివాటిలో ఇన్‌పుట్ పరికరం కానిది ఏది?",
    "options_te": [
      "స్కానర్",
      "కీబోర్డ్",
      "టచ్ ప్యాడ్",
      "ప్రింటర్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "1 kilobyte equals:",
    "options": [
      "1000 Bytes",
      "1024 Bytes",
      "1024 Bits",
      "1000 Bits"
    ],
    "correct": 2,
    "question_te": "1 కిలోబైట్ అంటే:",
    "options_te": [
      "1000 బైట్లు",
      "1024 బైట్లు",
      "1024 బిట్‌లు",
      "1000 బిట్‌లు"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "The expanded form of MOOC is:",
    "options": [
      "Mobile Open Online Course",
      "Massive Open Online Course",
      "Master of Online Certification",
      "Mobile Oriented Online Certificate"
    ],
    "correct": 2,
    "question_te": "MOOC యొక్క పూర్తి రూపం:",
    "options_te": [
      "మొబైల్ ఓపెన్ ఆన్‌లైన్ కోర్సు",
      "మాసివ్ ఓపెన్ ఆన్‌లైన్ కోర్సు",
      "మాస్టర్ ఆఫ్ ఆన్‌లైన్ సర్టిఫికేషన్",
      "మొబైల్ ఓరియెంటెడ్ ఆన్‌లైన్ సర్టిఫికెట్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "According to RTE-2009, 'Elementary Education' means:",
    "options": [
      "Classes 1 to 5",
      "Pre-Primary Education",
      "Classes 1 to 7",
      "Classes 1 to 8"
    ],
    "correct": 4,
    "question_te": "RTE-2009 ప్రకారం, 'ప్రాథమిక విద్య' అంటే:",
    "options_te": [
      "1 నుండి 5 తరగతులు",
      "ప్రీ-ప్రైమరీ విద్య",
      "1 నుండి 7 తరగతులు",
      "1 నుండి 8 తరగతులు"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "As per NEP 2020, by which year is teacher education to be moved entirely into multidisciplinary institutions?",
    "options": [
      "2025",
      "2030",
      "2032",
      "2035"
    ],
    "correct": 2,
    "question_te": "NEP 2020 ప్రకారం, ఉపాధ్యాయ విద్యను పూర్తిగా బహుళ విభాగ సంస్థల్లోకి ఏ సంవత్సరం నాటికి మార్చాలి?",
    "options_te": [
      "2025",
      "2030",
      "2032",
      "2035"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Under the \"Jagananna Amma Vodi\" scheme, the minimum school attendance required is:",
    "options": [
      "50%",
      "70%",
      "75%",
      "80%"
    ],
    "correct": 3,
    "question_te": "\"జగనన్న అమ్మ ఒడి\" పథకం కింద కనీస పాఠశాల హాజరు శాతం:",
    "options_te": [
      "50%",
      "70%",
      "75%",
      "80%"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Directive counselling was introduced by:",
    "options": [
      "Williamson",
      "F.C. Thorne",
      "Rogers",
      "James"
    ],
    "correct": 1,
    "question_te": "నిర్దేశిత సలహా పద్ధతిని ప్రవేశపెట్టినది:",
    "options_te": [
      "విలియమ్సన్",
      "ఎఫ్.సి. థార్న్",
      "రోజర్స్",
      "జేమ్స్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Child Development & Pedagogy",
    "question": "Which of the following is NOT a teacher-centered method?",
    "options": [
      "Lecture Method",
      "Heuristic Method",
      "Historical Method",
      "Lecture Demonstration Method"
    ],
    "correct": 2,
    "question_te": "కిందివాటిలో ఉపాధ్యాయ కేంద్రీకృత పద్ధతి కానిది ఏది?",
    "options_te": [
      "ఉపన్యాస పద్ధతి",
      "అన్వేషణ పద్ధతి",
      "చారిత్రక పద్ధతి",
      "ఉపన్యాస ప్రదర్శన పద్ధతి"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Take this book if you ________.",
    "options": [
      "like",
      "will like",
      "would like",
      "are like"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "She ______ a cup of coffee for me a few minutes ago.",
    "options": [
      "maked",
      "make",
      "makes",
      "made"
    ],
    "correct": 4
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the grammatically correct sentence:",
    "options": [
      "I came here by walk.",
      "I came here by foot.",
      "I came here on foot.",
      "I came here by foot by walk."
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "The purpose of using dialogue tags is:",
    "options": [
      "to confuse readers about who is speaking",
      "to attribute speech to characters",
      "to omit punctuation marks",
      "to create tension"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the punctuation mark which separates items in a list:",
    "options": [
      "Semicolon (;)",
      "Comma (,)",
      "Quotation marks (\" \")",
      "Apostrophe (')"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the correct dictionary (alphabetical) sequence for: A. message  B. memorable  C. mentor  D. member",
    "options": [
      "B D A C",
      "A C D B",
      "D B C A",
      "C A D B"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Identify the linker that indicates contrast:",
    "options": [
      "however",
      "next",
      "first",
      "afterwards"
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Identify the complex sentence:",
    "options": [
      "She doesn't use a computer.",
      "I went to the market and I bought some milk.",
      "They will meet us at the skating area.",
      "Although it was cold outside, she didn't wear a coat."
    ],
    "correct": 4
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the correct irregular plural of \"mouse\":",
    "options": [
      "mouses",
      "mousis",
      "mice",
      "mouseys"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "\"_____ can come to the party if ______ want to.\" Choose the correct pair of pronouns:",
    "options": [
      "Everybody, he",
      "Nobody, she",
      "Anybody, they",
      "Anybody, you"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the phrasal verb that means \"to refuse or reject something\":",
    "options": [
      "put up",
      "set in",
      "turn down",
      "set out"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Which of the following is true about imperative sentences?",
    "options": [
      "They usually express strong emotions.",
      "They always begin with interrogative words.",
      "They give commands, instructions or requests.",
      "They provide information or state facts."
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the indirect speech of: He said to me, \"Let's go home together.\"",
    "options": [
      "He proposed to me that we should go home together.",
      "He urged me to go home with him.",
      "He asked me to go home with him.",
      "He proposed me to go home together."
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Some of the fruit cake _______ gone. Choose the correct verb:",
    "options": [
      "is",
      "are",
      "were",
      "be"
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the one-word substitute for \"Belonging to all parts of the world\":",
    "options": [
      "native",
      "cosmopolitan",
      "omnipresent",
      "puritan"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the correctly spelt word:",
    "options": [
      "gypses",
      "gypsies",
      "gypsees",
      "gypseis"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the meaning of \"monsoon mist\":",
    "options": [
      "sunshine",
      "fog",
      "snow",
      "haze"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the antonym of \"more\" as used in the given context:",
    "options": [
      "additional",
      "extra",
      "less",
      "further"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "LAD, the inborn human trait described in psycho-linguistics, stands for:",
    "options": [
      "Learning Activities Device",
      "Learning Acquisition Design",
      "Language Acquisition Device",
      "Language Activities Design"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Identify the pair of graphic-motor skills:",
    "options": [
      "Listening and reading",
      "Listening and writing",
      "Reading and writing",
      "Listening and speaking"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Identify the content word:",
    "options": [
      "as",
      "before",
      "within",
      "brave"
    ],
    "correct": 4
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "The main aim of composition (writing) is to:",
    "options": [
      "communicate one's thoughts in an organized way",
      "communicate one's thoughts in a zig-zag way",
      "explore phonetics",
      "improve one's handwriting"
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "If a teacher lacks imagination, the Bilingual Method tends to end up as the:",
    "options": [
      "Innovative Method",
      "Grammar Translation Method",
      "Direct Method",
      "Deductive Method"
    ],
    "correct": 2
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "\"The Silent Way\" method of language teaching was introduced by:",
    "options": [
      "Holmer",
      "Hymes",
      "Michel West",
      "Gattegno"
    ],
    "correct": 4
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "I will walk ______ the supermarket.",
    "options": [
      "to upto",
      "off of",
      "upto",
      "due to"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Noun clauses replace _______ in a sentence:",
    "options": [
      "individual nouns",
      "compound adjectives",
      "compound prepositions",
      "relative pronouns"
    ],
    "correct": 1
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "What function does \"ought to\" perform in \"You ought to apologize\"?",
    "options": [
      "Past habit",
      "Conditional statement",
      "Moral obligation",
      "Future intention"
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "English",
    "question": "Choose the correct statement about the article used in \"He is a doctor\":",
    "options": [
      "The article should be omitted.",
      "The article should be 'the'.",
      "The article is used correctly.",
      "The article should be 'an'."
    ],
    "correct": 3
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "In a game, Avinash won 5 marbles from each of his 6 friends. How many marbles did Avinash win in total?",
    "options": [
      "36",
      "5",
      "25",
      "30"
    ],
    "correct": 4,
    "question_te": "ఒక ఆటలో, అవినాష్ తన 6 మంది స్నేహితుల్లో ఒక్కొక్కరి నుండి 5 గోళీలు గెలుచుకున్నాడు. అవినాష్ మొత్తం ఎన్ని గోళీలు గెలుచుకున్నాడు?",
    "options_te": [
      "36",
      "5",
      "25",
      "30"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "The product of a number and 5 is zero. The number is:",
    "options": [
      "–5",
      "5",
      "0",
      "1"
    ],
    "correct": 3,
    "question_te": "ఒక సంఖ్య మరియు 5ల లబ్ధం సున్నా. ఆ సంఖ్య:",
    "options_te": [
      "–5",
      "5",
      "0",
      "1"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "24 girls and 16 boys attended a picnic. What is the ratio of girls to boys?",
    "options": [
      "2:3",
      "3:2",
      "1:3",
      "3:1"
    ],
    "correct": 2,
    "question_te": "విహారయాత్రకు 24 మంది అమ్మాయిలు మరియు 16 మంది అబ్బాయిలు హాజరయ్యారు. అమ్మాయిలు మరియు అబ్బాయిల నిష్పత్తి ఎంత?",
    "options_te": [
      "2:3",
      "3:2",
      "1:3",
      "3:1"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "Convert 5/4 to a percentage:",
    "options": [
      "50%",
      "75%",
      "100%",
      "125%"
    ],
    "correct": 4,
    "question_te": "5/4ను శాతంగా మార్చండి:",
    "options_te": [
      "50%",
      "75%",
      "100%",
      "125%"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "A pair of roller skates costs Rs. 450, with 5% sales tax added. What is the total bill amount?",
    "options": [
      "Rs. 427.50",
      "Rs. 472.50",
      "Rs. 427",
      "Rs. 450"
    ],
    "correct": 2,
    "question_te": "రోలర్ స్కేట్ల జత ధర రూ. 450, దానికి 5% అమ్మకం పన్ను చేరుస్తారు. మొత్తం బిల్లు మొత్తం ఎంత?",
    "options_te": [
      "రూ. 427.50",
      "రూ. 472.50",
      "రూ. 427",
      "రూ. 450"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "A principal of Rs. 1200 is invested at 12% simple interest per annum for 3 years. What amount is to be paid at the end?",
    "options": [
      "Rs. 1623",
      "Rs. 1632",
      "Rs. 1600",
      "Rs. 1625"
    ],
    "correct": 2,
    "question_te": "రూ. 1200 అసలును సంవత్సరానికి 12% సాధారణ వడ్డీ చొప్పున 3 సంవత్సరాలు పెట్టుబడి పెట్టారు. చివరిలో చెల్లించవలసిన మొత్తం ఎంత?",
    "options_te": [
      "రూ. 1623",
      "రూ. 1632",
      "రూ. 1600",
      "రూ. 1625"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "What is the perimeter of a square with a side of 7 cm?",
    "options": [
      "25 cm",
      "28 cm",
      "35 cm",
      "40 cm"
    ],
    "correct": 2,
    "question_te": "7 సెం.మీ భుజం గల చతురస్రం చుట్టుకొలత ఎంత?",
    "options_te": [
      "25 సెం.మీ",
      "28 సెం.మీ",
      "35 సెం.మీ",
      "40 సెం.మీ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "A rhombus with 4 right angles is called a:",
    "options": [
      "Rectangle",
      "Trapezium",
      "Square",
      "Parallelogram"
    ],
    "correct": 3,
    "question_te": "4 లంబకోణాలు గల రాంబస్‌ను ఇలా అంటారు:",
    "options_te": [
      "దీర్ఘ చతురస్రం",
      "సమలంబ చతుర్భుజం",
      "చతురస్రం",
      "సమాంతర చతుర్భుజం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "What is the total number of faces on a cuboid?",
    "options": [
      "4",
      "12",
      "6",
      "8"
    ],
    "correct": 3,
    "question_te": "దీర్ఘఘనం (cuboid)కు మొత్తం ముఖాల సంఖ్య:",
    "options_te": [
      "4",
      "12",
      "6",
      "8"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Mathematics",
    "question": "What is the circumference of a circle with a diameter of 28 cm? (use π = 22/7)",
    "options": [
      "120 cm",
      "100 cm",
      "70 cm",
      "88 cm"
    ],
    "correct": 4,
    "question_te": "28 సెం.మీ వ్యాసం గల వృత్తం చుట్టుకొలత ఎంత? (π = 22/7 గా తీసుకోండి)",
    "options_te": [
      "120 సెం.మీ",
      "100 సెం.మీ",
      "70 సెం.మీ",
      "88 సెం.మీ"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The Indian giant squirrel is a(n):",
    "options": [
      "Endangered species",
      "Extinct species",
      "Endemic species",
      "Invasive species"
    ],
    "correct": 3,
    "question_te": "భారతీయ పెద్ద ఉడుత (Indian giant squirrel) ఒక:",
    "options_te": [
      "అంతరించిపోతున్న జాతి",
      "అంతరించిన జాతి",
      "స్థానిక (దేశీయ) జాతి",
      "ఆక్రమణ జాతి"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The force exerted by a charged body on another charged (or uncharged) body is called:",
    "options": [
      "Muscular force",
      "Electrostatic force",
      "Gravitational force",
      "Magnetic force"
    ],
    "correct": 2,
    "question_te": "ఒక ఆవేశిత వస్తువు మరొక ఆవేశిత (లేదా ఆవేశరహిత) వస్తువుపై ప్రయోగించే బలాన్ని అంటారు:",
    "options_te": [
      "కండరాల బలం",
      "స్థిర విద్యుత్ బలం",
      "గురుత్వాకర్షణ బలం",
      "అయస్కాంత బలం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "Which of the following is a fossil fuel?",
    "options": [
      "Coal",
      "Hydrogen",
      "Wood",
      "Cow dung cake"
    ],
    "correct": 1,
    "question_te": "కిందివాటిలో శిలాజ ఇంధనం ఏది?",
    "options_te": [
      "బొగ్గు",
      "హైడ్రోజన్",
      "కర్ర",
      "పిడకలు"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "Which thread is stronger than a steel wire of the same thickness?",
    "options": [
      "Cotton thread",
      "Nylon thread",
      "Woolen thread",
      "Silk thread"
    ],
    "correct": 2,
    "question_te": "ఉక్కు తీగతో సమాన మందం గల ఏ దారం దానికంటే బలంగా ఉంటుంది?",
    "options_te": [
      "పత్తి దారం",
      "నైలాన్ దారం",
      "ఉన్ని దారం",
      "పట్టు దారం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The reddish-brown gland situated in the right upper part of the abdomen is the:",
    "options": [
      "Pancreas",
      "Liver",
      "Spleen",
      "Adrenal gland"
    ],
    "correct": 2,
    "question_te": "ఉదరం కుడి పై భాగంలో ఉండే ఎరుపు-గోధుమ రంగు గ్రంథి:",
    "options_te": [
      "క్లోమం",
      "కాలేయం",
      "ప్లీహము",
      "అడ్రినల్ గ్రంథి"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "Aquatic animals like fish excrete their nitrogenous waste mainly in the form of:",
    "options": [
      "Urea",
      "Uric acid",
      "Ammonia",
      "Nitrogen"
    ],
    "correct": 3,
    "question_te": "చేపల వంటి జలచరాలు తమ నత్రజని వ్యర్థాన్ని ప్రధానంగా దేని రూపంలో విసర్జిస్తాయి?",
    "options_te": [
      "యూరియా",
      "యూరిక్ యాసిడ్",
      "అమ్మోనియా",
      "నత్రజని"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The pattern made by veins in a leaf is called:",
    "options": [
      "Petiole",
      "Lamina",
      "Venation",
      "Mid rib"
    ],
    "correct": 3,
    "question_te": "ఆకులోని ఈనెల నమూనాను ఇలా అంటారు:",
    "options_te": [
      "దండు (ఆకుతొడిమ)",
      "పత్రఫలకం",
      "సిరాజాలం (వెనేషన్)",
      "మధ్య ఈనె"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The mission initiated by the Government of India to provide toilets for everyone is:",
    "options": [
      "Vande Bharat",
      "Nipun Bharat",
      "Sreshta Bharat",
      "Swachh Bharat"
    ],
    "correct": 4,
    "question_te": "అందరికీ మరుగుదొడ్లు అందించడానికి భారత ప్రభుత్వం ప్రారంభించిన కార్యక్రమం:",
    "options_te": [
      "వందే భారత్",
      "నిపుణ్ భారత్",
      "శ్రేష్ఠ భారత్",
      "స్వచ్ఛ భారత్"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "Bones become soft and bent due to a deficiency of:",
    "options": [
      "Vitamin A",
      "Vitamin B",
      "Vitamin C",
      "Vitamin D"
    ],
    "correct": 4,
    "question_te": "ఎముకలు మెత్తబడి వంగిపోవడానికి కారణం ఏ విటమిన్ లోపం?",
    "options_te": [
      "విటమిన్ A",
      "విటమిన్ B",
      "విటమిన్ C",
      "విటమిన్ D"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "The pipe-like structure that passes swallowed food into the stomach is the:",
    "options": [
      "Oesophagus",
      "Intestine",
      "Trachea",
      "Duodenum"
    ],
    "correct": 1,
    "question_te": "మింగిన ఆహారాన్ని కడుపులోకి పంపే గొట్టం లాంటి నిర్మాణం:",
    "options_te": [
      "అన్నవాహిక",
      "ప్రేగు",
      "శ్వాసనాళం",
      "డుయోడినం"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "An example of a vehicle that is pulled by animals is:",
    "options": [
      "Car",
      "Cycle",
      "Tonga",
      "Auto rickshaw"
    ],
    "correct": 3,
    "question_te": "జంతువులు లాగే వాహనానికి ఉదాహరణ:",
    "options_te": [
      "కారు",
      "సైకిల్",
      "టాంగా",
      "ఆటో రిక్షా"
    ]
  },
  {
    "year": 2024,
    "paper": "AP TET Paper 1A (Set 1), 2024",
    "subject": "Science & EVS",
    "question": "Choose the correct set of indoor games:",
    "options": [
      "Chess, Cricket, Ludo",
      "Chinese checker, Carroms, Kho-Kho",
      "Ludo, Chess, Carroms",
      "Kabaddi, Kho-Kho, Tennikoit"
    ],
    "correct": 3,
    "question_te": "ఇండోర్ ఆటల సరైన సమితిని ఎంచుకోండి:",
    "options_te": [
      "చెస్, క్రికెట్, లూడో",
      "చైనీస్ చెకర్, క్యారమ్స్, ఖో-ఖో",
      "లూడో, చెస్, క్యారమ్స్",
      "కబడ్డీ, ఖో-ఖో, టెన్నికాయిట్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The two ends of the axis of the Earth are called",
    "options": [
      "Longitudes",
      "Countries",
      "Continents",
      "Poles"
    ],
    "correct": 4,
    "question_te": "భూమి అక్షం యొక్క రెండు చివరలను ఇలా అంటారు",
    "options_te": [
      "రేఖాంశాలు",
      "దేశాలు",
      "ఖండాలు",
      "ధ్రువాలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Partners in contract farming are",
    "options": [
      "Farmers and officials",
      "Farmers and banks",
      "Farmers and companies",
      "Farmers and government"
    ],
    "correct": 3,
    "question_te": "కాంట్రాక్టు వ్యవసాయంలో భాగస్వాములు",
    "options_te": [
      "రైతులు మరియు అధికారులు",
      "రైతులు మరియు బ్యాంకులు",
      "రైతులు మరియు కంపెనీలు",
      "రైతులు మరియు ప్రభుత్వం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Form of the Government in \"Vajji Mahajanapadam\" is",
    "options": [
      "Authoritarian Government",
      "Anarchic Government",
      "Monarchy",
      "Gana form of Government"
    ],
    "correct": 4,
    "question_te": "'వజ్జి మహాజనపదం'లో ప్రభుత్వ స్వరూపం",
    "options_te": [
      "నిరంకుశ ప్రభుత్వం",
      "అరాచక ప్రభుత్వం",
      "రాచరిక ప్రభుత్వం",
      "గణతంత్ర ప్రభుత్వం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Megaliths' are",
    "options": [
      "Temples",
      "Burial sites",
      "Stupas",
      "Viharas"
    ],
    "correct": 2,
    "question_te": "'మెగాలిత్‌లు' అంటే",
    "options_te": [
      "దేవాలయాలు",
      "సమాధి స్థలాలు",
      "స్థూపాలు",
      "విహారాలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The songs composed and sung by Alwars are",
    "options": [
      "Pasurams",
      "Light music",
      "Folk songs",
      "Shlokas"
    ],
    "correct": 1,
    "question_te": "ఆళ్వారులు రచించి పాడిన పాటలు",
    "options_te": [
      "పాశురాలు",
      "లలిత సంగీతం",
      "జానపద గీతాలు",
      "శ్లోకాలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "First Kavya in Sanskrit literature",
    "options": [
      "Ramayana",
      "Mahabharatha",
      "Bhagavatham",
      "Shakuntalam"
    ],
    "correct": 1,
    "question_te": "సంస్కృత సాహిత్యంలో మొదటి కావ్యం",
    "options_te": [
      "రామాయణం",
      "మహాభారతం",
      "భాగవతం",
      "శాకుంతలం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The rhythmic rise and fall in the level of the water in the oceans every day is known as",
    "options": [
      "Waves",
      "Floods",
      "Currents",
      "Tides"
    ],
    "correct": 4,
    "question_te": "ప్రతిరోజూ సముద్రాలలో నీటి మట్టం లయబద్ధంగా పెరగడం, తగ్గడాన్ని ఇలా అంటారు",
    "options_te": [
      "అలలు",
      "వరదలు",
      "ప్రవాహాలు",
      "ఆటుపోట్లు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Industrial Revolution started in this Country",
    "options": [
      "England",
      "America",
      "Russia",
      "India"
    ],
    "correct": 1,
    "question_te": "పారిశ్రామిక విప్లవం ఈ దేశంలో ప్రారంభమైంది",
    "options_te": [
      "ఇంగ్లండ్",
      "అమెరికా",
      "రష్యా",
      "భారతదేశం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "These Kings were called as \"Andhra Rajas\"",
    "options": [
      "Vishnu Kundins",
      "Pallavas",
      "Cholas",
      "Kakatiyas"
    ],
    "correct": 1,
    "question_te": "వీరిని 'ఆంధ్ర రాజులు' అని పిలిచేవారు",
    "options_te": [
      "విష్ణుకుండినులు",
      "పల్లవులు",
      "చోళులు",
      "కాకతీయులు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Zabt' tax was introduced by this minister in Akbar's court",
    "options": [
      "Thodarmal",
      "Abul Fazal",
      "Birbal",
      "Sangrama Singh"
    ],
    "correct": 1,
    "question_te": "అక్బర్ ఆస్థానంలో 'జబ్త్' పన్నును ప్రవేశపెట్టిన మంత్రి",
    "options_te": [
      "తోడర్‌మల్",
      "అబుల్ ఫజల్",
      "బీర్బల్",
      "సంగ్రామ సింగ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Minimum age limit for right to vote in our country",
    "options": [
      "21 years",
      "19 years",
      "20 years",
      "18 years"
    ],
    "correct": 4,
    "question_te": "మన దేశంలో ఓటు హక్కుకు కనీస వయోపరిమితి",
    "options_te": [
      "21 సంవత్సరాలు",
      "19 సంవత్సరాలు",
      "20 సంవత్సరాలు",
      "18 సంవత్సరాలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Palanati Virula Kadha' was written by",
    "options": [
      "Nannayya",
      "Thikkana",
      "Molla",
      "Sreenadha"
    ],
    "correct": 4,
    "question_te": "'పలనాటి వీరుల కథ' రచించినది",
    "options_te": [
      "నన్నయ్య",
      "తిక్కన",
      "మొల్ల",
      "శ్రీనాథుడు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Andhra Janasangham was formed by",
    "options": [
      "Madapati Hanumatha Rao",
      "Komarraju Lakshmana Rao",
      "Nayani Venkata Ranga Rao",
      "Ravichettu Ranga Rao"
    ],
    "correct": 1,
    "question_te": "ఆంధ్ర జనసంఘం స్థాపించినది",
    "options_te": [
      "మాడపాటి హనుమంతరావు",
      "కొమర్రాజు లక్ష్మణరావు",
      "నాయని వెంకట రంగారావు",
      "రావిచెట్టు రంగారావు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Quit India movement was started in the year",
    "options": [
      "1943",
      "1946",
      "1942",
      "1941"
    ],
    "correct": 3,
    "question_te": "క్విట్ ఇండియా ఉద్యమం ప్రారంభమైన సంవత్సరం",
    "options_te": [
      "1943",
      "1946",
      "1942",
      "1941"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Madapati Hanumantha Rao, Ravi Narayana Reddy were associated with",
    "options": [
      "Andhra Mahila Sabha",
      "Andhra Saraswatha Sabha",
      "Andhra Bhasha Sangam",
      "Andhra Maha Sabha"
    ],
    "correct": 4,
    "question_te": "మాడపాటి హనుమంతరావు, రావి నారాయణరెడ్డి వీరితో సంబంధం కలిగి ఉన్నారు",
    "options_te": [
      "ఆంధ్ర మహిళా సభ",
      "ఆంధ్ర సారస్వత సభ",
      "ఆంధ్ర భాషా సంఘం",
      "ఆంధ్ర మహాసభ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Even before independence a law was made in this year on abolition of the forced labour or vetti",
    "options": [
      "1927",
      "1937",
      "1947",
      "1917"
    ],
    "correct": 1,
    "question_te": "స్వాతంత్ర్యానికి ముందే వెట్టి చాకిరీ నిర్మూలనపై ఈ సంవత్సరంలో చట్టం చేయబడింది",
    "options_te": [
      "1927",
      "1937",
      "1947",
      "1917"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The United Nations Organization was established in the year",
    "options": [
      "1943",
      "1945",
      "1944",
      "1946"
    ],
    "correct": 2,
    "question_te": "ఐక్యరాజ్యసమితి స్థాపించబడిన సంవత్సరం",
    "options_te": [
      "1943",
      "1945",
      "1944",
      "1946"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The first woman teacher in India",
    "options": [
      "Savithri Bai Phule",
      "Pandit Ramabai Saraswathi",
      "Tarabai Shinde",
      "Begum Rokiya Sakhawat Hussain"
    ],
    "correct": 1,
    "question_te": "భారతదేశపు మొదటి మహిళా ఉపాధ్యాయురాలు",
    "options_te": [
      "సావిత్రిబాయి ఫూలే",
      "పండిత రమాబాయి సరస్వతి",
      "తారాబాయి షిండే",
      "బేగం రొకయా సఖావత్ హుస్సేన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The dance performed by tribals of Araku Valley",
    "options": [
      "Gussadi",
      "Sadir",
      "Kuravanji",
      "Dhimsa"
    ],
    "correct": 4,
    "question_te": "అరకు లోయ గిరిజనులు చేసే నృత్యం",
    "options_te": [
      "గుస్సాడి",
      "సదిర్",
      "కురవంజి",
      "ధింసా"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Collection of maps is called as",
    "options": [
      "Map drawing",
      "Map analysis",
      "Study of maps",
      "Atlas"
    ],
    "correct": 4,
    "question_te": "పటాల సమాహారాన్ని ఇలా అంటారు",
    "options_te": [
      "పటాల గీత",
      "పట విశ్లేషణ",
      "పటాల అధ్యయనం",
      "అట్లాస్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The Santhal Adivasis revolt was held in this period",
    "options": [
      "1855 - 56",
      "1850 - 51",
      "1860 - 61",
      "1870 - 71"
    ],
    "correct": 1,
    "question_te": "సంతాల్ ఆదివాసీల తిరుగుబాటు ఈ కాలంలో జరిగింది",
    "options_te": [
      "1855 - 56",
      "1850 - 51",
      "1860 - 61",
      "1870 - 71"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The birth place of Alluri Sita Rama Raju is",
    "options": [
      "Pendurthi",
      "Chinthapalli",
      "Pandrangi",
      "Rampachodavaram"
    ],
    "correct": 3,
    "question_te": "అల్లూరి సీతారామరాజు జన్మస్థలం",
    "options_te": [
      "పెందుర్తి",
      "చింతపల్లి",
      "పాండ్రంగి",
      "రంపచోడవరం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The fire accident occurred in 2004 in which 93 school children died at this place",
    "options": [
      "Bhopal",
      "Mysore",
      "Kumbha Konam",
      "Visakhapatnam"
    ],
    "correct": 3,
    "question_te": "2004లో 93 మంది పాఠశాల విద్యార్థులు మరణించిన అగ్నిప్రమాదం జరిగిన ప్రదేశం",
    "options_te": [
      "భోపాల్",
      "మైసూరు",
      "కుంభకోణం",
      "విశాఖపట్నం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Prohibition of child marriage Act was enacted in the year",
    "options": [
      "2004",
      "2007",
      "2006",
      "2005"
    ],
    "correct": 3,
    "question_te": "బాల్య వివాహాల నిషేధ చట్టం ఏ సంవత్సరంలో రూపొందించబడింది",
    "options_te": [
      "2004",
      "2007",
      "2006",
      "2005"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Under this right, all forms of 'forced labour' are prohibited",
    "options": [
      "Right against exploitation",
      "Right to live",
      "Right to freedom",
      "Right to equality"
    ],
    "correct": 1,
    "question_te": "ఈ హక్కు ప్రకారం అన్ని రకాల 'వెట్టి చాకిరీ'ని నిషేధించారు",
    "options_te": [
      "దోపిడీకి వ్యతిరేకంగా హక్కు",
      "జీవించే హక్కు",
      "స్వేచ్ఛా హక్కు",
      "సమానత్వపు హక్కు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The inventor of the steam Engine",
    "options": [
      "James Watt",
      "Mc Adam",
      "James Bindley",
      "Mathew Boulten"
    ],
    "correct": 1,
    "question_te": "ఆవిరి యంత్రాన్ని కనుగొన్నవారు",
    "options_te": [
      "జేమ్స్ వాట్",
      "మెక్ ఆడమ్",
      "జేమ్స్ బిండ్లీ",
      "మాథ్యూ బౌల్టన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Process of equipping oneself with the knowledge and information on financial matters is",
    "options": [
      "Financial literacy",
      "Book keeping",
      "Banking",
      "Accounting"
    ],
    "correct": 1,
    "question_te": "ఆర్థిక విషయాలపై జ్ఞానాన్ని, సమాచారాన్ని సమకూర్చుకునే ప్రక్రియ",
    "options_te": [
      "ఆర్థిక అక్షరాస్యత",
      "లెక్కల నిర్వహణ",
      "బ్యాంకింగ్",
      "అకౌంటింగ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The first co-operative society in the world was established in this country",
    "options": [
      "England",
      "America",
      "France",
      "Japan"
    ],
    "correct": 1,
    "question_te": "ప్రపంచంలో మొట్టమొదటి సహకార సంఘం ఈ దేశంలో స్థాపించబడింది",
    "options_te": [
      "ఇంగ్లండ్",
      "అమెరికా",
      "ఫ్రాన్స్",
      "జపాన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The industry which provides highest employment in India after agriculture",
    "options": [
      "Textile industry",
      "Jute industry",
      "Sugar industry",
      "Iron and steel industry"
    ],
    "correct": 1,
    "question_te": "వ్యవసాయం తర్వాత భారతదేశంలో అత్యధిక ఉపాధిని కల్పించే పరిశ్రమ",
    "options_te": [
      "వస్త్ర పరిశ్రమ",
      "జనుము పరిశ్రమ",
      "చక్కెర పరిశ్రమ",
      "ఇనుము ఉక్కు పరిశ్రమ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Temperate grasslands are also called as",
    "options": [
      "Tundras",
      "Steppes",
      "Taigas",
      "Thorny bushes"
    ],
    "correct": 2,
    "question_te": "సమశీతోష్ణ గడ్డి భూములను ఇలా కూడా అంటారు",
    "options_te": [
      "టండ్రాలు",
      "స్టెప్పీలు",
      "టైగాలు",
      "ముళ్ల పొదలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The steep rocky coast raising almost vertically above sea water is called as",
    "options": [
      "Sea arches",
      "Mushroom rock",
      "Sea cliff",
      "Inselburg"
    ],
    "correct": 3,
    "question_te": "సముద్రపు నీటి పైన దాదాపు నిలువుగా లేచి ఉండే నిటారు రాతి తీరాన్ని ఇలా అంటారు",
    "options_te": [
      "సముద్ర తోరణాలు",
      "పుట్టగొడుగు శిల",
      "సముద్ర ప్రపాతం",
      "ఇన్సెల్‌బర్గ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The northern most mountain range in the Himalayas",
    "options": [
      "Himadri",
      "Shivalik",
      "Mahabharatha ranges",
      "Pir Panjal"
    ],
    "correct": 1,
    "question_te": "హిమాలయాలలో అత్యంత ఉత్తర దిక్కున ఉన్న పర్వత శ్రేణి",
    "options_te": [
      "హిమాద్రి",
      "శివాలిక్",
      "మహాభారత శ్రేణులు",
      "పీర్ పంజాల్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The west coast of India starts from",
    "options": [
      "Mumbai",
      "Goa",
      "Calicut",
      "Rann of Kutch"
    ],
    "correct": 4,
    "question_te": "భారతదేశ పశ్చిమ తీరం ఇక్కడి నుండి ప్రారంభమవుతుంది",
    "options_te": [
      "ముంబై",
      "గోవా",
      "కాలికట్",
      "కచ్ఛ్ రాన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Workers working below their potential/capacity is known as",
    "options": [
      "Total unemployment",
      "Under employment",
      "Seasonal employment",
      "Disguised unemployment"
    ],
    "correct": 2,
    "question_te": "కార్మికులు తమ సామర్థ్యం కంటే తక్కువగా పనిచేయడాన్ని ఇలా అంటారు",
    "options_te": [
      "పూర్తి నిరుద్యోగం",
      "అల్పోద్యోగం",
      "కాలానుగుణ ఉద్యోగం",
      "ప్రచ్ఛన్న నిరుద్యోగం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The first census in India was taken in the year",
    "options": [
      "1852",
      "1862",
      "1872",
      "1882"
    ],
    "correct": 3,
    "question_te": "భారతదేశంలో మొదటి జనగణన ఏ సంవత్సరంలో జరిగింది",
    "options_te": [
      "1852",
      "1862",
      "1872",
      "1882"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The density of population per square kilometer in India as per census 2011",
    "options": [
      "285",
      "382",
      "385",
      "295"
    ],
    "correct": 2,
    "question_te": "2011 జనగణన ప్రకారం భారతదేశంలో చదరపు కిలోమీటరుకు జనసాంద్రత",
    "options_te": [
      "285",
      "382",
      "385",
      "295"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "In 2013, the UN climate change conference (COP19) was held at",
    "options": [
      "London",
      "New York",
      "Delhi",
      "Warsaw"
    ],
    "correct": 4,
    "question_te": "2013లో ఐక్యరాజ్యసమితి వాతావరణ మార్పు సదస్సు (COP19) ఇక్కడ జరిగింది",
    "options_te": [
      "లండన్",
      "న్యూయార్క్",
      "ఢిల్లీ",
      "వార్సా"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Sex ratio' is the",
    "options": [
      "Number of females to males in the country",
      "Number of females to males in every village in a country",
      "Number of females per every 100 males in cities in the country",
      "Number of females per every 1000 males in the country"
    ],
    "correct": 4,
    "question_te": "'లింగ నిష్పత్తి' అంటే",
    "options_te": [
      "దేశంలో పురుషులకు స్త్రీల సంఖ్య",
      "దేశంలోని ప్రతి గ్రామంలో పురుషులకు స్త్రీల సంఖ్య",
      "దేశంలోని నగరాల్లో ప్రతి 100 మంది పురుషులకు స్త్రీల సంఖ్య",
      "దేశంలో ప్రతి 1000 మంది పురుషులకు స్త్రీల సంఖ్య"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "In 1995, the Ford Motors company started its large plant in India at",
    "options": [
      "Chennai",
      "Hyderabad",
      "Bangalore",
      "Trivendram"
    ],
    "correct": 1,
    "question_te": "1995లో ఫోర్డ్ మోటార్స్ కంపెనీ భారతదేశంలో తన పెద్ద ప్లాంటును ఇక్కడ ప్రారంభించింది",
    "options_te": [
      "చెన్నై",
      "హైదరాబాద్",
      "బెంగళూరు",
      "తిరువనంతపురం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The second largest city in India (Census - 2011)",
    "options": [
      "Kolkata",
      "Mumbai",
      "Delhi",
      "Chennai"
    ],
    "correct": 3,
    "question_te": "భారతదేశంలో రెండవ అతిపెద్ద నగరం (2011 జనగణన)",
    "options_te": [
      "కోల్‌కతా",
      "ముంబై",
      "ఢిల్లీ",
      "చెన్నై"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Irom Sharmila' belongs to this state",
    "options": [
      "Manipur",
      "Nagaland",
      "Assam",
      "Meghalaya"
    ],
    "correct": 1,
    "question_te": "'ఇరోమ్ శర్మిల' ఈ రాష్ట్రానికి చెందినవారు",
    "options_te": [
      "మణిపూర్",
      "నాగాలాండ్",
      "అస్సాం",
      "మేఘాలయ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Moving away from the equator towards the poles, the average annual temperature will",
    "options": [
      "slowly increase",
      "remain constant",
      "be doubled",
      "decrease gradually"
    ],
    "correct": 4,
    "question_te": "భూమధ్యరేఖ నుండి ధ్రువాల వైపు వెళ్ళే కొద్దీ సగటు వార్షిక ఉష్ణోగ్రత",
    "options_te": [
      "నెమ్మదిగా పెరుగుతుంది",
      "స్థిరంగా ఉంటుంది",
      "రెట్టింపు అవుతుంది",
      "క్రమంగా తగ్గుతుంది"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The country that is called the 'promised land'",
    "options": [
      "Palestine",
      "Russia",
      "England",
      "America"
    ],
    "correct": 1,
    "question_te": "'వాగ్దాన భూమి' అని పిలువబడే దేశం",
    "options_te": [
      "పాలస్తీనా",
      "రష్యా",
      "ఇంగ్లండ్",
      "అమెరికా"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Expand – 'SEZ'",
    "options": [
      "Special Economic Zone",
      "Special Education Zone",
      "Special Environment Zone",
      "Special Enrollment Zone"
    ],
    "correct": 1,
    "question_te": "'SEZ' విస్తరణ",
    "options_te": [
      "ప్రత్యేక ఆర్థిక మండలి",
      "ప్రత్యేక విద్యా మండలి",
      "ప్రత్యేక పర్యావరణ మండలి",
      "ప్రత్యేక నమోదు మండలి"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "This country was not much affected by the economic depression during 1929-30",
    "options": [
      "Germany",
      "Russia",
      "Japan",
      "India"
    ],
    "correct": 2,
    "question_te": "1929-30 నాటి ఆర్థిక మాంద్యం ప్రభావం ఈ దేశంపై పెద్దగా పడలేదు",
    "options_te": [
      "జర్మనీ",
      "రష్యా",
      "జపాన్",
      "భారతదేశం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The book 'Silent Spring' was written by",
    "options": [
      "James Huck",
      "Adam Smith",
      "Rachel Carson",
      "Anil Agarwal"
    ],
    "correct": 3,
    "question_te": "'సైలెంట్ స్ప్రింగ్' పుస్తక రచయిత",
    "options_te": [
      "జేమ్స్ హక్",
      "ఆడమ్ స్మిత్",
      "రాచెల్ కార్సన్",
      "అనిల్ అగర్వాల్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Founder of the Nazi party",
    "options": [
      "Hitler",
      "Mussolini",
      "Churchill",
      "Bismarck"
    ],
    "correct": 1,
    "question_te": "నాజీ పార్టీ స్థాపకుడు",
    "options_te": [
      "హిట్లర్",
      "ముస్సోలిని",
      "చర్చిల్",
      "బిస్మార్క్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "The first elections to the Lok Sabha were conducted in the year",
    "options": [
      "1951 - 52",
      "1952 - 53",
      "1954 - 55",
      "1947 - 48"
    ],
    "correct": 1,
    "question_te": "లోక్‌సభకు మొదటి ఎన్నికలు ఈ సంవత్సరంలో జరిగాయి",
    "options_te": [
      "1951 - 52",
      "1952 - 53",
      "1954 - 55",
      "1947 - 48"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Preservation of Customs and Traditions' and 'equality' are illustrations of these kinds of values respectively",
    "options": [
      "Disciplinary value, Cultural value",
      "Cultural value, Democratic value",
      "Social value, Moral value",
      "Moral value, Political value"
    ],
    "correct": 2,
    "question_te": "'ఆచారాలు, సంప్రదాయాల పరిరక్షణ' మరియు 'సమానత్వం' వరుసగా ఈ రకాల విలువలకు ఉదాహరణలు",
    "options_te": [
      "క్రమశిక్షణా విలువ, సాంస్కృతిక విలువ",
      "సాంస్కృతిక విలువ, ప్రజాస్వామిక విలువ",
      "సామాజిక విలువ, నైతిక విలువ",
      "నైతిక విలువ, రాజకీయ విలువ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Developing a pamphlet on Clean and Green' and 'Respect for National Symbols' are specifications of these objectives respectively",
    "options": [
      "Interest, Attitude",
      "Knowledge, Application",
      "Application, Skill",
      "Creativity, Understanding"
    ],
    "correct": 1,
    "question_te": "'పరిశుభ్రత-పచ్చదనంపై కరపత్రం తయారు చేయడం' మరియు 'జాతీయ చిహ్నాలపై గౌరవం' వరుసగా ఈ లక్ష్యాలకు విశదీకరణలు",
    "options_te": [
      "అభిరుచి, వైఖరి",
      "జ్ఞానం, అనువర్తనం",
      "అనువర్తనం, నైపుణ్యం",
      "సృజనాత్మకత, అవగాహన"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "A student is able to prepare an album using various data sources like newspapers, periodicals and other library material. This is related to this objective",
    "options": [
      "Appreciation",
      "Knowledge",
      "Skill",
      "Understanding"
    ],
    "correct": 3,
    "question_te": "విద్యార్థి వార్తాపత్రికలు, పత్రికలు, ఇతర గ్రంథాలయ సామగ్రి వంటి వివిధ సమాచార వనరులను ఉపయోగించి ఆల్బమ్ తయారు చేయగలగడం ఈ లక్ష్యానికి సంబంధించినది",
    "options_te": [
      "ప్రశంస",
      "జ్ఞానం",
      "నైపుణ్యం",
      "అవగాహన"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Under section 29(2)(a) of the RTE Act-2009, while laying down the curriculum, the academic authority shall take into consideration",
    "options": [
      "All round development of the child",
      "Building up child's knowledge, potentiality and talent",
      "Conformity with the values enshrined in the constitution",
      "Development of physical and mental abilities of the child to the fullest extent"
    ],
    "correct": 3,
    "question_te": "RTE చట్టం-2009లోని సెక్షన్ 29(2)(a) ప్రకారం, పాఠ్యప్రణాళికను రూపొందించేటప్పుడు విద్యా సంస్థ ఈ విషయాన్ని పరిగణనలోకి తీసుకోవాలి",
    "options_te": [
      "బాలుని సర్వతోముఖాభివృద్ధి",
      "బాలుని జ్ఞానం, సామర్థ్యం, ప్రతిభను పెంపొందించడం",
      "రాజ్యాంగంలో పొందుపరచిన విలువలకు అనుగుణంగా ఉండటం",
      "బాలుని శారీరక, మానసిక సామర్థ్యాలను పూర్తి స్థాయిలో అభివృద్ధి చేయడం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "National Curriculum Framework (NCF) – 2005 suggested this",
    "options": [
      "The term Sociology should be used in place of Social Science",
      "The term Social Science should be used in place of Sociology",
      "The term Civics should be used in place of Political Science",
      "The term Political Science should be used in place of Civics"
    ],
    "correct": 4,
    "question_te": "జాతీయ పాఠ్యప్రణాళికా చట్రం (NCF) – 2005 ఈ విషయాన్ని సూచించింది",
    "options_te": [
      "'సాంఘిక శాస్త్రం' స్థానంలో 'సోషియాలజీ' పదాన్ని ఉపయోగించాలి",
      "'సోషియాలజీ' స్థానంలో 'సాంఘిక శాస్త్రం' పదాన్ని ఉపయోగించాలి",
      "'పొలిటికల్ సైన్స్' స్థానంలో 'పౌరశాస్త్రం' పదాన్ని ఉపయోగించాలి",
      "'పౌరశాస్త్రం' స్థానంలో 'పొలిటికల్ సైన్స్' పదాన్ని ఉపయోగించాలి"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "One of the following statements is NOT true",
    "options": [
      "Curriculum provides a base for a course of study",
      "Curriculum is a part of the syllabus",
      "Syllabus includes the content of what is to be taught",
      "Curriculum is the plan for the implementation of educational aims"
    ],
    "correct": 2,
    "question_te": "కింది వాక్యాలలో ఒకటి సత్యం కాదు",
    "options_te": [
      "పాఠ్యప్రణాళిక ఒక కోర్సు అధ్యయనానికి ఆధారం ఇస్తుంది",
      "పాఠ్యప్రణాళిక అనేది సిలబస్‌లో ఒక భాగం",
      "సిలబస్‌లో బోధించవలసిన విషయ సారాంశం ఉంటుంది",
      "పాఠ్యప్రణాళిక అనేది విద్యా లక్ష్యాల అమలుకు ప్రణాళిక"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "A Social Studies teacher organized a field trip to Talakona Water Falls for 9th class students. This comes under this kind of learning experience",
    "options": [
      "Direct experience",
      "Indirect experience",
      "Vicarious experience",
      "Both direct and indirect experiences"
    ],
    "correct": 1,
    "question_te": "ఒక సాంఘిక శాస్త్ర ఉపాధ్యాయుడు 9వ తరగతి విద్యార్థుల కోసం తలకోన జలపాతానికి క్షేత్ర పర్యటన నిర్వహించారు. ఇది ఈ రకమైన అభ్యసన అనుభవం కిందకు వస్తుంది",
    "options_te": [
      "ప్రత్యక్ష అనుభవం",
      "పరోక్ష అనుభవం",
      "ప్రతినిధిక అనుభవం",
      "ప్రత్యక్ష మరియు పరోక్ష అనుభవాలు రెండూ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "\"Learning without Burden\" was recommended by",
    "options": [
      "Kothari Commission",
      "Prof. Yashpal Committee",
      "Secondary Education Commission",
      "NPE - 1986"
    ],
    "correct": 2,
    "question_te": "'భారం లేని విద్య' (Learning without Burden) సిఫారసు చేసినవారు",
    "options_te": [
      "కొఠారి కమిషన్",
      "ప్రొ. యశ్‌పాల్ కమిటీ",
      "మాధ్యమిక విద్యా కమిషన్",
      "జాతీయ విద్యా విధానం - 1986"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Social learning and discovery learning are respectively related to",
    "options": [
      "Albert Bandura, Piaget",
      "Jerome Bruner, John Dewey",
      "Jerome Bruner, Albert Bandura",
      "Albert Bandura, Jerome Bruner"
    ],
    "correct": 4,
    "question_te": "సాంఘిక అభ్యసనం మరియు అన్వేషణ అభ్యసనం వరుసగా వీరికి సంబంధించినవి",
    "options_te": [
      "అల్బర్ట్ బండూరా, పియాజే",
      "జెరోమ్ బ్రూనర్, జాన్ డ్యూయీ",
      "జెరోమ్ బ్రూనర్, అల్బర్ట్ బండూరా",
      "అల్బర్ట్ బండూరా, జెరోమ్ బ్రూనర్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "One of the following is related to collaborative learning",
    "options": [
      "Doing homework",
      "Learning through exploration",
      "Solitary play",
      "Watching T.V."
    ],
    "correct": 2,
    "question_te": "కింది వాటిలో సహకార అభ్యసనానికి సంబంధించినది",
    "options_te": [
      "ఇంటిపని చేయడం",
      "అన్వేషణ ద్వారా నేర్చుకోవడం",
      "ఒంటరిగా ఆడుకోవడం",
      "టీవీ చూడటం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "Which of the following statements are true?\nA. Both the terms 'Test' and 'Measurement' are synonyms.\nB. There is a difference between Test and Measurement.\nC. When the work of testing ends, measurement comes into the picture for assigning numerical values to the results.",
    "options": [
      "A, B & C",
      "A & C only",
      "B & C only",
      "A & B only"
    ],
    "correct": 3,
    "question_te": "కింది వాక్యాలలో ఏవి సత్యమైనవి?\nA. 'పరీక్ష' మరియు 'కొలత' అనే పదాలు రెండూ పర్యాయపదాలు.\nB. పరీక్షకు, కొలతకు మధ్య తేడా ఉంది.\nC. పరీక్షించే పని పూర్తయిన తర్వాత, ఫలితాలకు సంఖ్యా విలువలు కేటాయించడానికి కొలత ప్రక్రియ మొదలవుతుంది.",
    "options_te": [
      "A, B & C",
      "A & C మాత్రమే",
      "B & C మాత్రమే",
      "A & B మాత్రమే"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Social Studies), 14 June 2018",
    "subject": "Social Studies",
    "question": "'Gurudwara' and 'Brick Kilns' are respectively",
    "options": [
      "Historical resources, Economic resources",
      "Economic resources, Historical resources",
      "Both Historical resources",
      "Both Economic resources"
    ],
    "correct": 1,
    "question_te": "'గురుద్వారా' మరియు 'ఇటుక బట్టీలు' వరుసగా",
    "options_te": [
      "చారిత్రక వనరులు, ఆర్థిక వనరులు",
      "ఆర్థిక వనరులు, చారిత్రక వనరులు",
      "రెండూ చారిత్రక వనరులు",
      "రెండూ ఆర్థిక వనరులు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If A, B are disjoint sets, n(A) = 4 and n(A ∪ B) = 7, then n(B) is equal to",
    "options": [
      "4",
      "11",
      "3",
      "20"
    ],
    "correct": 3,
    "question_te": "A, B అనేవి వియుక్త సమితులు, n(A) = 4 మరియు n(A ∪ B) = 7 అయితే, n(B) విలువ",
    "options_te": [
      "4",
      "11",
      "3",
      "20"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If 2 log(x + 3) = log 81, then the value of x is",
    "options": [
      "6",
      "5",
      "7",
      "8"
    ],
    "correct": 1,
    "question_te": "2 log(x + 3) = log 81 అయితే, x విలువ",
    "options_te": [
      "6",
      "5",
      "7",
      "8"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If √2 = 1.414, then the value of 1/(2√2) is",
    "options": [
      "0.0352",
      "3.541",
      "0.3535",
      "0.2525"
    ],
    "correct": 3,
    "question_te": "√2 = 1.414 అయితే, 1/(2√2) విలువ",
    "options_te": [
      "0.0352",
      "3.541",
      "0.3535",
      "0.2525"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If one zero of the quadratic polynomial 2x² + Kx – 15 is 3, the other zero is:",
    "options": [
      "15/2",
      "5",
      "-5/2",
      "–1"
    ],
    "correct": 3,
    "question_te": "2x² + Kx – 15 అనే వర్గ బహుపదికి ఒక శూన్యవిలువ 3 అయితే, రెండవ శూన్యవిలువ:",
    "options_te": [
      "15/2",
      "5",
      "-5/2",
      "–1"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0 are two straight lines. If a₁/a₂ = b₁/b₂ = c₁/c₂, then the lines are",
    "options": [
      "Intersecting lines",
      "Parallel lines",
      "Coincident lines",
      "Perpendicular lines"
    ],
    "correct": 3,
    "question_te": "a₁x + b₁y + c₁ = 0 మరియు a₂x + b₂y + c₂ = 0 అనేవి రెండు రేఖలు. a₁/a₂ = b₁/b₂ = c₁/c₂ అయితే, ఆ రేఖలు",
    "options_te": [
      "ఖండన రేఖలు",
      "సమాంతర రేఖలు",
      "సంపాతన రేఖలు",
      "లంబ రేఖలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If the area of a square is 4489 sq.cm, then the length of its side is (in cm)",
    "options": [
      "57",
      "67",
      "35",
      "43"
    ],
    "correct": 2,
    "question_te": "ఒక చతురస్రం వైశాల్యం 4489 చ.సెం.మీ అయితే, దాని భుజం పొడవు (సెం.మీలలో)",
    "options_te": [
      "57",
      "67",
      "35",
      "43"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The numbers 10, 12, 14, x–3, x, x+2, 25 are in ascending order. If the median is 15, the value of x is",
    "options": [
      "16",
      "15",
      "17",
      "18"
    ],
    "correct": 4,
    "question_te": "10, 12, 14, x–3, x, x+2, 25 అనే సంఖ్యలు ఆరోహణ క్రమంలో ఉన్నాయి. మధ్యగతం (మీడియన్) 15 అయితే, x విలువ",
    "options_te": [
      "16",
      "15",
      "17",
      "18"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If A = 4x² + y² – 6xy and B = 3y² + 12x² – 2xy, then 2A + B is equal to",
    "options": [
      "20x² – 5y² – 14xy",
      "20x² + 5y² – 14xy",
      "15x² – 4y² + 12xy",
      "–15x² + 4y² + 2xy"
    ],
    "correct": 2,
    "question_te": "A = 4x² + y² – 6xy మరియు B = 3y² + 12x² – 2xy అయితే, 2A + B విలువ",
    "options_te": [
      "20x² – 5y² – 14xy",
      "20x² + 5y² – 14xy",
      "15x² – 4y² + 12xy",
      "–15x² + 4y² + 2xy"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If the difference of two supplementary angles is 34°, the smaller angle is (in degrees)",
    "options": [
      "63",
      "53",
      "43",
      "73"
    ],
    "correct": 4,
    "question_te": "రెండు సంపూరక కోణాల భేదం 34° అయితే, చిన్న కోణం (డిగ్రీలలో)",
    "options_te": [
      "63",
      "53",
      "43",
      "73"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "One exterior angle of a triangle is 125° and the interior opposite angles are in the ratio 2 : 3. One of those interior angles is (in degrees)",
    "options": [
      "38",
      "48",
      "50",
      "58"
    ],
    "correct": 3,
    "question_te": "ఒక త్రిభుజంలో ఒక బాహ్య కోణం 125° మరియు దానికి ఎదురుగా ఉన్న అంతర కోణాల నిష్పత్తి 2 : 3. ఆ అంతర కోణాలలో ఒకటి (డిగ్రీలలో)",
    "options_te": [
      "38",
      "48",
      "50",
      "58"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If Cos A = 12/13, the value of Sin A is",
    "options": [
      "12/13",
      "5/13",
      "13/5",
      "5/12"
    ],
    "correct": 2,
    "question_te": "Cos A = 12/13 అయితే, Sin A విలువ",
    "options_te": [
      "12/13",
      "5/13",
      "13/5",
      "5/12"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If a die is rolled, the probability of getting an even number is",
    "options": [
      "1/6",
      "1/3",
      "2/5",
      "1/2"
    ],
    "correct": 4,
    "question_te": "ఒక పాచికను దొర్లించినప్పుడు, సరి సంఖ్య వచ్చే సంభావ్యత",
    "options_te": [
      "1/6",
      "1/3",
      "2/5",
      "1/2"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If (–1, 5) is the midpoint of the line joining the points (–4, a) and (2, 8), the value of 'a' is",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ],
    "correct": 2,
    "question_te": "(–4, a) మరియు (2, 8) బిందువులను కలిపే రేఖాఖండపు మధ్య బిందువు (–1, 5) అయితే, 'a' విలువ",
    "options_te": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The area of the triangle with vertices (t, 2t), (–2, 6), (3, 1) is 5 sq. units. The value of 't' is",
    "options": [
      "1/2",
      "–1/2",
      "2",
      "–2"
    ],
    "correct": 3,
    "question_te": "(t, 2t), (–2, 6), (3, 1) శీర్షాలుగా గల త్రిభుజ వైశాల్యం 5 చదరపు యూనిట్లు. 't' విలువ",
    "options_te": [
      "1/2",
      "–1/2",
      "2",
      "–2"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If three angles of a quadrilateral are 60°, 80° and 120°, the fourth angle is (in degrees)",
    "options": [
      "80",
      "90",
      "95",
      "100"
    ],
    "correct": 4,
    "question_te": "ఒక చతుర్భుజంలో మూడు కోణాలు 60°, 80° మరియు 120° అయితే, నాలుగవ కోణం (డిగ్రీలలో)",
    "options_te": [
      "80",
      "90",
      "95",
      "100"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "In a geometric progression, the 8th term is 192 and the common ratio is 2. The first term is",
    "options": [
      "3/2",
      "1/2",
      "2",
      "3"
    ],
    "correct": 1,
    "question_te": "ఒక గుణ శ్రేఢిలో 8వ పదం 192, సామాన్య నిష్పత్తి 2. మొదటి పదం",
    "options_te": [
      "3/2",
      "1/2",
      "2",
      "3"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If the 17th term of an Arithmetic Progression exceeds its 10th term by 7, the common difference is",
    "options": [
      "4",
      "3",
      "1",
      "0"
    ],
    "correct": 3,
    "question_te": "ఒక అంక శ్రేఢిలో 17వ పదం, 10వ పదం కంటే 7 ఎక్కువగా ఉంటే, సామాన్య భేదం",
    "options_te": [
      "4",
      "3",
      "1",
      "0"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The discriminant of the quadratic equation 2x² – 4x + 3 = 0 is",
    "options": [
      "–8",
      "8",
      "0",
      "15"
    ],
    "correct": 1,
    "question_te": "2x² – 4x + 3 = 0 అనే వర్గ సమీకరణం విభేదకం (డిస్క్రిమినెంట్)",
    "options_te": [
      "–8",
      "8",
      "0",
      "15"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The length, breadth and height of a cuboid are 15cm, 12cm and 10cm respectively. Its total surface area is (in cm²)",
    "options": [
      "700",
      "800",
      "900",
      "890"
    ],
    "correct": 3,
    "question_te": "ఒక దీర్ఘఘనం పొడవు, వెడల్పు, ఎత్తు వరుసగా 15సెం.మీ, 12సెం.మీ, 10సెం.మీ. దాని పూర్తి తలవైశాల్యం (చ.సెం.మీలలో)",
    "options_te": [
      "700",
      "800",
      "900",
      "890"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The G.C.D of 72 and 252 is 36. Their L.C.M is",
    "options": [
      "504",
      "504",
      "325",
      "175"
    ],
    "correct": 1,
    "question_te": "72, 252ల గ.సా.భా (G.C.D) 36. వాటి క.సా.గు (L.C.M)",
    "options_te": [
      "504",
      "504",
      "325",
      "175"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "If the slope of the line joining the points (2, 5) and (x, 3) is –2, the value of x is",
    "options": [
      "3",
      "2",
      "1",
      "–1"
    ],
    "correct": 3,
    "question_te": "(2, 5) మరియు (x, 3) బిందువులను కలిపే రేఖ వాలు –2 అయితే, x విలువ",
    "options_te": [
      "3",
      "2",
      "1",
      "–1"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "△ABC ~ △DEF and their areas are 64 cm² and 121 cm² respectively. If EF = 15.4 cm, then BC is equal to (in cm)",
    "options": [
      "12.2",
      "11.2",
      "10.2",
      "4.5"
    ],
    "correct": 2,
    "question_te": "△ABC ~ △DEF మరియు వాటి వైశాల్యాలు వరుసగా 64 చ.సెం.మీ మరియు 121 చ.సెం.మీ. EF = 15.4 సెం.మీ అయితే, BC విలువ (సెం.మీలలో)",
    "options_te": [
      "12.2",
      "11.2",
      "10.2",
      "4.5"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The specification \"Translates\" belongs to this instructional objective (in the teaching of Mathematics)",
    "options": [
      "Skill",
      "Application",
      "Understanding",
      "Knowledge"
    ],
    "correct": 3,
    "question_te": "గణిత బోధనలో \"అనువదిస్తాడు\" (Translates) అనే విశదీకరణ ఈ బోధనా లక్ష్యానికి చెందినది",
    "options_te": [
      "నైపుణ్యం",
      "అనువర్తనం",
      "అవగాహన",
      "జ్ఞానం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The characteristic feature of the \"Synthetic Method\" of teaching Mathematics is",
    "options": [
      "Hypothesis to Conclusion",
      "Specific to General",
      "Concrete to Abstract",
      "Example to Principle"
    ],
    "correct": 1,
    "question_te": "గణిత బోధనలో \"సంశ్లేషణ పద్ధతి\" (Synthetic Method) యొక్క లక్షణం",
    "options_te": [
      "పరికల్పన నుండి నిర్ధారణకు",
      "విశిష్టం నుండి సాధారణానికి",
      "మూర్త నుండి అమూర్తానికి",
      "ఉదాహరణ నుండి సూత్రానికి"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The first step of a lesson plan as per the \"Herbartian Approach\" is",
    "options": [
      "Presentation",
      "Application",
      "Association",
      "Preparation"
    ],
    "correct": 4,
    "question_te": "\"హెర్బార్టియన్ పద్ధతి\" ప్రకారం పాఠ్య ప్రణాళికలో మొదటి సోపానం",
    "options_te": [
      "ప్రదర్శన",
      "అనువర్తనం",
      "అనుసంధానం",
      "సంసిద్ధత"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "One demerit of oral work (in teaching Mathematics) is that",
    "options": [
      "Previous knowledge of the students can be tested",
      "It corrects the articulation errors of the students",
      "It depends mostly on the memory of the students",
      "It enhances speed and accuracy"
    ],
    "correct": 3,
    "question_te": "గణిత బోధనలో మౌఖిక పని (Oral work) యొక్క ఒక లోపం",
    "options_te": [
      "విద్యార్థుల పూర్వ జ్ఞానాన్ని పరీక్షించవచ్చు",
      "విద్యార్థుల ఉచ్ఛారణ దోషాలను సరిదిద్దుతుంది",
      "ఇది ఎక్కువగా విద్యార్థుల జ్ఞాపకశక్తిపై ఆధారపడుతుంది",
      "వేగం మరియు కచ్చితత్వాన్ని పెంచుతుంది"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Mathematics",
    "question": "The Academic Standard tested through the test item \"Write the decimal number 303.03 in expanded form\" is",
    "options": [
      "Representation – Visualisation",
      "Communication",
      "Connection",
      "Reasoning – Proof"
    ],
    "correct": 2,
    "question_te": "\"దశాంశ సంఖ్య 303.03ను విస్తరణ రూపంలో రాయండి\" అనే పరీక్షా అంశం ద్వారా పరీక్షించే విద్యా ప్రమాణం",
    "options_te": [
      "నిరూపణ – దృశ్యీకరణ",
      "భావ ప్రసార నైపుణ్యం",
      "సంధానం",
      "తార్కికం – నిరూపణ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The natural magnet among the following is",
    "options": [
      "Bar magnet",
      "Horse shoe magnet",
      "Ring magnet",
      "Load stone"
    ],
    "correct": 4,
    "question_te": "కింది వాటిలో సహజ అయస్కాంతం",
    "options_te": [
      "కడ్డీ అయస్కాంతం",
      "గుర్రపునాడ అయస్కాంతం",
      "వలయ అయస్కాంతం",
      "లోడ్‌స్టోన్ (సహజ అయస్కాంత శిల)"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "On a Celsius scale thermometer, each division is equal to (in ºC)",
    "options": [
      "1",
      "0.1",
      "0.2",
      "10"
    ],
    "correct": 2,
    "question_te": "సెల్సియస్ స్కేల్ థర్మామీటర్‌లో ప్రతి విభాగం విలువ (°C లలో)",
    "options_te": [
      "1",
      "0.1",
      "0.2",
      "10"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The planets that rotate from East to West are",
    "options": [
      "Earth, Mercury",
      "Earth, Venus",
      "Venus, Uranus",
      "Uranus, Neptune"
    ],
    "correct": 3,
    "question_te": "తూర్పు నుండి పడమరకు తిరిగే గ్రహాలు",
    "options_te": [
      "భూమి, బుధుడు",
      "భూమి, శుక్రుడు",
      "శుక్రుడు, యురేనస్",
      "యురేనస్, నెప్ట్యూన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The situation that has only potential energy (and no kinetic energy) is",
    "options": [
      "a flying aircraft",
      "a rolling stone",
      "a stretched rubber band",
      "flowing water"
    ],
    "correct": 3,
    "question_te": "కేవలం స్థితిజ శక్తి మాత్రమే ఉండి, గతిజ శక్తి లేని పరిస్థితి",
    "options_te": [
      "ఎగురుతున్న విమానం",
      "దొర్లుతున్న రాయి",
      "సాగదీసిన రబ్బరు బ్యాండ్",
      "ప్రవహిస్తున్న నీరు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The refractive index of glass with respect to air is 2. The critical angle of the glass-air interface is (in degrees)",
    "options": [
      "0",
      "30",
      "45",
      "60"
    ],
    "correct": 2,
    "question_te": "గాలికి సంబంధించి గాజు వక్రీభవన గుణకం 2. గాజు-గాలి అంతరతలం వద్ద క్రాంతికోణం (డిగ్రీలలో)",
    "options_te": [
      "0",
      "30",
      "45",
      "60"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "Joule/Coulomb is equal to",
    "options": [
      "1 Watt",
      "1 Volt",
      "1 Ampere",
      "1 Ohm"
    ],
    "correct": 2,
    "question_te": "జౌల్/కూలంబ్ దీనికి సమానం",
    "options_te": [
      "1 వాట్",
      "1 వోల్ట్",
      "1 ఆంపియర్",
      "1 ఓమ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The colour of phenolphthalein indicator in an acidic medium is",
    "options": [
      "Red",
      "Pink",
      "Yellow",
      "Colourless"
    ],
    "correct": 4,
    "question_te": "ఆమ్ల మాధ్యమంలో ఫినాఫ్తలీన్ సూచిక రంగు",
    "options_te": [
      "ఎరుపు",
      "గులాబీ",
      "పసుపు",
      "రంగులేనిది"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "The chemical nature of a non-metallic oxide is",
    "options": [
      "Acidic",
      "Basic",
      "Amphoteric",
      "Neutral"
    ],
    "correct": 1,
    "question_te": "అలోహ ఆక్సైడ్ యొక్క రసాయన స్వభావం",
    "options_te": [
      "ఆమ్ల స్వభావం",
      "క్షార స్వభావం",
      "ఉభయస్వభావ",
      "తటస్థ"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "This gas has a rotten-egg smell",
    "options": [
      "Carbon dioxide",
      "Carbon monoxide",
      "Hydrogen sulphide",
      "Hydrogen"
    ],
    "correct": 3,
    "question_te": "కుళ్ళిన గుడ్డు వాసన కలిగిన వాయువు",
    "options_te": [
      "కార్బన్ డయాక్సైడ్",
      "కార్బన్ మోనాక్సైడ్",
      "హైడ్రోజన్ సల్ఫైడ్",
      "హైడ్రోజన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "In galvanization, iron is coated with",
    "options": [
      "Tin",
      "Chromium",
      "Nickel",
      "Zinc"
    ],
    "correct": 4,
    "question_te": "గాల్వనైజేషన్‌లో ఇనుముపై పూత వేసే పదార్థం",
    "options_te": [
      "తగరం",
      "క్రోమియం",
      "నికెల్",
      "జింక్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "Plastics are materials obtained from",
    "options": [
      "Glass",
      "Metals",
      "Petrochemicals",
      "Wood"
    ],
    "correct": 3,
    "question_te": "ప్లాస్టిక్‌లు వీటి నుండి తయారవుతాయి",
    "options_te": [
      "గాజు",
      "లోహాలు",
      "పెట్రో రసాయనాలు",
      "కర్ర"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Physical Science",
    "question": "A mixture of water and diesel is an example of",
    "options": [
      "Colloidal solution",
      "True solution",
      "Miscible mixture",
      "Immiscible mixture"
    ],
    "correct": 4,
    "question_te": "నీరు మరియు డీజిల్ మిశ్రమం దీనికి ఉదాహరణ",
    "options_te": [
      "కొల్లాయిడల్ ద్రావణం",
      "నిజ ద్రావణం",
      "మిశ్రణీయ మిశ్రమం",
      "అమిశ్రణీయ మిశ్రమం"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "To get 'Honeydew', ants keep a type of insect called",
    "options": [
      "Aphids",
      "Honeybees",
      "Soldier ants",
      "Drones"
    ],
    "correct": 1,
    "question_te": "'తేనె స్రావం' (Honeydew) పొందడానికి చీమలు పెంచే కీటకం",
    "options_te": [
      "ఆఫిడ్స్",
      "తేనెటీగలు",
      "సైనిక చీమలు",
      "డ్రోన్లు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "The joint between the upper jaw and the rest of the head is a",
    "options": [
      "Hinge Joint",
      "Fixed Joint",
      "Pivot Joint",
      "Ball and Socket Joint"
    ],
    "correct": 2,
    "question_te": "పై దవడకు, తల మిగతా భాగానికి మధ్య ఉండే కీలు",
    "options_te": [
      "కీలుకీలు (హింజ్ కీలు)",
      "స్థిర కీలు",
      "ధురా కీలు",
      "బంతి-గిన్నె కీలు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "One of the following is an Indian native crop",
    "options": [
      "Tomato",
      "Cauliflower",
      "Pear",
      "Sugarcane"
    ],
    "correct": 4,
    "question_te": "కింది వాటిలో భారతదేశ స్థానిక పంట",
    "options_te": [
      "టమాటా",
      "కాలిఫ్లవర్",
      "బేరిపండు",
      "చెరకు"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "The process of killing larvae inside a cocoon before silk reeling is called",
    "options": [
      "Stuffing",
      "Sealing",
      "Stifling",
      "Stalking"
    ],
    "correct": 3,
    "question_te": "పట్టు నూలు తీయడానికి ముందు గూడులో ఉన్న లార్వాలను చంపే ప్రక్రియ",
    "options_te": [
      "స్టఫింగ్",
      "సీలింగ్",
      "స్టిఫ్లింగ్ (ఊపిరాడకుండా చేయడం)",
      "స్టాకింగ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "\"The nucleus is an integral part of the cell\" was stated by",
    "options": [
      "Robert Hooke",
      "Robert Brown",
      "Felice Fontana",
      "Jan Swammerdam"
    ],
    "correct": 2,
    "question_te": "\"కేంద్రకం కణంలో అంతర్భాగం\" అని పేర్కొన్నవారు",
    "options_te": [
      "రాబర్ట్ హుక్",
      "రాబర్ట్ బ్రౌన్",
      "ఫెలిస్ ఫొంటానా",
      "జాన్ స్వామర్‌డామ్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "'Helicobacter pylori' is responsible for",
    "options": [
      "Peptic ulcer",
      "Jaundice",
      "Uterine cancer",
      "Hepatitis - D"
    ],
    "correct": 1,
    "question_te": "'హెలికోబాక్టర్ పైలోరీ' దీనికి కారణమవుతుంది",
    "options_te": [
      "పెప్టిక్ అల్సర్",
      "కామెర్లు",
      "గర్భాశయ క్యాన్సర్",
      "హెపటైటిస్ - D"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "An alternative method to incineration for burning waste materials is",
    "options": [
      "Hydrolysis",
      "Pyrolysis",
      "Methanation",
      "Eutrophication"
    ],
    "correct": 2,
    "question_te": "వ్యర్థ పదార్థాలను దహనం చేయడానికి ప్రత్యామ్నాయ పద్ధతి",
    "options_te": [
      "జలవిశ్లేషణ",
      "పైరోలిసిస్ (ఉష్ణ విశ్లేషణ)",
      "మిథనేషన్",
      "యూట్రోఫికేషన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "'Lichens' are colonies of",
    "options": [
      "Bacteria and Fungi",
      "Algae and Fungi",
      "Virus and Algae",
      "Bacteria and Virus"
    ],
    "correct": 2,
    "question_te": "'లైకెన్లు' వీటి సముదాయాలు",
    "options_te": [
      "బాక్టీరియా మరియు శిలీంధ్రాలు",
      "శైవలాలు మరియు శిలీంధ్రాలు",
      "వైరస్ మరియు శైవలాలు",
      "బాక్టీరియా మరియు వైరస్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "One of the following is NOT a site of taste sensation",
    "options": [
      "Fungiform papillae",
      "Circumvallate papillae",
      "Foliate papillae",
      "Filiform papillae"
    ],
    "correct": 4,
    "question_te": "కింది వాటిలో రుచి గ్రహణ స్థానం కానిది",
    "options_te": [
      "ఫంగిఫాం పాపిల్లే",
      "సర్క్యుమ్‌వాలేట్ పాపిల్లే",
      "ఫోలియేట్ పాపిల్లే",
      "ఫిలిఫాం పాపిల్లే"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "The correct pair of a vitamin and its chemical name is",
    "options": [
      "A – Ascorbic acid",
      "D – Calciferol",
      "B1 – Biotin",
      "E – Phylloquinone"
    ],
    "correct": 2,
    "question_te": "విటమిన్‌కు, దాని రసాయన నామానికి సరైన జోడీ",
    "options_te": [
      "A – ఆస్కార్బిక్ ఆమ్లం",
      "D – కాల్సిఫెరాల్",
      "B1 – బయోటిన్",
      "E – ఫైలోక్వినోన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "The alkaloid-based compound that acts as an insecticide is",
    "options": [
      "Scopolamine",
      "Reserpine",
      "Pyrithroid",
      "Caffeine"
    ],
    "correct": 3,
    "question_te": "క్రిమిసంహారకంగా పనిచేసే ఆల్కలాయిడ్ ఆధారిత సమ్మేళనం",
    "options_te": [
      "స్కోపొలమైన్",
      "రెసర్పైన్",
      "పైరిత్రాయిడ్",
      "కెఫిన్"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 2A (Maths & Science), 17 June 2018",
    "subject": "Biology",
    "question": "The number of synergids, antipodals and egg cells in the embryo sac of most flowering plants, respectively, is",
    "options": [
      "3, 2, 2",
      "2, 3, 1",
      "1, 2, 3",
      "4, 1, 2"
    ],
    "correct": 2,
    "question_te": "చాలా పుష్పించే మొక్కల భ్రూణ కోశంలో సినర్జిడ్‌లు, ప్రతిధృవ కణాలు (యాంటిపోడల్స్), అండ కణాల సంఖ్య వరుసగా",
    "options_te": [
      "3, 2, 2",
      "2, 3, 1",
      "1, 2, 3",
      "4, 1, 2"
    ]
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"గన్నెలు నిన్నురాత్రి పారిపోయాయి\" అని వరహాలయ్యతో అన్నవారు",
    "options": [
      "శ్రీకృష్ణదేవరాయలు",
      "తెనాలి రామకృష్ణుడు",
      "మహామంత్రి తిమ్మరుసు",
      "తాతాచార్యులు"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "కిటకిట తలుపులు కిటారు తలుపులు\nఎప్పుడు తీసినా చప్పుడుకావు .... ఈ పొడుపు కథకు విడుపు",
    "options": [
      "ద్వారాలు",
      "చేతివేళ్ళు",
      "కనురెప్పలు",
      "పెదవులు"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "కింది పదాలను సరైన అర్థాన్నిచ్చే పదాలతో జతపరచండి.\n(అ) పరామర్శ    (క) ప్రేమ\n(ఆ) నేస్తాలు    (గ) పలకరించడం\n(ఇ) మమకారం   (చ) స్నేహితులు",
    "options": [
      "అ-గ; ఆ-చ; ఇ-క",
      "అ-క; ఆ-గ; ఇ-చ",
      "అ-చ; ఆ-క; ఇ-గ",
      "అ-గ; ఆ-క; ఇ-చ"
    ],
    "correct": 1
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "'వృషభం' అనగా అర్థం.",
    "options": [
      "సింహం",
      "ఆవు",
      "దున్నపోతు",
      "ఎద్దు"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "'మొసలి కన్నీరు' జాతీయాన్ని ఏ అర్థంలో ప్రయోగిస్తారు",
    "options": [
      "ప్రయోజనం గలది",
      "అనుభవం సంపాదించు",
      "తెలివితక్కువ",
      "లేని బాధను నటించడం"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"ఎలుక విందు\" గేయ కథ రచయిత",
    "options": [
      "గిడుగు రాజేశ్వరరావు",
      "కొండపల్లి శేషగిరిరావు",
      "దాశరథి కృష్ణమాచార్య",
      "వానమామలై వరదాచార్యులు"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "జాతీయజెండాలో తెలుపు రంగు వేటికి చిహ్నం",
    "options": [
      "ధైర్యం, త్యాగం",
      "శాంతి, సత్యం",
      "నమ్మకం, సమృద్ధి",
      "భూమి, సమృద్ధి"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"ఆవులు గట్టు ఎక్కి గడ్డి మేశాయి\" ఈ వాక్యం",
    "options": [
      "సామాన్యవాక్యం",
      "సంయుక్తవాక్యం",
      "సంక్లిష్టవాక్యం",
      "మహావాక్యం"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "'పరికించు' పదానికి పర్యాయపదాలు",
    "options": [
      "నైపుణ్యం, సామర్థ్యం",
      "గౌరవం, విలువ",
      "పౌరుషం, ప్రతిజ్ఞ",
      "పరిశీలించు, చూచు"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"గుర్వాజ్ఞ\" పదాన్ని విడదీయగా వచ్చిన రూపం",
    "options": [
      "గుర్వ + ఆజ్ఞ",
      "గుర + ఆజ్ఞ",
      "గురు + ఆజ్ఞ",
      "గుః + ఆజ్ఞ"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"పల్స్ పోలియో కార్యక్రమంలో వైద్య సిబ్బందికి సహకరించడం, నిరక్షరాస్యులైన పెద్దలకు చదువు నేర్పించడం\" వంటివి ఈ స్పృహకు చెందుతాయి",
    "options": [
      "నైతికస్పృహ",
      "సామాజికస్పృహ",
      "భాషాస్పృహ",
      "ఆధ్యాత్మికస్పృహ"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "\"దమ్మం\" అను పదానికి ప్రకృతి",
    "options": [
      "ధర్మం",
      "ధార్మికం",
      "దారవం",
      "దమ్ము"
    ],
    "correct": 1
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "రచయిత ఆత్మాశ్రయ శైలిలో, తాను చూసిన ప్రదేశాన్ని గురించి వర్ణించే రచన",
    "options": [
      "జీవయాత్ర",
      "యాత్రారచన",
      "జీవితచరిత్ర",
      "వ్యాసం"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "కర్షకులు, కార్మికులు, పీడితులు, పేదలు అనుభవించే కష్టసుఖాలను కవితా వస్తువులుగా తీసుకొని ఖడ్గసృష్టి చేసింది.",
    "options": [
      "సి. నారాయణరెడ్డి",
      "శ్రీరంగం శ్రీనివాసరావు",
      "నండూరి రామమోహనరావు",
      "నార్ల వేంకటేశ్వరరావు"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "'అనిమిషులు' అనగా",
    "options": [
      "నిముషం మాత్రమే బతికే వారు",
      "రెప్పపాటు లేనివారు",
      "పొట్టతో పాకేవారు",
      "నీటి నుండి పుట్టువారు"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "'నిశ్చయం' - అను పదం యొక్క గణం",
    "options": [
      "రగణం",
      "సగణం",
      "జగణం",
      "తగణం"
    ],
    "correct": 1
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "ఒక పనిని చేయవద్దనే అర్థాన్ని సూచించే వాక్యం",
    "options": [
      "అనుమత్యర్థక వాక్యం",
      "విధ్యర్థక వాక్యం",
      "నిషేధార్థక వాక్యం",
      "సామర్ధ్యార్థక వాక్యం"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "చేతిలో అనువుగా ఒదిగి ఒక విషయానికి సంబంధించిన వివరణను ఇచ్చే కాగితం",
    "options": [
      "వార్తాపత్రిక",
      "దినపత్రిక",
      "సంకలనం",
      "కరపత్రం"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "పత్రికొక్కటియున్న పదివేల సైన్యము\nపత్రికొక్కటున్న మిత్రకోటి .... తరువాత వచ్చే పద్యపాదాన్ని\nగుర్తించండి.",
    "options": [
      "పరుల పుస్తకము నెరవు తెచ్చిపెట్టిన",
      "స్తవనీయ, దేవు, శతులన్",
      "ప్రజకు రక్షలేదు పత్రిక లేకున్న",
      "పేదవాని యింట పెండ్లైన యిరుగరు"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "బాలికల విద్యే ప్రధాన ఇతివృత్తంగా రాయబడిన పాఠం",
    "options": [
      "శ్రీలు పొంగిన జీవగడ్డ",
      "తెలుగు వెలుగు",
      "జానపద కళలు",
      "సీత ఇష్టాలు"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "కింది గద్యాన్ని చదివి 51-52 ప్రశ్నలకు జవాబులను గుర్తించండి.\nపగలు ఎక్కువగా నిద్రపోవడం కూడా ఉపవాసంలోని ఒక అంశమే. ఉపవాసం వల్ల ఆకలిదప్పుల అనుభూతి ఏమిటో తెలుస్తుంది. శక్తిసామర్థ్యాలు క్షీణించడం తెలుస్తుంది. హృదయాన్ని పరిశుద్ధ పరచడమే దీని పరమావధి.\n\nపై గద్యంలో 'శక్తిసామర్థ్యాలు' వంటి జంట పదం ఉంది గుర్తించండి.",
    "options": [
      "క్షీణించడం",
      "అనుభూతి",
      "ఉపవాసాంశం",
      "ఆకలిదప్పులు"
    ],
    "correct": 4
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "ఉపవాస ప్రధానలక్ష్యం",
    "options": [
      "ఎక్కువగా నిద్రపోవడం",
      "ఆకలిదప్పుల అనుభూతి",
      "హృదయం పరిశుద్ధమవడం",
      "శక్తిసామర్థ్యాలు క్షీణించడం"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "కింది పద్యాన్ని చదివి 53-54 ప్రశ్నలకు జవాబులను గుర్తించండి.\nసద్గురులు చేయు నుపదేశ సారములను\nనెంత యజ్ఞానమైనను నిష్టిపోవు\nమంచి వైద్యుడిచ్చోడి చిన్నమాత్రచేత\nదారుణంబగు రోగంబు తొలగునట్లు\n\nసద్గురువుల ఉపదేశం వల్ల తొలగిపోయేది",
    "options": [
      "సారం",
      "అజ్ఞానం",
      "దారుణం",
      "రోగం"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "పై పద్యంలో గురువును వీరితో పోల్చారు.",
    "options": [
      "అజ్ఞాని",
      "ఉపదేశి",
      "వైద్యునితో",
      "చిన్నమాత్రతో"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "శ్రవ్య బోధనాభ్యసన ఉపకరణం",
    "options": [
      "సంగీతవాయిద్యం",
      "టి.వి.",
      "కంప్యూటర్",
      "చార్టులు"
    ],
    "correct": 1
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "నీతివిద్య, ఆరోగ్యవిద్య, విలువలవిద్య అనేవి",
    "options": [
      "బోధనేతర కార్యక్రమాలు",
      "సహపాఠ్యాంశాలు",
      "సామర్థ్యాధారిత కార్యక్రమాలు",
      "మదింపు లక్షణాలు"
    ],
    "correct": 2
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "ద్రావిడ భాషకు సహజమైన ట, డ, ఢ అనే అక్షరాలు",
    "options": [
      "కంఠ్యాలు",
      "తాలవ్యాలు",
      "మూర్ధన్యాలు",
      "ఓష్ఠ్యాలు"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "ఒక నిర్దిష్ట భౌగోళిక ప్రాంతంలో ప్రజలు ఉపయోగించే భాషావ్యవహార రూపం",
    "options": [
      "గ్రాంధికభాష",
      "మాతృభాష",
      "మాండలికభాష",
      "వ్యవహార భాష"
    ],
    "correct": 3
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "విద్యార్థి ఒక తరగతి నుండి మరో తరగతికి ఉత్తీర్ణుడైనప్పుడు ఆ సంవత్సరాంతానికి కనీసం నేర్చుకోవలసిన సామర్థ్యాలు సూచించేది.",
    "options": [
      "కనీస అభ్యసనస్థాయి",
      "విద్యలో నాణ్యత",
      "భాషాలక్ష్యాలు",
      "విద్యాదర్శిని"
    ],
    "correct": 1
  },
  {
    "year": 2018,
    "paper": "AP TET Paper 1 (Language I - Telugu), 12 June 2018",
    "subject": "Telugu",
    "question": "విద్యార్థి తాను నేర్చుకున్న విషయాన్ని సొంతమాటల్లో రాస్తే అది",
    "options": [
      "పదజాలం",
      "ప్రశంస",
      "స్వీయరచన",
      "సృజనాత్మకత"
    ],
    "correct": 3
  }
];

function seedTetQuestions() {
  db.exec('DELETE FROM tet_questions;');
  const insert = db.prepare(
    `INSERT INTO tet_questions (id, subject, question, option_a, option_b, option_c, option_d, correct_option, source, year, question_te, option_a_te, option_b_te, option_c_te, option_d_te)
     VALUES (@id, @subject, @question, @option_a, @option_b, @option_c, @option_d, @correct_option, @source, @year, @question_te, @option_a_te, @option_b_te, @option_c_te, @option_d_te)`
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
      // Telugu translation, where available (Pedagogy/Maths/Science — see
      // README). English-subject questions have none of these, on purpose.
      question_te: q.question_te || null,
      option_a_te: q.options_te ? q.options_te[0] : null,
      option_b_te: q.options_te ? q.options_te[1] : null,
      option_c_te: q.options_te ? q.options_te[2] : null,
      option_d_te: q.options_te ? q.options_te[3] : null,
    });
  }
}

function seed() {
  db.exec(`
    DELETE FROM tet_mock_attempts;
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
  ).run(teacherId, 'teacher@vb', bcrypt.hashSync('teacher123', 10), 'teacher', 'Teacher', classId);

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
  ).run(parentId, 'parent@vb', bcrypt.hashSync('parent123', 10), 'parent', 'Parent', classId, aaravId);
  db.prepare('UPDATE students SET parent_user_id = ? WHERE id = ?').run(parentId, aaravId);

  db.prepare('INSERT INTO diary_entries (id, class_id, who, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id(),
    classId,
    'Teacher',
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
  console.log('Teacher login:  teacher@vb / teacher123');
  console.log('Parent login:   parent@vb / parent123  (linked to Aarav Mehta)');
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
