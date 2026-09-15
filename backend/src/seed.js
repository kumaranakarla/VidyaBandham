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
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "A primary school teacher observed a child biting nails and recalled Freud's Psycho Sexual Developmental Theory. This unusual behaviour is stabilized at",
    "options": [
      "Genital Stage",
      "Phallic Stage",
      "Anal Stage",
      "Oral Stage"
    ],
    "correct": 4,
    "question_te": "ప్రాధమిక పాఠశాలలోని ఒక పిల్లవాడు గోళ్ళుకొరకడం గమనించిన ఉపాధ్యాయుడు, ఫ్రాయిడ్ – మనో లైంగిక వికాస సిద్ధాంతాన్ని పునఃస్మరణ చేసుకున్నాడు. ఈ అపసవ్య లక్షణం ఈ దశలో స్థిరీభావనం చెందుతుంది.",
    "options_te": [
      "జననాంగ దశ",
      "శిశ్న దశ",
      "ఆసన దశ",
      "మౌఖిక దశ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The correct pairs related to the stages of development.\na) Neonatal – Imitation Age\nb) Infancy – Critical Age\nc) Early Childhood – Questioning Age\nd) Adolescence - Void",
    "options": [
      "a, b only",
      "b, c only",
      "a, b, c only",
      "a, b, d only"
    ],
    "correct": 2,
    "question_te": "వికాసదశలకు సంబంధించి సరైన జతలు\na) నవజాత శిశు దశ – అనుకరణ వయస్సు\nb) శైశప దశ – క్లిష్ట వయస్సు\nc) పూర్వ బాల్య దశ – ప్రశ్నించే వయస్సు\nd) కౌమార దశ – వాయిడ్",
    "options_te": [
      "a, b only",
      "b, c only",
      "a, b, c only",
      "a, b, d only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "Match the following based on psycho social stages of Eric Ericson with their virtues.\n(i) Initiative Vs Guilt          (a) Care\n(ii) Industry Vs Inferiority     (b) Utility\n(iii) Identity Vs Identify Confusion  (c) Capability\n(iv) Generativity Vs Stagnation  (d) Reliability",
    "options": [
      "i – c   ii – d   iii – a   iv – b",
      "i – b   ii – c   iii – d   iv – a",
      "i – a   ii – b   iii – c   iv – d",
      "i – d   ii – a   iii – b   iv – c"
    ],
    "correct": 2,
    "question_te": "ఎరిక్ ఎరిక్సన్ ప్రకారం మనో సాంఘిక దశలను వాటి లక్షణాలతో జతపరచుము.\n(i) చౌరవ Vs అపరాధం       (a) సంరక్షణ\n(ii) శ్రమశీలత Vs న్యూనత     (b) ప్రయోజనం\n(iii) తాదాత్మ్యం Vs తాదాత్మ్యసంభ్రమం   (c) సామర్థ్యం\n(iv) ఉత్పాదకత Vs స్తబ్దత     (d) విశ్వసనీయత",
    "options_te": [
      "i – c   ii – d   iii – a   iv – b",
      "i – b   ii – c   iii – d   iv – a",
      "i – a   ii – b   iii – c   iv – d",
      "i – d   ii – a   iii – b   iv – c"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "Match the stages of Kohlberg's stages of Moral Development with their characteristics.\n(i) Pre-Conventional   (a) Good - Boy Good Girl Orientation\n(ii) Conventional      (b) Social contract Orientation\n(iii) Post Conventional  (c) Self need",
    "options": [
      "i – a   ii – b   iii – c",
      "i – b   ii – a   iii – c",
      "i – c   ii – a   iii – b",
      "i – a   ii – c   iii – b"
    ],
    "correct": 3,
    "question_te": "కోల్బర్గ్ నైతిక వికాస సిద్ధాంత స్థాయిలను వాటి లక్షణాలతో జాతపరచుము.\n(i) పూర్వసాంప్రదాయ   (a) మంచి అమ్మాయి అబ్బాయి అనిపించుకోవడం\n(ii) సాంప్రదాయ       (b) సామాజిక ఒప్పందాల దృక్పదం\n(iii) ఉత్తర సాంప్రదాయ  (c) స్వీయ అపసరం",
    "options_te": [
      "i – a   ii – b   iii – c",
      "i – b   ii – a   iii – c",
      "i – c   ii – a   iii – b",
      "i – a   ii – c   iii – b"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The recent researches reveal that proper socialization is not occurring among the children due to this reason",
    "options": [
      "Dual family system",
      "Joint family system",
      "Communal family system",
      "Nuclear family system"
    ],
    "correct": 4,
    "question_te": "పిల్లలలో సాంఘీకీకరణ ఈ కారణం వలన సరిగా జరగటం లేదని ఇటీవలి పరిశోధనలు తెలుపుతున్నాయి.",
    "options_te": [
      "ద్వంద్వ కుటుంబ వ్యవస్థ",
      "ఉమ్మడి కుటుంబ వ్యవస్థ",
      "సంఘు కుటుంబ వ్యవస్థ",
      "చిన్న కుటుంబ వ్యవస్థ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "A student learns numbers, additions, subtractions and perform operations like multiplications, divisions with his prior knowledge and now able to solve simple equations. Thus the student exhibits this principle of development.",
    "options": [
      "Principle of Predictability",
      "Principle of Heredity and Environment",
      "Principle of Inter-relationship",
      "Principle of Continuity and Cumulative"
    ],
    "correct": 4,
    "question_te": "ఒక విద్యార్థి మొదట సంఖ్యలు, కూడికలు, తీసివేతలు నేర్చుకుని తద్వారా తన పూర్వ జ్ఞానముతో గుణకారాలు, భాగహారాలు చేస్తూ, ఇప్పుడు చిన్నసమీకరణాలను చేదించగలుగుచున్నాడు. ఆ విద్యార్థి ఈ వికాస సూత్రాన్ని ప్రదర్శిస్తున్నాడు.",
    "options_te": [
      "ప్రాగుక్తీకరణ సూత్రం",
      "అనువంశికత మరియు పరిసరాల సూత్రం",
      "అంతర సంబంధ సూత్రం",
      "అవిచ్ఛిన్న మరియు సంచిత సూత్రం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "A branch of psychology that deals with how a child grows and changes over a period of time is",
    "options": [
      "Experimental Psychology",
      "Abnormal Psychology",
      "Developmental Psychology",
      "Social Psychology"
    ],
    "correct": 3,
    "question_te": "పిల్లవాడి పెరుగదల మరియు కాలంతోపాటు వచ్చే మార్పులను అధ్యయనం చేసే మనోవిజ్ఞానశాస్త్ర విభాగం",
    "options_te": [
      "ప్రయోగాత్మక మనోవిజ్ఞాన శాస్త్రం",
      "అపసామాన్య మనోవిజ్ఞాన శాస్త్రం",
      "వికాస మనోవిజ్ఞాన శాస్త్రం",
      "సాంఘిక మనోవిజ్ఞాన శాస్త్రం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The number of autosomes present in the human genetic material is",
    "options": [
      "23 pairs",
      "22 pairs",
      "21 pairs",
      "20 pairs"
    ],
    "correct": 2,
    "question_te": "మానవ జన్యువులోని ఆటోజోముల సంఖ్య",
    "options_te": [
      "23 జతలు",
      "22 జతలు",
      "21 జతలు",
      "20 జతలు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The incorrect statement regarding Heredity supporters of development\n1) Dugdale observed Darwin's family.\n2) Freeman studied many twins and siblings on their intelligence\n3) Alport opined that individual differences are also due to hereditary\n4) Galton studied family histories of 997 individuals in England",
    "options": [
      "Dugdale observed Darwin's family.",
      "Freeman studied many twins and siblings on their intelligence",
      "Alport opined that individual differences are also due to hereditary",
      "Galton studied family histories of 997 individuals in England"
    ],
    "correct": 1,
    "question_te": "అనువంశికవాదులకు సంబంధించి సరికాని వాక్యము",
    "options_te": [
      "డగ్ డేల్ డార్విన్ కుటుంబాన్ని పరిశీలించారు",
      "ఫ్రీమెన్ చాలా మంది కవలు మరియు సోదరుల ప్రజ్ఞ పై అభ్యసించారు",
      "ఆల్ పోర్ట్ వైయుక్తికభేదాలకు అనువంశికత కూడా కారణమని అభిప్రాయపడ్డారు",
      "గాల్టన్ 997 ఇంగ్లాండ్ వ్యక్తుల కుటుంబ చరిత్రలను అధ్యయనం చేశారు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "This is not a stage in the process of Meta Cognition",
    "options": [
      "Planning",
      "Monitoring",
      "Evaluation",
      "Reinforcement"
    ],
    "correct": 4,
    "question_te": "స్వబుద్ధి ప్రక్రియలోని దశ కానిది",
    "options_te": [
      "ప్రణాళిక తయారీ",
      "పర్యవేక్షించడం",
      "మూల్యాంకనం",
      "పునర్బలనం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The incorrect pair related to theories of Transfer of learning and their proponents.\n(a) Theory of Identical Element – Watson\n(b) Theory of Generalization – Charles Judd\n(c) Theory of Ideals – Carl Rogers",
    "options": [
      "a, b only",
      "b, c only",
      "b only",
      "a, c only"
    ],
    "correct": 4,
    "question_te": "అభ్యసన బదలాయింపు సిద్ధాంతాలను వాటి ప్రతిపాదించిన వారి సరికాని జత\n(a) సమరూప అంశాల సిద్ధాంతం – వాట్సన్\n(b) సాధారణీకరణ సిద్ధాంతం – చార్లస్ జడ్\n(c) ఆదర్శాల సిద్ధాంతం – కార్ల్ రోజర్స్",
    "options_te": [
      "a, b only",
      "b, c only",
      "b only",
      "a, c only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "In Piaget's Cognitive Theory of Learning the Pre – conceptual stage, Intuitive thought stage are the sub stages of",
    "options": [
      "Sensory Motor Stage",
      "Pre – Operational Stage",
      "Concrete Operational Stage",
      "Formal Operational Stage"
    ],
    "correct": 2,
    "question_te": "పియాజే సంజ్ఞానాత్మక వికాస సిద్ధాంతం ప్రకారం, పూర్వభావనాత్మక దశ, అంతర్బుద్ధి ఆలోచన దశలు ఈ ప్రధాన దశలో అంతర్భాగం",
    "options_te": [
      "ఇంద్రియ ప్రచాలక దశ",
      "పూర్వ ప్రచాలక దశ",
      "మూర్త ప్రచాలక దశ",
      "అమూర్త ప్రచాలక దశ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The term 'Insight' was coined by",
    "options": [
      "Kohler",
      "Kurt Koffka",
      "Max Wertheimer",
      "Stern Berg"
    ],
    "correct": 1,
    "question_te": "అంతర్ దృష్టి అనే పదాన్ని మొదటిగా వాడిన వారు.",
    "options_te": [
      "కొహలర్",
      "కర్ట్ కోఫ్కా",
      "మాక్స్ వర్థీమర్",
      "స్టెర్న్ బర్గ్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "Coding system of categories is key factor in this theory of Learning",
    "options": [
      "Classical Conditioning",
      "Operant Conditioning",
      "Gestaltian Learning",
      "Discovery Learning"
    ],
    "correct": 4,
    "question_te": "వర్గాల సాంకేతీకరణ వ్యవస్థ (Coding system) అనేది ఈ అభ్యసన సిద్ధాంతంలోని ముఖ్య అంశం",
    "options_te": [
      "శాస్త్రీయ నిబంధనం",
      "కార్య సాధక నిబంధనం",
      "గెస్టాల్ట్ అభ్యసన సిద్ధాంతం",
      "అన్వేషణా అభ్యసనం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The stage in a learning curve where further progress is not shown in learning speed.",
    "options": [
      "Initial Spurt",
      "Stage of Fluctuation",
      "Plateau Stage",
      "Secondary Spurt (Spurt after Plateau Stage)"
    ],
    "correct": 3,
    "question_te": "అభ్యసన వక్రరేఖలో అభ్యసన వేగంలో ఏ మాత్రం అభివృద్ధి చూపలేని దశ",
    "options_te": [
      "ప్రారంభ స్ఫూర్తి",
      "చాంచల్య దశ",
      "పీఠభూమి దశ",
      "పీఠభూమి తరువాత స్ఫూర్తి"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "Natural, unconscious learning takes through",
    "options": [
      "Instructional Learning",
      "Social Learning",
      "Experiential Learning",
      "Humanistic Learning"
    ],
    "correct": 2,
    "question_te": "సహజమైన మరియు అచేతన అభ్యసనం దీని ద్వారా జరుగుతుంది.",
    "options_te": [
      "బోధనా అభ్యసనం",
      "సామాజిక అభ్యసనం",
      "అనుభవపూర్వక అభ్యసనం",
      "మానవతావాద అభ్యసనం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "According to NCF 2023, the approach to impart vocational education in the Middle stage is to provide relevant exposure to students to as many vocations as possible in the form of",
    "options": [
      "Excursions",
      "Projects",
      "Text Books",
      "Brouchers"
    ],
    "correct": 2,
    "question_te": "NCF 2023 ప్రకారం, మధ్య దశలో వృత్తి విద్య బోధించే భాగంగా విద్యార్థులకు తెలపడం కొరకు ఎక్కువ వీలైనన్ని వృత్తులను పరిచయం ఈ రూపంలో చేయాలన్నారు",
    "options_te": [
      "విజ్ఞాన యాత్రలు",
      "ప్రాజెక్టులు",
      "పాఠ్య పుస్తకాలు",
      "బ్రోచర్లు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "According to Ebbinghaus, the percentage of forgetting after 20 minutes",
    "options": [
      "75%",
      "53%",
      "69%",
      "47%"
    ],
    "correct": 4,
    "question_te": "ఎబ్బింగ్ హాస్ ప్రకారం, అభ్యసించిన 20 నిమిషాల తరువాత విస్మృతి శాతం",
    "options_te": [
      "75%",
      "53%",
      "69%",
      "47%"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The psychologist who defines intelligence as the aggregate or global capacity of an individual to act purposefully, to think rationally is",
    "options": [
      "Jean Piaget",
      "David Weschler",
      "Sternberg",
      "Terman"
    ],
    "correct": 2,
    "question_te": "ప్రజ్ఞ అంటే ప్రయోజకత్వంగా ప్రవర్తించడానికి, హేతుబద్ధంగా ఆలోచించడానికి అవసరమయ్యే సామర్థ్యము అని పేర్కొన్న మనోవిజ్ఞాన శాస్త్రవేత్త",
    "options_te": [
      "జీన్ పియాజె",
      "డేవిడ్ వెష్లర్",
      "స్టెర్న్ బర్గ్",
      "టెర్మన్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The term 'Aptitude' is originated from the Latin word",
    "options": [
      "Aptis",
      "Aptus",
      "Aptitude",
      "Apto"
    ],
    "correct": 2,
    "question_te": "'ఆప్టిట్యూడ్' అనునది ఈ లాటిన్ పదం నుండి ఉద్భవించింది.",
    "options_te": [
      "ఆప్ టిస్",
      "ఆప్ టస్",
      "ఆప్టిట్యూడ్",
      "ఆప్టో"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "Statement (A): Sigmund Freud's Psychodynamic approach of personality is primarily shaped by conscious experiences in adulthood.\nStatement (B): Freud's Psychodynamic approach focuses on unconscious processes and early childhood experiences significantly shape personality.",
    "options": [
      "A is true and B is false.",
      "A is false and B is true.",
      "Both A and B are true.",
      "Both A and B are false."
    ],
    "correct": 2,
    "question_te": "వాక్యం (A): సిగ్మండ్ ఫ్రాయిడ్ ప్రకారం, మూర్తిమత్వం అనేది ప్రధానంగా వయోజన దశలో చేతన అనుభవాల ద్వారా రూపుదిద్దుకుంటుంది.\nవాక్యం (B): ఫ్రాయిడ్ యొక్క మనోవిశ్లేషణ విధానం అచేతన ప్రక్రియల మరియు బాల్య అనుభవాలు మూర్తిమత్వవికాసాన్ని ప్రభావితం చేస్తాయని చెబుతుంది.",
    "options_te": [
      "A is true and B is false.",
      "A is false and B is true.",
      "Both A and B are true.",
      "Both A and B are false."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The psychologist who classified individuals as introverts and extroverts based on social participation is",
    "options": [
      "Allport",
      "Cattell",
      "Carl Jung",
      "Kogan"
    ],
    "correct": 3,
    "question_te": "సాంఘిక కార్యక్రమాలలో పాల్గొనే అభిరుచిని బట్టి వ్యక్తులను అంతర్వర్తనులు మరియు బహిర్వర్తనులుగా వర్గీకరించినవారు",
    "options_te": [
      "ఆలపోర్ట్",
      "కాటెల్",
      "కార్ల్ యంగ్",
      "కోగన్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "A teacher notices that standard paper – pen tests donot accurately reflect the conceptual understanding of learning among the students. She develops performance based rubric assessments and tests them in her science class. This intervention represents action research with in the scope area of",
    "options": [
      "School Facilities Management",
      "National Literacy Data Collection",
      "Classroom Practices and Teaching Strategies",
      "Educational Policy Law Making"
    ],
    "correct": 3,
    "question_te": "సాధారణ పేపర్ -పెన్సిల్ పరీక్షల వలన భావనాత్మక అవగాహన కచ్చితంగా ప్రతిబింబించడం లేదని ఒక ఉపాధ్యాయిని గమనించి, పనితీరు ఆధారిత రూబ్రిక్ మూల్యాంకనాలను అభివృద్ధి చేసి, తన సైన్స్ తరగతి లో పరీక్షించింది. ఈ జోక్యం ఈ చర్యాత్మక పరిశోధన పరిధిలోనికి వస్తుంది.",
    "options_te": [
      "పాఠశాల సౌకర్యాల నిర్వహణ",
      "జాతీయ అక్షరాశ్యత దత్తాంశ సేకరణ",
      "తరగతి గది పద్ధతులు మరియు బోధనా వ్యూహాలు",
      "విద్యా విధాన చట్టాల రూపకల్పన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The international convention which explicitly safeguards children from corporal punishments and protects their rights, safety and dignity is",
    "options": [
      "Universal Declaration of Human Rights",
      "UNESCO Education Charter",
      "Geneva Convention",
      "United Nations Convention on the Rights of Children (CRC)"
    ],
    "correct": 4,
    "question_te": "పిల్లలను శారీరిక దండన నుండి రక్షించడంతో పాటు వారి భద్రత, గౌరవం మరియు వారి హక్కులను ప్రతిపాదించే అంతర్జాతీయ ఒప్పందం",
    "options_te": [
      "విశ్వ మానవ హక్కుల ప్రకటన",
      "యునెస్కో విద్యా చార్టర్",
      "జెనీవా ఒప్పందం",
      "ఐక్యరాజ్యసమితి బాలల హక్కుల ఒప్పందం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "P = 1 - [6*sum(D^2) / (N(N^2-1))]\nIn this formula 'D' represents",
    "options": [
      "Deviation form mean",
      "Differences between means",
      "Difference between ranks",
      "Standard Deviation"
    ],
    "correct": 3,
    "question_te": "P = 1 - [6*sum(D^2) / (N(N^2-1))] సూత్రంలో 'D' దీనిని సూచిస్తుంది",
    "options_te": [
      "సగటు నుండి విచలనం",
      "సగటుల మధ్య తేడా",
      "ర్యాంకుల మధ్య తేడా",
      "ప్రామాణిక విచలనం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The record that consists of students' past issues for a proper understanding of the child is",
    "options": [
      "Cumulative Record",
      "Checklist",
      "Interest Inventory",
      "Anecdotal Record"
    ],
    "correct": 4,
    "question_te": "విద్యార్థులపై సరైన అవగాహన కొరకు వారికి ఎదురైన గత సన్నివేశాలను దీనిలో పొందుపరుస్తారు.",
    "options_te": [
      "సంచిత రచన",
      "శోధనా సూచికలు",
      "అభిరుచి శోధిక",
      "సంఘటన రచన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "This is NOT a classroom challenge that acts as a barrier of communication.",
    "options": [
      "Cultural biases",
      "No relation with prior experiences of student",
      "Overuse of unfamiliar terms in lesson",
      "Using feedback techniques in teaching"
    ],
    "correct": 4,
    "question_te": "తరగతి గది సవాళ్ళకు సంబంధించి భావప్రసారంలో అవరోధం కానిది",
    "options_te": [
      "సాంస్కృతిక భేదాలు",
      "విద్యార్థి పూర్వ అనుభవంతో సంబంధం లేకపోవడం",
      "తెలియని పదాలను బోధనలో ఎక్కువగా వాడటం",
      "బోధన లో పరిపుష్టి మెలకువలు ఉపయోగించడం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "The short cut key for FONT dialogue box in MS-Word is",
    "options": [
      "Ctr + B",
      "Ctr + A",
      "Ctr + D",
      "Ctr + C"
    ],
    "correct": 3,
    "question_te": "'ఫాంట్' డైలాగ్ బాక్స్ కొరకు MS-వర్డ్ లో షార్ట్ కట్ కీ",
    "options_te": [
      "Ctr + B",
      "Ctr + A",
      "Ctr + D",
      "Ctr + C"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "These are the key elements of Information Communication Technology\na) Connectivity\nb) Accessibility\nc) Speed",
    "options": [
      "a, b only",
      "b, c only",
      "a, c only",
      "a, b, c"
    ],
    "correct": 4,
    "question_te": "సమాచార ప్రసార సాంకేతికత ప్రధాన అంశభూతాలు\na) అనుసంధానత\nb) అందుబాటు\nc) వేగం",
    "options_te": [
      "a, b only",
      "b, c only",
      "a, c only",
      "a, b, c"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Child Development & Pedagogy",
    "question": "In setting effective Online Learning Goals 'SMART' is used. 'R' in SMART means",
    "options": [
      "Realistic",
      "Response",
      "Reason",
      "Right"
    ],
    "correct": 1,
    "question_te": "సమర్థవంతమైన అభ్యసన గమ్యములను నియమించుటకు 'SMART'ను ఉపయోగిస్తారు. అయిన 'SMART'లో 'R' అనగా",
    "options_te": [
      "Realistic",
      "Response",
      "Reason",
      "Right"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది అపరిచిత పద్యం చదివి ప్రశ్నకు జవాబు గుర్తించండి\nకొందగుహలనున్న గోవెలలందున్న\nమెండుగాను బూది మెత్తియున్న\nదుష్ట బుద్దులకును దుర్బుద్ధి మానునా?\nవిశ్వదాభిరామ వినుర వేమా!\nవిభూది రాసుకున్నా ఇతని స్వభావం మారదు",
    "options": [
      "శిక్షకుడు",
      "రక్షకుడు",
      "శిష్టుడు",
      "దుష్టుడు"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది అపరిచిత పద్యం చదివి ప్రశ్నకు జవాబు గుర్తించండి\nకొందగుహలనున్న గోవెలలందున్న\nమెండుగాను బూది మెత్తియున్న\nదుష్ట బుద్దులకును దుర్బుద్ధి మానునా?\nవిశ్వదాభిరామ వినుర వేమా!\n\nపై పద్యంలో 'కోవెల' పదాన్ని కవి ఈ అర్థంలో వాడాడు",
    "options": [
      "బడి",
      "కొండ",
      "గుడి",
      "అడవి"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది అపరిచిత గద్యం చదివి అడిగిన ప్రశ్నకు సమాధానం గుర్తించండి\nవిశ్వనాథ, కృష్ణశాస్త్రి కవితా ముద్రల నుండి బయటపడి 1929 లో శ్రీశ్రీ సుప్రభాతికలు గీతం రాశారు. ఆధునిక భావాలతో ఛందోబంధాలను విడల్చుకొని అభ్యుదయ కవిత్వానికి అంకురార్పణ చేశారు. 1993 లో 'జయభేరి' కవిత నూతన కవితా మార్గాలను చూపింది. గురజాడ, కవికొండల గేయాలు మహా ప్రస్థానానికి దారిచూపాయి. ఆది శంకరుల 'భజగోవిదం' మరోప్రపంచం, గీత నడకకు తోడ్పడిందని శ్రీశ్రీ వెల్లడించారు. అభ్యుదయ రచయితలందరూ కలిసి 1943 లో 'అభ్యుదయ రచయితల సంఘం' ఏర్పాటుచేశారు. తొలిదశలో వీరు ఛందోకవిత్వంపై తిరుగుబాటు చేశారు. అభ్యుదయ కవిత్వం రెండు దశాబ్దాల పాటు తెలుగు సాహిత్యాన్ని సుసంపన్నం చేసింది. అయితే శ్రీశ్రీ బాల్యదశలో రాసిన 'ప్రభవ' భావ కవిత్వానికి చెందిన రచనయే.\n\nశ్రీ శ్రీ రచనలలో భావ కవిత్వానికి చెందిన రచన",
    "options": [
      "సుప్రభాతికలు",
      "మహా ప్రస్థానం",
      "ప్రభవ",
      "భజగోవిదం"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది వానిలో గద్యం ఆధారంగా అసత్య కథనం గుర్తించండి.\nవిశ్వనాథ, కృష్ణశాస్త్రి కవితా ముద్రల నుండి బయటపడి 1929 లో శ్రీశ్రీ సుప్రభాతికలు గీతం రాశారు. ఆధునిక భావాలతో ఛందోబంధాలను విడల్చుకొని అభ్యుదయ కవిత్వానికి అంకురార్పణ చేశారు. 1993 లో 'జయభేరి' కవిత నూతన కవితా మార్గాలను చూపింది. గురజాడ, కవికొండల గేయాలు మహా ప్రస్థానానికి దారిచూపాయి. ఆది శంకరుల 'భజగోవిదం' మరోప్రపంచం, గీత నడకకు తోడ్పడిందని శ్రీశ్రీ వెల్లడించారు. అభ్యుదయ రచయితలందరూ కలిసి 1943 లో 'అభ్యుదయ రచయితల సంఘం' ఏర్పాటుచేశారు. తొలిదశలో వీరు ఛందోకవిత్వంపై తిరుగుబాటు చేశారు. అభ్యుదయ కవిత్వం రెండు దశాబ్దాల పాటు తెలుగు సాహిత్యాన్ని సుసంపన్నం చేసింది. అయితే శ్రీశ్రీ బాల్యదశలో రాసిన 'ప్రభవ' భావ కవిత్వానికి చెందిన రచనయే.\n\nకింది వానిలో గద్యం ఆధారంగా అసత్య కథనం గుర్తించండి.",
    "options": [
      "అభ్యుదయ కవిత్వం ఇరవై సంవత్సరాల పాటు తెలుగు సుసంపన్న సాహిత్యాన్ని అందించింది.",
      "గురజాడ, కవికొండల గేయాలు మహా ప్రస్థానం లో ఉన్నాయి.",
      "జయభేరి కవిత నూతన కవితా మార్గాలను చూపింది.",
      "అభ్యుదయ కవులు అభ్యుదయ రచయితల సంఘం ఏర్పాటుచేశారు."
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "'మట్టి మనిషి' పీరి రచన",
    "options": [
      "మూలింటి చంద్రకళ",
      "వాసిరెడ్డి సీతాదేవి",
      "నేతల ప్రతాప్ కుమార్",
      "శీలా వీరరాజు"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"మారుతున్న సమాజం నా జ్ఞాపకాలు\" అనే ఆత్మకథ నుండి తీసుకోబడిన పార్శ్యాంశం",
    "options": [
      "నా యాత్ర",
      "పయనం",
      "నాటి చదువు",
      "చేజారిన బాల్యం"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "పార్శ్యాంశం – ప్రక్రియలలో సరైన జత",
    "options": [
      "తృప్తి – వ్యాసం",
      "ఎంత మంచి వారమ్మా..! – జీవిత చరిత్ర",
      "త్రిజట స్వప్నం – ఖండ కావ్యం",
      "సూక్తి సుధ – సాహిత్య వ్యాసం"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "'కవి సార్వభౌమ' బిరుదాంకితులు",
    "options": [
      "నన్నయ్య",
      "శ్రీనాథుడు",
      "తిక్కన",
      "ఎర్రన"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "పాత్రలు – పాఠ్యాంశాలలో సరైన జత",
    "options": [
      "ఆత్మానందుడు – మాయ కంబళి",
      "దేవదత్తుడు – ప్రత్యక్ష దైవాలు",
      "దుష్యంతుడు – రాజధర్మం",
      "యామునాచార్యుడు – ధర్మ బోధ"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "'సామాజిక బాధ్యత' ఇతివృత్తంగా గల పాఠ్యాంశం",
    "options": [
      "ఏదేశమేగిన",
      "ఇల్లలకగానే",
      "చైతన్యం",
      "మాట మహిమ"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "నైతిక విలువలను పెంపొందించి ఉత్తమ పౌరులుగా విద్యార్థులను తీర్చిదిద్దడమే ఉద్దేశ్యంగా గల పాఠ్యాంశం",
    "options": [
      "మమకారం",
      "మేలుకొలుపు",
      "సుభాషితాలు",
      "త్రిజట స్వప్నం"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "అరణ్యవాసంలో ఉన్న ధర్మరాజుతో మార్కండేయ మహర్షి తెలిపిన వృత్తాంతం వీరిది",
    "options": [
      "కాశికుడు",
      "దుష్యంతుడు",
      "చండీదత్తుడు",
      "ఆత్మానందుడు"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "'దేవీప్రియ'గా పేరుపొందిన వారు",
    "options": [
      "సింగమనేని నారాయణ",
      "షేక్ ఖాజా హుస్సేన్",
      "బులుసు వెంకట రమణయ్య",
      "కొండేపూడి లక్ష్మీ నారాయణ"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"నా అనుభవం నేర్పిన పాఠమే నా కవిత్వం\" అని తన కవితాగుణాన్ని ప్రకటించిన కవి",
    "options": [
      "తాపీ ధర్మారావు",
      "ఆశావాది ప్రకాశరావు",
      "జంధ్యాల పాపయ్య శాస్త్రి",
      "ఎండ్లూరి సుధాకర్"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"సుంత\", \"స్వాంతం\" అనే పదాలకు అర్థాలు వరుసగా",
    "options": [
      "హృదయం, అధికం",
      "కొంచెం, హృదయం",
      "హృదయం, ఎక్కువ",
      "కొంచెం, సంత"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "ఈ కింది వానిలో సరైన పర్యాయ పదాల జంటను గుర్తించండి",
    "options": [
      "దిక్కు – దిశ, ఉపాయం",
      "వర్షం – వాన, సంవత్సరం",
      "నామం – పేరు, బొట్టు",
      "నభం – ఆకాశం, గగనం"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "ఈ కింది వానిలో సరైన నానార్థాల జంటను గుర్తించండి",
    "options": [
      "కోరిక – వాంఛ, ఈప్సితం",
      "పురము – పట్టణము, వీడు",
      "సీమ – దేశము, పరిమితి",
      "నీరు – ఉదకము, తోయము"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"దీనిచే అలంకరింప బడుదురు\" అను వ్యుత్పత్తినిచ్చు పదం",
    "options": [
      "భృంగారం",
      "ముకురం",
      "అంబరం",
      "రజతం"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"విజ్ఞానము\", \"దృఢం\" అనే పదాలకు వికృతులు",
    "options": [
      "విజానము, ద్రడం",
      "విణ్ణనము, ద్రదం",
      "విజ్ఞానము, దృఢం",
      "విన్నాణము, దిటవు"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "జాతీయాల గురించి సరైనవి\na) ఏ భాషకు ఆ భాషలో విశిష్టత కలిగి ఉంటాయి\nb) విశిష్టమైన అర్థానిచ్చే పలుకుబడులను జాతీయాలు అంటారు\nc) జాతీయాలను వేరొక భాషలోనికి అనువదించలేము\nd) పోలికలు, సామీప్యములో చెప్పవచ్చు",
    "options": [
      "a, b మాత్రమే సరైనవి",
      "a, b, c సరైనవి",
      "c, d సరైనవి",
      "b, c, d సరైనవి"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది వానిలో సామెత కానిది",
    "options": [
      "ఆరుద్ర కురిస్తే దారిద్ర్యం ఉండదు",
      "ఆరంభశూరుడికి ఆర్భాటమెక్కువ",
      "అర వేలిలో అరవై కోట్లు",
      "ఆస్తేపనా అరకాలు తేమ"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"ఊరంతటికీ ఒక్కటే దుప్పటి\" ఈ పొడుపుకు విడుపు",
    "options": [
      "గోడుగు",
      "సూర్యుడు",
      "మేఘం",
      "ఆకాశం"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "'అహో ఆ చిత్రం ఎంత బాగుందో!' అనేది.",
    "options": [
      "సందేహార్థకం",
      "ఆశ్చర్యార్థకం",
      "అనుమత్యర్థకం",
      "వ్యతిరేకార్థకం"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"నీ కీర్తి పాలవలె తెల్లగా ఉంది\" ఇందులో ఉపమానం",
    "options": [
      "వలె",
      "నీకీర్తి",
      "పాలు",
      "తెల్లగా ఉంది"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "కింది వాటిని జతపరచండి\ni) యగణం    A) III\nii) నగణం    B) UUI\niii) తగణం    C) IUU",
    "options": [
      "i - C, ii - A, iii - B",
      "i - A, ii - C, iii - B",
      "i - B, ii - A, iii - C",
      "i - A, ii - B, iii - C"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"మాయిల్లు\" విడదీయండి",
    "options": [
      "మా + యిల్లు",
      "మా + ఇల్లు",
      "మీ + ఇల్లు",
      "మా + ఎల్లు"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "ఒ, ఓ, ఔ లు",
    "options": [
      "మూర్ధన్యాలు",
      "తాలవ్యాలు",
      "కంఠోష్ఠ్యాలు",
      "కంఠతాలవ్యాలు"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"పాము కాటు\" సమాసం పేరు",
    "options": [
      "చతుర్థీ తత్పురుష",
      "పంచమీ తత్పురుష",
      "ద్వితీయా తత్పురుష",
      "ప్రథమా తత్పురుష"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"మీరు మంచి మార్గాన్ని ఎంచుకోండి\" ఈ వాక్యం",
    "options": [
      "ఉత్తమపురుష బహువచనం",
      "మధ్యమపురుష బహువచనం",
      "ప్రథమపురుష బహువచనం",
      "ప్రథమపురుష ఏకవచనం"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Telugu",
    "question": "\"ధర్మవ్యాధుండు కౌశికునితో ఇట్లనియె\" ఈ వాక్యానికి సరిపోయే సరైన ఆధునిక వచనం",
    "options": [
      "ధర్మవ్యాధునితో కౌశికుడు ఇలా అన్నాడు",
      "ధర్మవ్యాధుడు, కౌశికుడు ఇలా అనుకున్నారు.",
      "ధర్మవ్యాధుడు కౌశికునితో ఇలా అన్నాడు.",
      "ధర్మవ్యాధుండు గౌశికునితో ఇట్లనియె."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "The touch of the fawn made Jody delirious.\nChoose the synonym for the underlined word in the sentence.",
    "options": [
      "lucid",
      "ecstatic",
      "depressed",
      "coherent"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Santosh's parents were affluent landowners who could afford to send their children to the best schools.\nChoose the antonym for the underlined word in the sentence",
    "options": [
      "wealthy",
      "prosperous",
      "impoverished",
      "well-off"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correctly punctuated and capitalized option.",
    "options": [
      "\"Whew\", exclaimed Pranjol.",
      "\"Whew\"!, Exclaimed Pranjol.",
      "Whew! exclaimed Pranjol.",
      "\"Whew!\" exclaimed Pranjol."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "The sky rocketing prices and ever – increasing cost of living have burnt a hole in the pocket of the common man in our country.\nChoose the option that best expresses the meaning of the underlined idiom in the sentence above:",
    "options": [
      "caused severe physical injury",
      "cost a lot of money or caused someone to spend money quickly",
      "resulted in the loss of important personal belongings",
      "created a feeling of anger and frustration towards the government"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "The shop is closing down, so it is selling everything at giveaway prices.\nChoose the correct meaning of the underlined phrasal verb.",
    "options": [
      "high",
      "moderate",
      "very low",
      "as usual"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correct meaning of the phrasal verb 'break up' in the given sentence.\nThe teacher had to break up the crowd of the students in the hallway.",
    "options": [
      "To explain a topic step-by-step.",
      "To suddenly stop speaking midsentence.",
      "To separate a group of people or stop fight.",
      "To escape from physical control."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the incorrect statement relating to discourses.",
    "options": [
      "Brevity is important while sending messages and e-mails.",
      "Dialogues should not be apt to the given context while writing a conversation.",
      "Details of venue, date and time are must in designing an invitation.",
      "Interactive language can be used to substitute the views during speech."
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the expression in which the adjectives are in their correct order to fits the blank.\nThe ________ players stood in a line.",
    "options": [
      "tall tennis Russian",
      "tennis tall Russian",
      "Russian tall tennis",
      "tall Russian tennis"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the term that refers to a person who tries to make something less good by criticising it.",
    "options": [
      "detractor",
      "admirer",
      "support",
      "complimenter"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Be careful! You'll drop the tray.\nIdentify the language function of the above sentence.",
    "options": [
      "warning",
      "requesting",
      "predicting",
      "apologizing"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correct option.\nJim is on holiday. He's ----- to Italy.",
    "options": [
      "go",
      "goes",
      "gone",
      "went"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Which Pair of the words given below are in the dictionary order?",
    "options": [
      "humour- humanity",
      "incest- inaudible",
      "landscape-language",
      "jargon-jaded"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correct spelling.",
    "options": [
      "conceil",
      "conceal",
      "conciel",
      "conceal"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "I don't want to take any medicine _____ a doctor examines me.\nChoose the right preposition that fits the blank.",
    "options": [
      "of",
      "by",
      "until",
      "still"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Read the sentence below and choose the option with correct article or no article.\nHe fell down ___ flight of stairs and broke ___ rib.",
    "options": [
      "a; an",
      "the; a",
      "a; a",
      "a; no article"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "He said, \"Do come in, John.\"\nChoose the correct indirect speech.",
    "options": [
      "He asked John to come in.",
      "He asked did you come in, John.",
      "He asked come in John.",
      "He questioned if John come in."
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correct Interrogative sentence.",
    "options": [
      "When you lost your bag?",
      "When do you lost your bag?",
      "When did you lose your bag?",
      "When you lose your bag?"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "_______ some what pompous, he was an entertaining companion.\nChoose the correct part of the speech that best fits in the blank.",
    "options": [
      "Still",
      "Otherwise",
      "Though",
      "Yet"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Identify the grammatically incorrect sentence.",
    "options": [
      "No marks has been awarded to essays copied from the book.",
      "Everyone has been informed about the dates of events.",
      "Hasn't Navya watched the movie yet?",
      "I have just had lunch."
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Identify the silent consonant letter from the word\n\"Muscle\"",
    "options": [
      "s",
      "c",
      "l",
      "m"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the correct question tag.\nThey used to play cricket, ________",
    "options": [
      "did they?",
      "don't they?",
      "didn't they?",
      "won't they?"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Identify the figure of speech in the following sentence.\n\"Words are like leaves\"",
    "options": [
      "Hyperbole",
      "Metaphor",
      "Simile",
      "Personification"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Open rebuke is better than secret love.\nChoose the Positive degree of the sentence.",
    "options": [
      "Secret love is so good as open rebuke.",
      "Secret love is the best.",
      "Open rebuke is not so good as secret love.",
      "Secret love is not as good as open rebuke."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Choose the simple sentence from the following.",
    "options": [
      "Tell me how old you are.",
      "We will win or die.",
      "If we do not win, we shall die.",
      "Tell me your age."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "All do not pay electricity bills.\nChoose the Passive Voice for the given sentence.",
    "options": [
      "All are not paid electricity bills.",
      "Electricity bills are not paid by all.",
      "Electricity bills do not paid by all.",
      "Electricity bills were not paid by all."
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "He has a good job, and _______ he never seems to have any money.\nChoose the appropriate option that fits in the blank.",
    "options": [
      "though",
      "besides",
      "yet",
      "consequently"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "They are not sure if they ____ the next match.\nChoose the appropriate option that fits the blank.",
    "options": [
      "winning",
      "wins",
      "won",
      "will win"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Read the following passage.\nFor hundreds of years man had dreamed of travelling in space. That dream came true in 1961; a Russian, Yuri Gagarian, was the first man to travel in space. In 1969 Neil Armstrong became the first man to set foot on the moon.\nChoose the correct statement according to the passage.",
    "options": [
      "The first man to travel in space was Neil Armstrong",
      "Yuri Gagarian travelled to space in 1969",
      "The dream of travelling in space came true in 1969.",
      "Neil Armstrong is the first man to set foot on the moon."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "English",
    "question": "Read the following stanza.\nTwo roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveller, long I stood\nAnd looked down one as far as In could\nTo where it bent in the undergrowth;\nNow answer the following question.\nThe colour of the wood described is",
    "options": [
      "green",
      "yellow",
      "brown",
      "red"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The diameter of a semicircle is 5 units. If a perpendicular is drawn on the diameter at a distance of 1.5 units from it centre to meet the arc of the semicircle, then the length of perpendicular is (in units)",
    "options": [
      "√3",
      "2",
      "4",
      "√5"
    ],
    "correct": 2,
    "question_te": "ఒక అర్ధవృత్తము యొక్క వ్యాసము 5 యూనిట్లు. దాని వ్యాసము పై కేంద్రము నుండి 1.5 యూనిట్ల దూరంలో ఒక లంబమును అర్ధవృత్త చాపమును తాకునట్లు గీచినచో ఆ లంబము పొడవు. (యూనిట్లలో)",
    "options_te": [
      "√3",
      "2",
      "4",
      "√5"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The greatest three digit number which is divisible by 12 and 15.",
    "options": [
      "900",
      "930",
      "960",
      "990"
    ],
    "correct": 3,
    "question_te": "12 మరియు 15 లచే భాగింపబడే అతిపెద్ద మూడంకెల సంఖ్య",
    "options_te": [
      "900",
      "930",
      "960",
      "990"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The maximum number of closed regions formed by four chords, each cutting other three in district points, in a circle is",
    "options": [
      "8",
      "12",
      "9",
      "11"
    ],
    "correct": 4,
    "question_te": "ఒక వృత్తములో నాలుగు జ్యాలు ప్రతి ఒక్కటి మిగిలిన మూడింటిని వేర్వేరు బిందువుల వద్ద ఖండించనో ఆ వృత్తములో ఏర్పడు సంవృత ప్రాంతముల గరిష్ట సంఖ్య",
    "options_te": [
      "8",
      "12",
      "9",
      "11"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "If all the angles of a Quadrilateral are in Arithmetic progression and the least angles is 60° then the greatest angle is",
    "options": [
      "100°",
      "120°",
      "140°",
      "150°"
    ],
    "correct": 2,
    "question_te": "ఒక చతుర్భుజంలోని కోణములు అంకశ్రేడిలో కలవు మరియు ఆ చతుర్భుజము యొక్క కనిష్టకోణం 60° అయితే గరిష్ట కోణం",
    "options_te": [
      "100°",
      "120°",
      "140°",
      "150°"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Present ages of Anu and Raj are in the ration 4 : 5. Eight years from now the ratio of their ages will be 5 : 6. Find Anu and Raj's present ages?",
    "options": [
      "28, 35",
      "36, 45",
      "32, 40",
      "24, 30"
    ],
    "correct": 3,
    "question_te": "అను మరియు రాజ్ ల ప్రస్తుత వయస్సులు 4 : 5 నిష్పత్తిలో ఉన్నాయి. 8 సంవత్సరాల తరువాత వారి వయస్సుల నిష్పత్తి 5 : 6 అయిన అను మరియు రాజ్ ల ప్రస్తుత వయస్సులు కనుగొనండి.",
    "options_te": [
      "28, 35",
      "36, 45",
      "32, 40",
      "24, 30"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Write a Quadratic equation roots are 3 less than each of the roots of roots of x^2 - 9x + 20 = 0 is",
    "options": [
      "x^2 + 3x + 2 = 0",
      "x^2 - 3x + 2 = 0",
      "x^2 - 15x + 56 = 0",
      "x^2 + 15x + 56 = 0"
    ],
    "correct": 2,
    "question_te": "x^2 - 9x + 20 = 0 యొక్క మూలాలకంటే 3 తక్కువగా ఉండే సంఖ్యలు మూలాలుగా గల వర్గ సమీకరణము",
    "options_te": [
      "x^2 + 3x + 2 = 0",
      "x^2 - 3x + 2 = 0",
      "x^2 - 15x + 56 = 0",
      "x^2 + 15x + 56 = 0"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "If sqrt(x/y) + sqrt(y/x) = 10/3, then find xy.",
    "options": [
      "39",
      "29",
      "19",
      "9"
    ],
    "correct": 4,
    "question_te": "sqrt(x/y) + sqrt(y/x) = 10/3 అయిన xy విలువ",
    "options_te": [
      "39",
      "29",
      "19",
      "9"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Two radii of a sector with radius 7 cm were joined to form a cone. If the angle of the sector is 120°, then the base area of the cone is (in cm^2) (π = 22/7)",
    "options": [
      "22 1/3",
      "17 1/9",
      "18 1/9",
      "23 1/3"
    ],
    "correct": 2,
    "question_te": "త్రిజ్యాంతరం వ్యాసార్థం 7 సెం.మీ. వ్యాసార్థములను రెండింటిని కలుపుట ద్వారా ఒక శంకువు ఏర్పడింది. త్రిజ్యాంతర కోణం 120° అయిన దానితో ఏర్పరించిన శంకువు భూ వైశాల్యం (చ.సెం.మీ.లలో) (π = 22/7)",
    "options_te": [
      "22 1/3",
      "17 1/9",
      "18 1/9",
      "23 1/3"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Side of a square increased 10% and later its diagonal is increased by 9 1/11 % and formed a square, then the area of new square is increased by to the first one is",
    "options": [
      "22",
      "88",
      "44",
      "36"
    ],
    "correct": 3,
    "question_te": "ఒక చతురస్ర భుజాన్ని 10% పెంచి తరువాత దాని కర్ణమును 9 1/11% పెంచి ఒక చతురస్రాన్ని ఏర్పరచిన నూతనంగా ఏర్పరిచిన చతురస్ర వైశాల్యం మొదటి చతురస్ర వైశాల్యం కన్నా పెరిగినది",
    "options_te": [
      "22",
      "88",
      "44",
      "36"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "a, b, c are three sides of a triangle whose perimeter is 24 cm. If b = c + 2, a = b + 2 then its area (in cm^2)",
    "options": [
      "24",
      "48",
      "36",
      "64"
    ],
    "correct": 1,
    "question_te": "a, b, c లు త్రిభుజ మూడు భుజములు. దాని పరిధి 24 సెం.మీ. మరియు b = c+2, a = b+2 అయిన దాని వైశాల్యం (చ. సెం.మీ.లలో)",
    "options_te": [
      "24",
      "48",
      "36",
      "64"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Two children were born in the year 2024. The probability that their birthday falls on the same day is",
    "options": [
      "1/365",
      "1/2024",
      "1/366",
      "1"
    ],
    "correct": 3,
    "question_te": "ఇద్దరు పిల్లలు 2024 వ సం॥ లో జన్మించారు. వారి పుట్టిన రోజు ఒకే రోజు రావడానికి గల సంభావ్యత",
    "options_te": [
      "1/365",
      "1/2024",
      "1/366",
      "1"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Orthocentre of the triangle formed by the line x + y = 2026 with the co-ordinate axes is",
    "options": [
      "(1013, 1013)",
      "(2026/3, 2026/3)",
      "(0, 0)",
      "(2026, 2026)"
    ],
    "correct": 3,
    "question_te": "x + y = 2026 రేఖ నిరూపక అక్షాలతో చేసే త్రిభుజ లంబకేంద్రం",
    "options_te": [
      "(1013, 1013)",
      "(2026/3, 2026/3)",
      "(0, 0)",
      "(2026, 2026)"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "If a chord of a circle of radius 5 cm makes an angle 60° at the centre then the length of chord is (in cm)",
    "options": [
      "5",
      "6",
      "8",
      "5√3"
    ],
    "correct": 1,
    "question_te": "5 సెం.మీ. వ్యాసార్థము గల వృత్తములో ఒక జ్యా కేంద్రం వద్ద 60° కోణం చేస్తుంది అయిన ఆ జ్యా పొడవు ఎంత (సెం.మీ.లలో)",
    "options_te": [
      "5",
      "6",
      "8",
      "5√3"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The ratio of incomes of A and B is 9 : 7 and the ratio of their expenditure is 4 : 3. If each of them manages to save Rs.2000 per month, the monthly income of B is",
    "options": [
      "Rs.14000",
      "Rs.16000",
      "Rs.21000",
      "Rs.28000"
    ],
    "correct": 1,
    "question_te": "A మరియు B ల ఆదాయాల నిష్పత్తి 9 : 7 మరియు వారి ఖర్చుల నిష్పత్తి 4 : 3. వారు ఒక్కొక్కరు నెలకు రూ.2000 పొదుపు చేస్తే B నెల ఆదాయం",
    "options_te": [
      "Rs.14000",
      "Rs.16000",
      "Rs.21000",
      "Rs.28000"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "Rakshitha has a total of Rs.590 as currency notes in the denominations of Rs.50, Rs.20 and Rs.10. The ratio of the number of Rs.50 notes and Rs.20 notes is 3 : 5. If she has a total of 25 notes, the number of Rs.10 notes she has?",
    "options": [
      "6",
      "9",
      "10",
      "12"
    ],
    "correct": 2,
    "question_te": "రక్షిత వద్ద రూ.590 విలువ గల సొమ్ము రూ.50, రూ.20 మరియు రూ.10 నోట్ల రూపంలో ఉంది. రూ.50 నోట్లకు రూ.20 నోట్లకు గల నిష్పత్తి 3 : 5. ఆమె వద్ద మొత్తం 25 నోట్లు ఉన్నచో, ఆమె వద్ద ఉన్న రూ.10 నోట్ల సంఖ్య?",
    "options_te": [
      "6",
      "9",
      "10",
      "12"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The method used by Aryabhata to solve the equations such as ax + by = c (where a, b, c are whole numbers) is",
    "options": [
      "Katapayadi",
      "Method of inversion",
      "Chakravala",
      "Palvarizor"
    ],
    "correct": 4,
    "question_te": "ax + by = c (a, b, c లు పూర్ణసంఖ్యలు) వంటి సాధారణ సమీకరణాలను ఆర్యభట్ట సాధించిన పద్ధతి పేరు",
    "options_te": [
      "కటపయాది",
      "విలోమ",
      "చక్రవాళ",
      "పల్వరైజర్ (కుట్టక)"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "\"The main goal of mathematics education in schools is the 'mathemataisation' of a child's thinking.\" This is from",
    "options": [
      "NPE 1986",
      "NEP 2020",
      "NCF 2005",
      "NCFSE 2023"
    ],
    "correct": 3,
    "question_te": "\"పిల్లవాని ఆలోచన యొక్క గణితీకరణే పాఠశాలల్లోని గణిత విద్య ప్రధాన గమ్యం.\" ఇది కింది వానిలో దేనినుండి",
    "options_te": [
      "NPE 1986",
      "NEP 2020",
      "NCF 2005",
      "NCFSE 2023"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "\"A teaching outline of the important points of a lesson arranged in the order in which they are to be presented; may include objectives, points to be made, questions to ask, references to materials, assignments, etc.\" Name the person who gave this definition to \"lesson plan\".",
    "options": [
      "Bloom",
      "Good.C.V.",
      "Bester Stands",
      "Herbert"
    ],
    "correct": 2,
    "question_te": "\"ఏ క్రమంలో అందజేయబడాలో ఆ విధంగా అమర్చబడ్డ ఒక పాఠంలోని ముఖ్యమైన అంశాలకు సంబంధించిన బోధన రూపురేఖ, లక్ష్యాలు, అడగవలసిన ప్రశ్నలు, పరామర్శ సామగ్రి, నియోజనాల వంటి వాటిని కలిగి ఉంటుంది.\" అని పాఠ్యపధకాన్ని నిర్వచించినది",
    "options_te": [
      "బ్లూమ్",
      "గుడ్.సి.వి.",
      "బెస్టర్ స్టాండ్స్",
      "హెర్బర్ట్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Mathematics",
    "question": "The reason to enhance the reliability of an objective type test is",
    "options": [
      "It needs lesser time to answer a question.",
      "There is no scope for subjectivity of the examiner.",
      "The student has to study all the content matter.",
      "It is easy to conduct such type of exams."
    ],
    "correct": 2,
    "question_te": "విషయ నిష్ఠ పరీక్ష విశ్వాసనీయత పెరుగుటకు కారణం",
    "options_te": [
      "ప్రశ్నకు జవాబు వ్రాయడానికి తక్కువ సమయంపడుతుంది.",
      "పరీక్షకుని ఆత్మశయతకు ఏ మాత్రం తావులేదు.",
      "విద్యార్థి పాఠ్యంశాలన్నింటిని చదవాలి.",
      "ఇలాంటి పరీక్షలు నిర్వహించుట తేలిక."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The side of a square is x cm and its area is x cm^2 then the value of x is",
    "options": [
      "0.1",
      "1",
      "10^2",
      "10^-2"
    ],
    "correct": 2,
    "question_te": "చతురస్రపు భుజం కొలత x సెం మీ మరియు దాని వైశాల్యం x సెం మీ^2 అయిన 'x' విలువ",
    "options_te": [
      "0.1",
      "1",
      "10^2",
      "10^-2"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The distance – time graph for the motion of an object moving with a constant speed is a",
    "options": [
      "Straight line parallel to time axis",
      "Straight line parallel to distance axis",
      "Straight line with positive slope",
      "Curved line"
    ],
    "correct": 3,
    "question_te": "స్థిరవడితో కదులుతున్న వస్తువు యొక్క చలనానికి దూరం – కాలం గ్రాఫ్",
    "options_te": [
      "కాలం అక్షానికి సమాంతరంగా వున్న ఒక సరళ రేఖ",
      "దూరం అక్షానికి సమాంతరంగా వున్న ఒక సరళ రేఖ",
      "ధనాత్మక వాలు కలిగిన ఒక సరళ రేఖ",
      "ఒక వక్ర రేఖ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "A heavy box is kept on the floor. The maximum frictional force between the box and the floor is 50N. If a boy pushes the box with 15N in the direction parallel to the floor, the magnitude of the frictional force that acts is",
    "options": [
      "50 N",
      "65N",
      "35N",
      "15N"
    ],
    "correct": 4,
    "question_te": "ఒక బరువైన పెట్టెను నేలపై ఉంచారు. పెట్టెకు, నేలకు మధ్య గల గరిష్ఠ ఘర్షణ బలం విలువ 50N. ఒక అబ్బాయి నేలకు సమాంతరంగా దానిని 15N బలంతో నెట్టినప్పుడు పని చేయు ఘర్షణ బలపరిమాణం.",
    "options_te": [
      "50 N",
      "65N",
      "35N",
      "15N"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "When an object is thrown upwards, the force of gravity is",
    "options": [
      "zero",
      "in the upward direction",
      "in the downward direction",
      "in the horizontal direction"
    ],
    "correct": 3,
    "question_te": "ఒక వస్తువును పైకి విసిరితే, దాని పై పని చేసే గురుత్వాకర్షణ బలం",
    "options_te": [
      "శూన్యం",
      "దిశ పైకి వుంటుంది",
      "దిశ కిందికి వుంటుంది",
      "దిశ సమాంతరంగా వుంటుంది"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "A sound wave has a frequency of 2KHz and wave length 50cm. The time taken by it to travel 3KM",
    "options": [
      "2 seconds",
      "3 seconds",
      "6 seconds",
      "30 seconds"
    ],
    "correct": 2,
    "question_te": "ఒక ధ్వని తరంగం 2 కి హెర్ట్జ్ తరచుదనాన్ని మరియు 50 సెం.మీ తరంగ దైర్ఘ్యాన్ని కలిగి ఉంది. అది 3 కి మీ దూరం ప్రయాణించుటకు పట్టు సమయం",
    "options_te": [
      "2 seconds",
      "3 seconds",
      "6 seconds",
      "30 seconds"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The internal energy of water, during the process of conversion from liquid to solid",
    "options": [
      "remains constant",
      "increases",
      "decreases",
      "becomes zero"
    ],
    "correct": 3,
    "question_te": "ద్రవస్థితి నుండి ఘన స్థితి లోకి మారేటప్పుడు, నీటి అంతర్గత శక్తి",
    "options_te": [
      "స్థిరంగా ఉంటుంది",
      "పెరుగుతుంది",
      "తగ్గుతుంది",
      "శూన్యం అవుతుంది"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The refractive index of an equilateral prism is sqrt(2), then the angle of minimum deviation produced is",
    "options": [
      "30°",
      "45°",
      "60°",
      "90°"
    ],
    "correct": 1,
    "question_te": "ఒక సమబాహు పట్టక వక్రీభవన గుణకం sqrt(2) అయిన, అది ఏర్పరచే కనిష్ఠ విచలన కోణం",
    "options_te": [
      "30°",
      "45°",
      "60°",
      "90°"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "To consume 16KWH of electrical energy in 20days, an electrical heater rated 400W takes an average time of",
    "options": [
      "1 hour / day",
      "1.5 hours / day",
      "2 hours / day",
      "4 hours / day"
    ],
    "correct": 3,
    "question_te": "16 KWH విద్యుత్ శక్తిని 20 రోజులలో వినియోగించడానికి, 400W రేటింగ్ గల విద్యుత్ హీటర్ సరాసరిగా తీసుకొను సమయం",
    "options_te": [
      "1 గంట / రోజు",
      "1.5 గంటలు / రోజు",
      "2 గంటలు / రోజు",
      "4 గంటలు / రోజు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "Choose the correct answer.\nAssertion (A) : In liquid state, particles move freely when compared with the particles in the solid state.\nReason (R) : In solid state, particles have greater space between them.",
    "options": [
      "Both A, R are correct, R is correct explanation of A",
      "Both A, R are correct, R is not correct explanation of A",
      "A is correct, R is incorrect",
      "A is incorrect, R is correct"
    ],
    "correct": 3,
    "question_te": "సరైన సమాధానమును ఎంచుకోండి\nప్రవచనం (A) : ఘనస్థితిలో ఉన్న కణాలతో పోలిస్తే ద్రవ స్థితిలో కణాలు స్వేచ్ఛగా కదులుతాయి.\nకారణం (R) : ఘనస్థితిలో కణాలు వాటి మధ్య ఎక్కువ ఖాళీని కలిగి ఉంటాయి.",
    "options_te": [
      "A, R రెండూ సరైనవి, R అనేది A కు సరైన వివరణ",
      "A, R రెండూ సరైనవి, R అనేది A కు సరైన వివరణ కాదు",
      "A సరైనది, R సరైనది కాదు",
      "A సరైనది కాదు, R సరైనది"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The incorrect statement related to Froth floatation process\n1. Used for removing gangue from sulphide ores.\n2. Compressed air is blown to produce froth in water\n3. Pine oil is used in this process to get more foam.\n4. Froth bubbles carry gangue can particles to the surface.",
    "options": [
      "Used for removing gangue from sulphide ores.",
      "Compressed air is blown to produce froth in water",
      "Pine oil is used in this process to get more foam.",
      "Froth bubbles carry gangue can particles to the surface."
    ],
    "correct": 4,
    "question_te": "ఫ్లవన ప్రక్రియ కి సంబధించి తప్పుగా ఉన్న వాక్యం\n1. సల్ఫైడ్ ఖనిజాల నుండి ఖనిజ మాలిన్యం తొలగించుటకు వాడుతారు.\n2. సంపీడనం చెందించబడిన గాలిని పంపి నీటిలో నురుగ వచ్చేట్టు చేస్తారు\n3. ఎక్కువ నురుగను పొందుటకు ఈ ప్రక్రియలో పైన్ ఆయిల్ ను వాడతారు\n4. గ్యాంగ్ కణాలను నురుగ ఉపరితలానికి తీసుకుపస్తుంది .",
    "options_te": [
      "సల్ఫైడ్ ఖనిజాల నుండి ఖనిజ మాలిన్యం తొలగించుటకు వాడుతారు.",
      "సంపీడనం చెందించబడిన గాలిని పంపి నీటిలో నురుగ వచ్చేట్టు చేస్తారు",
      "ఎక్కువ నురుగను పొందుటకు ఈ ప్రక్రియలో పైన్ ఆయిల్ ను వాడతారు",
      "గ్యాంగ్ కణాలను నురుగ ఉపరితలానికి తీసుకుపస్తుంది ."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "If current is passing through a horizontal power line from east to west, then the direction of magnetic field when viewed from west below the wire",
    "options": [
      "In clockwise direction in a plane perpendicular to the wire",
      "In anti-clockwise direction in a plane perpendicular to the wire",
      "In clockwise direction in a plane parallel to the wire",
      "In anti-clockwise direction in a plane parallel to the wire"
    ],
    "correct": 2,
    "question_te": "క్షితిజ సమాంతర విధ్యుత్ తీగలో విధ్యుత్ ప్రవాహం తూర్పు నుండి పడమరకు ప్రవహించేటప్పుడు, ఆ తీగకింద ఒక బిందువు వద్ద పడమర నుండి చూసినప్పుడు అయస్కాంత క్షేత్ర దిశ",
    "options_te": [
      "తీగకు లంబంగా ఉన్న తలంలో సవ్య దిశలో",
      "తీగకు లంబంగా ఉన్న తలంలో అపసవ్య దిశలో",
      "తీగకు సమాంతరంగా ఉన్న తలంలో సవ్య దిశలో",
      "తీగకు సమాంతరంగా ఉన్న తలంలో అపసవ్య దిశలో"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "Choose the correct answer\nAssertion (A) : Ships suffer a lot of damage from rusting in spite of being painted.\nReason (R) : The sea water contains many salts and this makes the process of rust formation faster.",
    "options": [
      "A is Correct, R is incorrect",
      "A is incorrect, R is Correct",
      "Both A and R are correct, R is correct explanation of A",
      "Both A and R are correct, R is not correct explanation of A."
    ],
    "correct": 3,
    "question_te": "సరైన సమాధానమును ఎంచుకోండి\nప్రవచనం (A) : రంగువేసి ఉన్నప్పటికీ తుప్పు పట్టడం వల్ల ఓడలకు చాలా నష్టము జరుగుతుంది.\nకారణం (R) : సముద్రపు నీరు ఎక్కువ లవణాలను కలిగి ఉన్నందున తుప్పు పట్టే ప్రక్రియను వేగవంతం చేస్తుంది.",
    "options_te": [
      "A సరైనది, R సరైనది కాదు",
      "A సరైనది కాదు, R సరైనది",
      "A మరియు R రెండూ సరైనవి, R అనేది A కు సరైన వివరణ",
      "A మరియు R రెండూ సరైనవి, R అనేది A కు సరైన వివరణ కాదు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "This element has 6 electrons in its L-shell.",
    "options": [
      "Chlorine",
      "Hydrogen",
      "Nitrogen",
      "Oxygen"
    ],
    "correct": 4,
    "question_te": "ఈ మూలకం తన L-కర్పరంలో 6 ఎలక్ట్రాన్లను కలిగి ఉంటుంది",
    "options_te": [
      "క్లోరిన్",
      "హైడ్రోజన్",
      "నైట్రోజన్",
      "ఆక్సిజన్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The products formed by the reaction of aluminium with sulphuric acid",
    "options": [
      "Aluminium Sulphate, Oxygen",
      "Aluminium Oxide, Hydrogen",
      "Aluminium Oxide, Water",
      "Aluminium Sulphate, Hydrogen"
    ],
    "correct": 4,
    "question_te": "ఒక రసాయన చర్య లో అల్యూమినియం, సల్ఫ్యూరిక్ ఆమ్లంలో చర్య పొందినది. ఈ చర్యలో ఏర్పడే క్రియాజన్యాలు",
    "options_te": [
      "అల్యూమినియం సల్ఫేట్, ఆక్సిజన్",
      "అల్యూమినియం ఆక్సైడ్, హైడ్రోజన్",
      "అల్యూమినియం ఆక్సైడ్, నీరు",
      "అల్యూమినియం సల్ఫేట్, హైడ్రోజన్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "Naphthalene balls are obtained from",
    "options": [
      "Coke",
      "Coaltar",
      "Coal gas",
      "Petrol"
    ],
    "correct": 2,
    "question_te": "నాఫ్తలీన్ ఉండలు దీనినుండి పొందవచ్చు",
    "options_te": [
      "కోక్",
      "కోల్ తారు",
      "కోల్ వాయువు",
      "పెట్రోల్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "When 4500g of a fuel completely burn produces 180000KJ of heat energy. Then the Calorific value of the fuel is",
    "options": [
      "4 x 10^2 KJ/Kg",
      "4 x 10^3 KJ/Kg",
      "4 x 10^4 KJ/Kg",
      "4 x 10^5 KJ/Kg"
    ],
    "correct": 3,
    "question_te": "4500 గ్రా ల ఇంధనం పూర్తిగా మండి 1,80,000 KJ ల ఉష్టశక్తి ఉత్పత్తి చేస్తుంది. అయిన ఆ ఇంధన కాల్యరిఫిక్ విలువ",
    "options_te": [
      "4 x 10^2 KJ/Kg",
      "4 x 10^3 KJ/Kg",
      "4 x 10^4 KJ/Kg",
      "4 x 10^5 KJ/Kg"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "Proposing of no relation between two items is",
    "options": [
      "Question hypothesis",
      "Prediction hypothesis",
      "Null hypothesis",
      "Declarative hypothesis"
    ],
    "correct": 3,
    "question_te": "రెండు విషయాల మధ్య ఎలాంటి సంబంధం లేదని ప్రతిపాదించడం ఒక",
    "options_te": [
      "ప్రశ్న ప్రాకల్పన",
      "ప్రాగుక్తిక ప్రాకల్పన",
      "శూన్య ప్రాకల్పన",
      "ప్రకటనాత్మక ప్రాకల్పన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "A student explained Boyles law with support of a graph. Here the objective achieved is",
    "options": [
      "Knowledge",
      "Skill",
      "Understanding",
      "Evaluation"
    ],
    "correct": 3,
    "question_te": "ఒక విద్యార్థి గ్రాఫ్ ఆధారంగా బాయిల్ నియమాన్ని వివరించాడు. ఇక్కడ విద్యార్థి సాధించిన లక్ష్యము",
    "options_te": [
      "జ్ఞానం",
      "నైపుణ్యం",
      "అవగాహన",
      "మూల్యాంకనం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "Who proposed steps for scientific method.",
    "options": [
      "Fansis Bacon",
      "Carl. Pearson",
      "Wedtz man",
      "Herbart"
    ],
    "correct": 2,
    "question_te": "వైజ్ఞానిక పద్ధతికి సోపానాలను ఏర్పరచినది.",
    "options_te": [
      "ఫ్రాన్సిస్ బేకన్",
      "కార్ల్. పియర్సన్",
      "వెడ్జిమన్",
      "హెర్బార్ట్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Physical Science",
    "question": "The incorrect one regarding evaluation",
    "options": [
      "Qualitative",
      "Broad scope",
      "Interview is an evaluation tool",
      "Gives exact values"
    ],
    "correct": 4,
    "question_te": "మూల్యాంకనం గురించి సరికానిది",
    "options_te": [
      "గుణాత్మకమైనది",
      "విస్తృతపరిధి కలిగినది",
      "పరిపృచ్ఛ ఒక మూల్యాంకన సాధనం",
      "ఖచ్చితమైన విలువలనిస్తుంది"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Pelvic bones are seen in this part of the body",
    "options": [
      "Neck",
      "Shoulder",
      "Ribcage",
      "Below waist"
    ],
    "correct": 4,
    "question_te": "కటివలయ ఎముకలు మన శరీరంలోకనిపించే భాగం",
    "options_te": [
      "మెడ",
      "భుజం",
      "ఉరఃపంజరం",
      "నడుము క్రింద"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The incorrect statement about deer in grassland\n(1) They have eyes in the front of face.\n(2) They have strong teeth to chew hard stems.\n(3) They have long ears to hear movements of predators.\n(4) They run faster to get away from predators.",
    "options": [
      "They have eyes in the front of face.",
      "They have strong teeth to chew hard stems.",
      "They have long ears to hear movements of predators.",
      "They run faster to get away from predators."
    ],
    "correct": 1,
    "question_te": "గడ్డిభూమి ఆవాసంలో ఉండే జింకకు చెందిన సరికాని వాక్యం గుర్తించండి.\n(1) అవి ముఖానికి ముందువైపు కళ్లను కలిగి ఉంటాయి.\n(2) అవి దృఢమైన కాండాలను నములుటకు బలమైన దంతాలను కలిగి ఉంటాయి.\n(3) అవి భక్షకాల కదలికలను విసడానికి పొడవైన చెవులు కలిగి ఉంటాయి.\n(4) భక్షకాల నుండి పారిపోవుటకు వేగంగా పరుగెత్తుతాయి.",
    "options_te": [
      "అవి ముఖానికి ముందువైపు కళ్లను కలిగి ఉంటాయి.",
      "అవి దృఢమైన కాండాలను నములుటకు బలమైన దంతాలను కలిగి ఉంటాయి.",
      "అవి భక్షకాల కదలికలను విసడానికి పొడవైన చెవులు కలిగి ఉంటాయి.",
      "భక్షకాల నుండి పారిపోవుటకు వేగంగా పరుగెత్తుతాయి."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Correct sequence of the five steps involved in the human digestion process",
    "options": [
      "Ingestion, absorption, digestion, assimilation, egestion",
      "Ingestion, digestion, absorption, assimilation, egestion",
      "Ingestion, digestion, assimilation, absorption, egestion",
      "Ingestion, assimilation, digestion, absorption, egestion"
    ],
    "correct": 2,
    "question_te": "మానవ జీర్ణక్రియలో ఉన్న ఐదు దశల సరైన వరుస క్రమం",
    "options_te": [
      "అంతర్గ్రహణం, శోషణ, జీర్ణక్రియ, స్వాంగీకరణ, విసర్జన",
      "అంతర్గ్రహణం, జీర్ణక్రియ, శోషణ, స్వాంగీకరణ, విసర్జన",
      "అంతర్గ్రహణం, జీర్ణక్రియ, స్వాంగీకరణ, శోషణ, విసర్జన",
      "అంతర్గ్రహణం, స్వాంగీకరణ, జీర్ణక్రియ, శోషణ, విసర్జన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Reasons for increasing pressure on the forests\na) Industrial development\nb) Fuel for vehicles\nc) Construction of roads\nd) Agricultural needs",
    "options": [
      "a, c & d",
      "a, b & d",
      "a, b & c",
      "b, c & d"
    ],
    "correct": 1,
    "question_te": "అడవులపై ఒత్తిడి పెరగడానికి కారణం\na) పారిశ్రామిక వృద్ధి\nb) వాహనాలకు ఇందన అవసరాలు\nc) రోడ్డ నిర్మాణం\nd) వ్యవసాయ సంబంధిత అవసరాలు",
    "options_te": [
      "a, c & d",
      "a, b & d",
      "a, b & c",
      "b, c & d"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The organism that does not show metamorphosis",
    "options": [
      "Frog",
      "Hen",
      "Moth",
      "Silkworm"
    ],
    "correct": 2,
    "question_te": "రూపవిక్రియను చూపని జీవి",
    "options_te": [
      "కప్ప",
      "కోడి",
      "మౌత్",
      "పట్టుపురుగు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The correct statement related to advantages of manures",
    "options": [
      "Inhibits water holding capacity",
      "Binds soil particles tightly for exchange of gases",
      "Decrease the number of friendly microbes",
      "Improves soil texture"
    ],
    "correct": 4,
    "question_te": "సేంద్రియ ఎరువుల ప్రయోజనాలకు చెందిన సరైయిన వాక్యం",
    "options_te": [
      "నేల యొక్క నీటి నిల్వ సామర్థ్యాన్ని తగ్గిస్తాయి.",
      "వాయువినిమయానికి వీలుగా మట్టిరేణువులను దగ్గరగా అమరేలా చేస్తాయి.",
      "స్నేహపూర్వక సూక్ష్మజీవుల సంఖ్యను తగ్గిస్తాయి.",
      "నేల ఆకృతిని మెరుగుపరుస్తాయి."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The sequence of parts involved in the reflex action\n(1) Receptor → Motor neuron → Relay neuron → Sensory neuron → Effector\n(2) Receptor → Sensory neuron → Relay neuron → Motor neuron → Effector.\n(3) Effector → Sensory neuron → Relay neuron → Motor neuron → Receptor\n(4) Effector → Sensory neuron → Relay neuron → Motor neuron → Effector",
    "options": [
      "Receptor → Motor neuron → Relay neuron → Sensory neuron → Effector",
      "Receptor → Sensory neuron → Relay neuron → Motor neuron → Effector.",
      "Effector → Sensory neuron → Relay neuron → Motor neuron → Receptor",
      "Effector → Sensory neuron → Relay neuron → Motor neuron → Effector"
    ],
    "correct": 2,
    "question_te": "ప్రతికార చర్యలో పాల్గొనే భాగాల క్రమం\n(1) గ్రాహకం → చాలక నాడీ → ప్రసారనాడీ → జ్ఞానానాడీ → ప్రభావక అంగం\n(2) గ్రాహకం → జ్ఞానానాడీ → ప్రసారనాడీ → చాలక నాడీ → ప్రభావక అంగం.\n(3) ప్రభావక అంగం → జ్ఞానానాడీ → ప్రసారనాడీ → చాలక నాడీ → గ్రాహకం\n(4) ప్రభావక అంగం → చాలక నాడీ → ప్రసారనాడీ → జ్ఞానానాడీ → ప్రభావక అంగం",
    "options_te": [
      "గ్రాహకం → చాలక నాడీ → ప్రసారనాడీ → జ్ఞానానాడీ → ప్రభావక అంగం",
      "గ్రాహకం → జ్ఞానానాడీ → ప్రసారనాడీ → చాలక నాడీ → ప్రభావక అంగం.",
      "ప్రభావక అంగం → జ్ఞానానాడీ → ప్రసారనాడీ → చాలక నాడీ → గ్రాహకం",
      "ప్రభావక అంగం → చాలక నాడీ → ప్రసారనాడీ → జ్ఞానానాడీ → ప్రభావక అంగం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "A basic event in reproduction",
    "options": [
      "Creation of an organism.",
      "Creation of a DNA copy.",
      "Creation of cellular apparatus.",
      "Creation of a similar cell."
    ],
    "correct": 2,
    "question_te": "ప్రత్యుత్పత్తిలోని ప్రాధమిక సంఘటన",
    "options_te": [
      "జీవిని ఏర్పరచడం.",
      "DNA నకలును ఏర్పరచడం.",
      "కణ నిర్మాణాన్ని ఏర్పరచడం.",
      "ఒకే పోలికలోని కణమును ఏర్పరచడం."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Examples for Biomagnification\na) Blooming of algae in agricultural canals when fertilizers are applied\nb) Increase in concentration of DDT in fish eating birds\nc) Traces of pesticides in vegetables\nd) Traces of mercury in Tuna fish meat",
    "options": [
      "a, b, c & d",
      "b, c & d only",
      "c & d only",
      "b & d only"
    ],
    "correct": 4,
    "question_te": "జైవికవృద్దీకరణకు ఉదాహరణలు\na) ఎరువులను చల్లగా వ్యవసాయ కాలువలలో ఆల్గే వర్ధిల్లడం\nb) చేపలను తినే పక్షులలో DDT సాంద్రత పెరగడం\nc) కూరగాయలలో పురుగుమందుల అవశేషాలు\nd) ట్యూనా చేప మాంసంలో మెర్క్యూరీ అవశేషాల.",
    "options_te": [
      "a, b, c & d",
      "b, c & d only",
      "c & d only",
      "b & d only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The cell organelles having their own DNA and ribosomes",
    "options": [
      "Mitochondria and Vacuoles",
      "Plastids and Lysosomes",
      "Mitochondria and Plastids",
      "Plastids and SER"
    ],
    "correct": 3,
    "question_te": "సొంత DNA మరియు రైబోజోమ్ లు కలిగి ఉన్న కణాంగాలు",
    "options_te": [
      "మైటోకాండ్రియా మరియు రిక్తికలు",
      "ప్లాస్టిడ్ లు మరియు లైసోజోములు",
      "మైటోకాండ్రియా మరియు ప్లాస్టిడ్ లు",
      "ప్లాస్టిడ్ లు మరియు SER"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Match the following.\nA                              B\ni) Squamous epithelium        a) Intestine\nii) Stratified epithelium     b) Ducts of Salivary glands\niii) Columnar epithelium      c) Skin\niv) Cuboidal epithelium       d) Stomach\nv) Glandular epithelium       e) Oesophagus",
    "options": [
      "i-e  ii-c  iii-d  iv-a  v-b",
      "i-e  ii-a  iii-c  iv-d  v-b",
      "i-e  ii-c  iii-b  iv-d  v-a",
      "i-e  ii-c  iii-a  iv-b  v-d"
    ],
    "correct": 4,
    "question_te": "కింది వాని జతపరచుము\nA                                    B\ni) శల్క ఉపకళాకణజాలం              a) ప్రేగు\nii) స్తరిత ఉపకళాకణజాలాలు         b) లాలాజల గ్రంథుల నాళాలు\niii) స్తంభాకార ఉపకళాకణజాలం       c) చర్మము\niv) ఘనాకార ఉపకళాకణజాలాలు        d) జీర్ణాశయం\nv) గ్రంధి ఉపకళాకణజాలాలు          e) అన్నవాహిక",
    "options_te": [
      "i-e  ii-c  iii-d  iv-a  v-b",
      "i-e  ii-a  iii-c  iv-d  v-b",
      "i-e  ii-c  iii-b  iv-d  v-a",
      "i-e  ii-c  iii-a  iv-b  v-d"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "These do not come under consumers of an Ecosystem\na) Mushrooms\nb) Grass\nc) Rabbit\nd) Humans",
    "options": [
      "a & b only",
      "b only",
      "a, c & d only",
      "a, b & c only"
    ],
    "correct": 1,
    "question_te": "అవరణ వ్యవస్థలో వినియోగదారుల కిందికి రానిది /వి\na) పుట్టగొడుగులు\nb) గడ్డి\nc) కుందేలు\nd) మానవులు",
    "options_te": [
      "a & b only",
      "b only",
      "a, c & d only",
      "a, b & c only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The plant that produce flowers once every 12 years is",
    "options": [
      "Agave americana",
      "Hibiscus rosa-sinensis",
      "Helianthus annus",
      "Strobilanthus kunthiana"
    ],
    "correct": 4,
    "question_te": "12 సంవత్సరాలకు ఒకసారి పుష్పించే మొక్క",
    "options_te": [
      "అగేవ్ అమెరికానా",
      "హైబిస్కస్ రోసాసైనాన్సిస్",
      "హీలియాంధస్ అన్యువస్",
      "స్ట్రోబిలాంధస్ కుంతియానా"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Match the following\na) Nitrites are oxidized to nitrates    i) Pseduomonas\nb) Denitrification                      ii) Nitrosomonas\nc) Ammonia is oxidized to nitrites      iii) Nitrobacter",
    "options": [
      "a-i, b-iii, c-ii",
      "a-iii, b-i, c-ii",
      "a-ii, b-iii, c-i",
      "a-iii, b-ii, c-i"
    ],
    "correct": 2,
    "question_te": "జతపరచండి\na) నైట్రైట్ లు, నైట్రేట్ లుగా ఆక్సీకరణం చెందుతాయి    i) సూడోమోనాస్\nb) వినైట్రీకరణం                                      ii) నైట్రోసోమోనాస్\nc) అమ్మోనియా, నైట్రైట్ లుగా ఆక్సీకరణం చెందుతుంది       iii) నైట్రోబాక్టర్",
    "options_te": [
      "a-i, b-iii, c-ii",
      "a-iii, b-i, c-ii",
      "a-ii, b-iii, c-i",
      "a-iii, b-ii, c-i"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The phenotypic ratio and genotypic ratio respectively in the F2 generation in Mendel monohybrid cross",
    "options": [
      "3:1 and 1:2:1",
      "1:2:1 and 3:1",
      "4:0 and 9:3:3:1",
      "9:3:3:1 and 3:1"
    ],
    "correct": 1,
    "question_te": "మెండల్ ఏకసంకరణంలో F2 తరం యొక్క దృశ్యరూప మరియు జన్యురూప నిష్పత్తులు వరుసగా",
    "options_te": [
      "3:1 మరియు 1:2:1",
      "1:2:1 మరియు 3:1",
      "4:0 మరియు 9:3:3:1",
      "9:3:3:1 మరియు 3:1"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "The incorrect statement about 'Colostrum'.\n(a) The milk produced during the initial few days of lactation.\n(b) It contains antibodies, especially Ig-A.\n(c) It is produced throughout the life after lactation.\n(d) It is essential to protect the new born babies from infections.",
    "options": [
      "a and b",
      "b only",
      "c only",
      "c and d"
    ],
    "correct": 3,
    "question_te": "'కొలొస్ట్రమ్' కి సంబంధించి అసత్య ప్రవచనం\n(a) పాలు ఉత్పత్తి అయ్యే తొలి రోజుల్లోని చనుపాలు.\n(b) ఇది ప్రతిరక్షకాలు ముఖ్యంగా Ig-A ను కలిగి ఉంటుంది.\n(c) చనుపాల ఉత్పత్తి ప్రారంభమైన నాటి నుంచి జీవితాంతం విడుదలగును.\n(d) నవజాత శిశువులను రకరకాల సంక్రమణల నుంచి రక్షించడంలో అత్యంత అవసరమైనది.",
    "options_te": [
      "a and b",
      "b only",
      "c only",
      "c and d"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Discovery of DNA by Watson and Crick was on the basis of Mendel theory. This indicates which nature of science.",
    "options": [
      "Explorative nature",
      "Cumulative nature",
      "Dynamic nature",
      "Curious nature"
    ],
    "correct": 2,
    "question_te": "మెండల్ సిద్ధాంతాల ఆధారంగా వాట్సన్ – క్రిక్ లు DNA నిర్మాణాన్ని ఆవిష్కరించడం అనునది విజ్ఞాన శాస్త్రం యొక్క ఈ స్వభావాన్ని తెలియజేస్తుంది.",
    "options_te": [
      "అన్వేషణాత్మక స్వభావం",
      "సంచిత స్వభావం",
      "మార్చుకు లోనయ్యే స్వభావం",
      "కుతూహలం కలిగించే స్వభావం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "What way the Revised Blooms Educational Objectives classification in different, when compared with Blooms Educational Objectives Classification\n(a) Terminology\n(b) Structure\n(c) Emphasis",
    "options": [
      "a only",
      "a and b only",
      "a and c only",
      "a, b and c"
    ],
    "correct": 4,
    "question_te": "బ్లూమ్ విద్యా లక్ష్యాల వర్గీకరణతో పోల్చితే, సవరించిన బ్లూమ్స్ విద్యా లక్ష్యాల వర్గీకరణ ఏ విధంగా భిన్నంగా ఉంటుంది\n(a) పరిభాష\n(b) నిర్మాణం\n(c) ఉద్ఘాటన",
    "options_te": [
      "a only",
      "a and b only",
      "a and c only",
      "a, b and c"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "\"Creating generalizations from specific items is called inductive method\" defined by",
    "options": [
      "Welton",
      "Fouler",
      "Becon",
      "Drever"
    ],
    "correct": 2,
    "question_te": "\"నిర్దిష్ట అంశాల నుండి సాధారణీకరణలను రూపొందించడమే ఆగమన పద్ధతి\" అని నిర్వచించినది.",
    "options_te": [
      "వెల్టన్",
      "ఫౌలర్",
      "బేకన్",
      "డ్రైపర్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 13th August 2026 Shift 1",
    "subject": "Biology",
    "question": "Choose correct option regarding measurement and evaluation\na) Measurement is qualitative\nb) Evaluation is quantitative\nc) Evaluation should be comprehensive and done continuously",
    "options": [
      "a, b - correct, c - incorrect",
      "a, c - correct, b - incorrect",
      "b - correct, a, c - incorrect",
      "a, b - incorrect, c - correct"
    ],
    "correct": 4,
    "question_te": "మాపనం, మూల్యాంకనానికి సంబంధించి సరైన ఐచ్చికం గుర్తించండి.\na) మాపనం గుణాత్మకమైనది\nb) మూల్యాంకనం పరిమాణాత్మకమైనది\nc) మూల్యాంకనం సమగ్రమైనదిగా నిరంతరం జరిపెడ్డిగా ఉడాలి.",
    "options_te": [
      "a, b - correct, c - incorrect",
      "a, c - correct, b - incorrect",
      "b - correct, a, c - incorrect",
      "a, b - incorrect, c - correct"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "According to Skinner, this does NOT come under the scope of Educational Psychology.",
    "options": [
      "Learner",
      "Teaching Learning Material",
      "Learning Experiences",
      "Teacher"
    ],
    "correct": 2,
    "question_te": "స్కిన్నర్ ప్రకారం, మనోవిజ్ఞానశాస్త్ర పరిధి లోనికి రాని అంశం",
    "options_te": [
      "అభ్యాసకుడు",
      "బోధనోపకరణాలు",
      "అభ్యాసన అనుభవాలు",
      "ఉపాధ్యాయుడు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "'Development is from womb to tomb.' The principle of development here is",
    "options": [
      "Different aspects of development are interrelated.",
      "Development is cumulative.",
      "Development is an individualized process.",
      "Development is a continuous process."
    ],
    "correct": 4,
    "question_te": "వికాసం గర్భస్థ శిశువు నుంచి మొదలై చనిపోయే వరకు కొనసాగుతుంది. ఇది ఈ వికాస నియమాన్ని సమర్థిస్తుంది.",
    "options_te": [
      "వివిధ వికాసాలు పరస్పర సంబంధం కలిగి ఉంటాయి.",
      "వికాసం సంచితమైనది.",
      "వికాసంలో వైయుక్తిక భేదాలుంటాయి.",
      "వికాసం అవిచ్ఛిన్నంగా సాగుతుంది."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "\"Self-Consciousness\" develops more in this stage",
    "options": [
      "Infancy",
      "Early Childhood",
      "Adolescence",
      "Adulthood"
    ],
    "correct": 3,
    "question_te": "\"స్వీయ చేతనత్వం\" ఎక్కువగా అభివృద్ధి చెందే దశ",
    "options_te": [
      "శైశవం",
      "పూర్వ బాల్య దశ",
      "కౌమారం",
      "వయోజన దశ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Meaning of the word \"Cognition\" is",
    "options": [
      "Knowledge",
      "Understand",
      "Reasoning",
      "Thinking"
    ],
    "correct": 1,
    "question_te": "\"Cognition\" అనే పదానికి అర్థం",
    "options_te": [
      "జ్ఞానం",
      "అవగాహన",
      "వివేచన",
      "ఆలోచన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "In this stage, student behaves according to self direction.",
    "options": [
      "Pre-Conventional",
      "Conventional",
      "Post-Conventional",
      "Non-Conventional"
    ],
    "correct": 3,
    "question_te": "ఈ దశలో విద్యార్థి తన అంతరాత్మ ప్రబోధానుసారం ప్రవర్తిస్తాడు",
    "options_te": [
      "పూర్వ సాంప్రదాయ",
      "సాంప్రదాయ",
      "ఉత్తర సాంప్రదాయ",
      "సాంప్రదాయేతర"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The correct option related to Erickson\nA: Erikson followed Psycho Analytical Theory\nB: Erikson agreed Psycho Sexual development",
    "options": [
      "Only A is correct",
      "Only B is correct",
      "A, B both are correct",
      "A, B both are incorrect"
    ],
    "correct": 1,
    "question_te": "ఎరిక్సన్ కు సంబంధించి సరైన ఐచ్ఛికాన్ని ఎన్నుకొనుము\nA: ఎరిక్సన్, మనోవిశ్లేషణ వాదాన్ని అనుసరించారు.\nB: ఎరిక్సన్ మనో లైంగిక వికాశదశలతో ఏకీభవించారు.",
    "options_te": [
      "Only A is correct",
      "Only B is correct",
      "A, B both are correct",
      "A, B both are incorrect"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "This is not a characteristic of a socially matured person.",
    "options": [
      "Doesn't participate in anti-social activities",
      "Have low emotional stability",
      "Share social responsibilities",
      "Have friendly relations with more people."
    ],
    "correct": 2,
    "question_te": "సాంఘిక పరిపక్వత గల వ్యక్తి లక్షణం కానిది",
    "options_te": [
      "సంఘ వ్యతిరేక కార్యక్రమాలలో పాల్గొనరు",
      "భావోద్వేగ స్థిరత్వం తక్కువగా ఉంటుంది",
      "సామాజిక బాధ్యతలు పంచుకుంటారు",
      "ఎక్కువ మందితో స్నేహ సంబంధాలను కలిగి ఉంటారు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "\"Birds of same feather flock together\" the idiom suits well to this stage of development.",
    "options": [
      "Adulthood",
      "Adolescence",
      "Infancy",
      "Early Childhood"
    ],
    "correct": 2,
    "question_te": "\"ఒకే జాతి పక్షులు కలిసి ఎగురుతాయి\". ఈ జాతీయం బాగా వర్తించే వికాస దశ.",
    "options_te": [
      "వయోజన దశ",
      "కౌమారదశ",
      "శైశవ దశ",
      "పూర్వ బాల్య దశ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The writer of the book, \"Developmental Psychology – A Life Span Approach\"",
    "options": [
      "Elizabeth Hurlock",
      "Henrich",
      "Stone and Brown",
      "Kimball"
    ],
    "correct": 1,
    "question_te": "\"Developmental Psychology – A Life Span Approach\" గ్రంథ రచయిత",
    "options_te": [
      "ఎలిజిబెత్ హర్లాక్",
      "హెన్ రిచ్",
      "స్టోన్ మరియు బ్రౌన్",
      "కింబాల్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Correct answer related to creativity.",
    "options": [
      "Creativity = Thinking + Implementation",
      "Creativity = Personality + Assessment",
      "Creativity = Process of Product + Utility",
      "Creativity = Attitude + Flexibility"
    ],
    "correct": 3,
    "question_te": "సృజనాత్మకతకు సంబంధించిన సరైన సమాధానము.",
    "options_te": [
      "సృజనాత్మకత = ఆలోచన + ఆచరణ",
      "సృజనాత్మకత = మూర్తిమత్వం + మదింపు",
      "సృజనాత్మకత = ఉత్పత్తి ప్రక్రియ + ఉపయోగం",
      "సృజనాత్మకత = వైఖరి + నమ్యత"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The incorrect statement related to IQ and EQ",
    "options": [
      "High IQ male has wide intellectual interests and abilities.",
      "High IQ female has broad intellectual and ascetic interest",
      "High EQ male is socially unstable and feels negative about himself.",
      "High EQ female is assertive and feels positive about hard"
    ],
    "correct": 3,
    "question_te": "IQ మరియు EQ సంబంధించి సరికాని ప్రవచనము",
    "options_te": [
      "ఎక్కువ IQ గల పురుషులు విశాలమైన మేధో ఆసక్తులు మరియు సామర్థ్యాలు కలిగి ఉంటారు",
      "ఎక్కువ IQ గల స్త్రీలు విశాలమైన మేధో మరియు సౌందర్యాత్మక ఆసక్తులు కలిగి ఉంటారు.",
      "ఎక్కువ EQ గల పురుషులు సాంఘికంగా అస్థిరంగా మరియు వారి గురించి వారు బుణాత్మకంగా భావిస్తారు.",
      "ఎక్కువ EQ గల స్త్రీలు చైతన్యంగా మరియు వారి గురించి వారు ధనాత్మకంగా భావిస్తారు."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The Transfer of Learning Theory that supports, \"a person who knows type writing, transfer his knowledge to audrino operation and then in computer operations\".",
    "options": [
      "Theory of Identical Elements",
      "Theory of Generalisation",
      "Theory of Transposition",
      "Theory of Ideals"
    ],
    "correct": 1,
    "question_te": "టైప్ రైటింగ్ తెలిసిన వ్యక్తి ఆ జ్ఞానాన్ని audrino operation కి తదుపరి కంప్యూటర్ వాడకకు ఉపయోగించిన అది ఈ అభ్యసన బదలాయింపు సిద్ధాంతాన్ని బలపరుస్తుంది.",
    "options_te": [
      "సమరూప అంశాల సిద్ధాంతం",
      "సాధారణీకరణ సిద్ధాంతం",
      "సమగ్ర ఆకృతి సిద్ధాంతం",
      "ఆదర్శాల సిద్ధాంతం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "According to Piaget, the units that allow organisms to be aware of their environment and interact with it is called",
    "options": [
      "Adaption",
      "Assimilation",
      "Schemas",
      "Accommodation"
    ],
    "correct": 3,
    "question_te": "పియాజె ప్రకారం జీవులు తమ పరిసరాన్ని గ్రహించి దానితో ప్రతిచర్య జరపడానికి దోహదపడే ప్రమాణాలు",
    "options_te": [
      "అనుకూలనీయత",
      "సాంశీకరణం",
      "స్కీమటా",
      "అనుగుణ్యత"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "According to Bruner, Enactive, Iconic and Symbolic are these representations",
    "options": [
      "Psycho Social",
      "Psychic",
      "Cognitive",
      "Social"
    ],
    "correct": 3,
    "question_te": "బ్రూనర్ ప్రకారం, క్రియాత్మక, చిత్రాత్మక, ప్రత్యేకాత్మక అనునవి ఈ రకమైన ప్రాతినిధ్య రూపాలు",
    "options_te": [
      "మనో సాంఘిక",
      "ఆత్మ సంబంధ",
      "సంజ్ఞానాత్మక",
      "సాంఘిక"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The stage in which an individual cannot improve his learning even after many attempts is",
    "options": [
      "Initial spurt",
      "Stage of fluctuation",
      "Plateau stage",
      "Physiological limit"
    ],
    "correct": 4,
    "question_te": "ఈ దశ చేరిన తరువాత వ్యక్తి ఎంత ప్రయత్నించినా అభ్యసనాన్ని మెరుగుపరుచుకోలేడు",
    "options_te": [
      "ప్రారంభ స్ఫూర్తి",
      "చాంచల్య దశ",
      "పీరభూమి దశ",
      "శారీరక ధర్మ హద్దు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "When a sequence of still images in a movie are perceived as a motion picture, it is called as",
    "options": [
      "Phi Phenomenon",
      "Peristaltic Movement",
      "Auto kinetic Effect",
      "Motion Parallax"
    ],
    "correct": 1,
    "question_te": "నిశ్చల చిత్రాల వరుస క్రమాన్ని ఒక చలన చిత్రంగా గుర్తించేది.",
    "options_te": [
      "ఫై దృగ్విషయం",
      "పెరిస్టాలిక్ కదలిక",
      "ఆటోకైనటిక్ ప్రభావము",
      "మోషన్ పార్లలాక్స్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The expanded form of 'SARTHAQ' of NEP 2020 is",
    "options": [
      "Standard Technical Holistic Advancement Through Quality Education",
      "Secular and Tactical Holistic Advancement Through Quality Education",
      "Students' and Teachers' Heuristic Advancement Through Quality Education",
      "Students' and Teachers' Holistic Advancement Through Quality Education"
    ],
    "correct": 4,
    "question_te": "NEP 2020 కు సంబంధించిన 'SARTHAQ' యొక్క పూర్తి రూపం",
    "options_te": [
      "Standard Technical Holistic Advancement Through Quality Education",
      "Secular and Tactical Holistic Advancement Through Quality Education",
      "Students' and Teachers' Heuristic Advancement Through Quality Education",
      "Students' and Teachers' Holistic Advancement Through Quality Education"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The pioneer of modern psychology who deeply engaged in the study of individual differences",
    "options": [
      "Jean Piaget",
      "Francis Galton",
      "Howard Gardener",
      "Guilford"
    ],
    "correct": 2,
    "question_te": "ఆధునిక మనోవిజ్ఞాన శాస్త్రంలో వైయక్తిక బేధాల అధ్యయనంలో నిమగ్నమైన శాస్త్రవేత్త",
    "options_te": [
      "జీన్ పియాజె",
      "ఫ్రాన్సిస్ గాల్టన్",
      "హవర్డ్ గార్డెనర్",
      "గిల్ ఫర్డ్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "\"Cognition is the inner process and products of mind that lead to knowing which include all the mental activities\", was defined by",
    "options": [
      "Flavell",
      "Kogan",
      "Traxler",
      "Berk"
    ],
    "correct": 4,
    "question_te": "\"ఒక వ్యక్తి తన మనస్సులో జరిగే అంతర్గత మానసిక చర్యల అంతర్గత ప్రక్రియయే సంజ్ఞానం\" అని చెప్పిన వారు",
    "options_te": [
      "ఫ్లావెల్",
      "కోగన్",
      "ట్రాక్స్లర్",
      "బర్క్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Harward Gardiner's definition of intelligence focused on",
    "options": [
      "Abstract Domain",
      "Educational Institution",
      "Laboratory Environment",
      "Cultural Setting"
    ],
    "correct": 4,
    "question_te": "హోర్వర్డ్ గార్డినర్ యొక్క ప్రజ్ఞా నిర్వచనం దీని మీద కేంద్రీకరించబడింది.",
    "options_te": [
      "అమూర్త అంశము",
      "విద్యా సంస్థ",
      "ప్రయోగశాల పరిస్థితులు",
      "సాంస్కృతిక నేపధ్యం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The correct option related to Sociometry.\nAssertion (A): Sociometry is an effective tool for educational and organizational settings.\nReason (R): It provides insights into group dynamics.",
    "options": [
      "A is true; R is false",
      "A is false; R is true",
      "Both A and R are true but R is not the correct explanation of A",
      "A and R are true and R is the correct explanation of A"
    ],
    "correct": 4,
    "question_te": "సాంఘిక మితికి సంబంధించిన సరైన ఐచ్ఛికాన్ని ఎంచుకొనుము.\nప్రకరణం (A): సాంఘికమితి అనేది విద్య మరియు సంస్థాగత వాతావరణంలో ప్రభావవంతమైన సాధనం.\nకారణం (R): ఇది సమూహ గతి శీలతను వెలికి తీస్తుంది.",
    "options_te": [
      "A is true; R is false",
      "A is false; R is true",
      "Both A and R are true but R is not the correct explanation of A",
      "A and R are true and R is the correct explanation of A"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "\"Metropolitan Readiness Test\" belongs to",
    "options": [
      "Educational Aptitudes",
      "Vocational Aptitudes",
      "Aesthetic Aptitudes",
      "Mechanical Aptitudes"
    ],
    "correct": 1,
    "question_te": "మెట్రోపాలిటన్ రెడినెస్ టెస్ట్ దీనికి సంబంధించినది",
    "options_te": [
      "విద్యావిషయక సహజ సామర్థ్యాలు",
      "వృత్తి సంబంధ సహజ సామర్థ్యాలు",
      "సౌందర్య కళాసంబంధ సహజ సామర్థ్యాలు",
      "యాంత్రిక సహజ సామర్థ్యాలు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The concept of implementation of Action Research through a cyclical process of planning, action, observation and reflection is developed by",
    "options": [
      "B.F.Skinner",
      "Kurt Lewin",
      "Jean Piaget",
      "Ivan Pavlov"
    ],
    "correct": 2,
    "question_te": "ప్రణాళికా, చర్య, పరిశీలన మరియు మననశీలతలు చక్రీయంగా జరిగే ప్రక్రియగా చర్యాత్మక పరిశోధన అనే భావనను అభివృద్ధి పరిచినవారు",
    "options_te": [
      "బి. ఎఫ్. స్కిన్నర్",
      "కర్ట్ లెవిన్",
      "జీన్ పియాజె",
      "ఇవాన్ పావ్లోవ్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Generally in managing a classroom, the student who naturally influence his / her peers and showcases confidence, but requires channeling of dominance or disruptive behaviour is a",
    "options": [
      "Passive Learner",
      "Follower",
      "Leader",
      "Interested Learner"
    ],
    "correct": 3,
    "question_te": "తరగతిగది నిర్వహణలో సాధారణంగా అధిక ఆత్మవిశ్వాసం మరియు ఇతరులను ప్రభావితం చేసే లక్షణాలు కలిగి, ఆధిపత్యం లేదా అంతరాయకర ప్రవర్తనను నిరోధించటానికి మార్గదర్శకత్వం అవసరమయ్యే విద్యార్థి",
    "options_te": [
      "నిష్క్రియ అభ్యాసకుడు",
      "అనుచరుడు",
      "నాయకుడు",
      "అయిష్ట అభ్యాసకుడు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Pearson's Product Movement method is useful to calculate",
    "options": [
      "Quartile Deviation",
      "Gausian Curve area",
      "Correlation Index",
      "Skewness"
    ],
    "correct": 3,
    "question_te": "పియర్సన్ ప్రాడక్ట్ మూమెంట్ పద్ధతి దీనిని కనుగొనుటకు ఉపయోగిస్తారు.",
    "options_te": [
      "చతుర్థాంశక విచలనం",
      "గాసియన్ వక్ర వైశాల్యం",
      "సహసంబంధ గుణకం",
      "వైషమ్యం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Correct option related to 'Assessment objectives'.\na) Subject specific\nb) Classified into open fields like knowledge skill, Attitude\nc) Considers educational plans and students\nd) Based on the specifications",
    "options": [
      "a, b and c only",
      "a, b and d only",
      "a, c and d only",
      "b, c and d only"
    ],
    "correct": 3,
    "question_te": "'మదింపు లక్ష్యాలకు' సంబంధించి సరైనవి.\na) విషయ సంబంధితమైనది.\nb) జ్ఞానం, నైపుణ్యం, వైఖరుల వంటి వివృత క్షేత్రాలుగా వర్గీకరింపబడ్డాయి.\nc) విద్యా ప్రణాళికను, విద్యార్థిని పరిగణలోకి తీసుకుంటారు.\nd) స్పష్టీకరణల ఆధరంగా ఉంటుంది",
    "options_te": [
      "a, b and c only",
      "a, b and d only",
      "a, c and d only",
      "b, c and d only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "This is a formal Communication",
    "options": [
      "Horizontal Communication",
      "Sequential Communication",
      "Star Communication",
      "Cluster Communication"
    ],
    "correct": 1,
    "question_te": "ఇది నియత సమాచార ప్రసారం",
    "options_te": [
      "సమాంతర సమాచార ప్రసారం",
      "శృంఖల భావప్రసారం",
      "నక్షత్ర భావప్రసారం",
      "క్లస్టర్ భావప్రసారం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "The shortcut key for Redo in MS-Word is",
    "options": [
      "Ctr + U",
      "Ctr + Y",
      "Ctr + S",
      "Ctr + P"
    ],
    "correct": 2,
    "question_te": "ఎం.ఎస్.వర్డ్‌లో 'Redo'కు షార్ట్ కట్ కీ",
    "options_te": [
      "Ctr + U",
      "Ctr + Y",
      "Ctr + S",
      "Ctr + P"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Expand the computer term LDU",
    "options": [
      "Liquid Display Unit",
      "Language Display Unit",
      "Linear Display Unit",
      "Logical Display Unit"
    ],
    "correct": 1,
    "question_te": "కంప్యూటరు పరిభాషలో LDU ను విస్తరించండి",
    "options_te": [
      "Liquid Display Unit",
      "Language Display Unit",
      "Linear Display Unit",
      "Logical Display Unit"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Child Development & Pedagogy",
    "question": "Choose the correct option related to ICT in Education.\nAssertion (A): All the schools must be provided with internet facility.\nReason (R): Internet saves much time for both students and teachers and aids teaching learning process.",
    "options": [
      "Assertion (A) is true and Reason (R) is false.",
      "Assertion (A) is false and Reason (R) is true.",
      "Both Assertion (A) and Reason (R) are true but the Reason (R) is not the correct explanation of Assertion (A).",
      "Both Assertion (A) and Reason (R) are true and the Reason (R) is the correct explanation of Assertion (A)."
    ],
    "correct": 4,
    "question_te": "విద్యలో ICT కి సంబంధించిన సరైన ఐచ్చికాన్ని ఎంచుకొనుము\nప్రకరణం (A): అన్ని పాఠశాలలకు ఇంటర్నెట్ సౌకర్యం కల్పించాలి.\nకారణం (R): ఇంటర్ నెట్ విద్యార్థుల మరియు ఉపాధ్యాయుల సమయాన్ని పొదుపు చేస్తూ బోధనాభ్యసన ప్రక్రియకు దోహద పడుతుంది.",
    "options_te": [
      "A ఒప్పు మరియు R తప్పు",
      "A తప్పు మరియు R ఒప్పు",
      "A మరియు R రెండూ ఒప్పు, కానీ R అనునది A కు సరియైన వివరణ కాదు",
      "A మరియు R రెండూ ఒప్పు, మరియు R అనునది A కు సరియైన వివరణ."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది అపరిచిత పద్యం చదివి ప్రశ్నకు జవాబు గుర్తించండి\nమత్తు చిత్తులు కల మర్యంబు తెలియక\nచిత్త చలనమంది చెడిరి భువిని\nచిత్తమచట లేక చిక్కునా పరమాత్మ\nవిశ్వదాభిరామ వినుర వేమ!\nపై పద్యం ఆధారంగా 'చిత్తము' అనే పదం ఈ అర్థాన్ని ఇస్తుంది",
    "options": [
      "బురద",
      "మనసు",
      "చెమట",
      "నలుగ"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది అపరిచిత పద్యం చదివి ప్రశ్నకు జవాబు గుర్తించండి\nమత్తు చిత్తులు కల మర్యంబు తెలియక\nచిత్త చలనమంది చెడిరి భువిని\nచిత్తమచట లేక చిక్కునా పరమాత్మ\nవిశ్వదాభిరామ వినుర వేమ!\nపరమాత్మ కనిపించాలంటే మనసు ఇలా ఉండాలి",
    "options": [
      "నిలకడగా ఉండాలి",
      "విచారంగా ఉండాలి",
      "మర్యంతో ఉండాలి",
      "కోరికలు కలిగి ఉండాలి"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది అపరిచిత గద్యం చదివి అడిగిన ప్రశ్నకు సమాధానం గుర్తించండి.\nపూర్ణమ్మ కథ, కిన్నెరసాని పాటలు, వెంకి పాటలు వంటి గేయ కావ్యాలు ఉన్నప్పటికీ పుట్టపర్తి నారాయణాచార్యుల 'శివతాండవం' ప్రత్యేక గుర్తింపు పొందినది. భక్తి భావం దీనికొక ప్రత్యేక శక్తిని కలిగిస్తుంది. స్వాతంత్ర్యానంతరం నారాయణాచార్యులు రచించిన కావ్యాలు 'మేఘదూతము', షాజీ, సాక్షాత్కారం, పండరీ భాగవతం, జనప్రియ రామాయణం ప్రసిద్ధములు. మేఘదూతము ఆంధ్రప్రదేశపు పట్టణాలన్నిటినీ వర్ణించినది. ప్రజా జీవనం కరుణ రసార్ద్ర దృష్టితో కూడా చూపినది. సాక్షాత్కారం తులసీదాసు రామాయణం ఆలంబనగా జరిగిన రచన. పారసీ భాష కవి 'షాజీ' చరిత్రయే షాజీ. తెలుగు నుండి ఇతర భాషలలోకి విస్తృతంగా అనువాదాలు చేసిన బహు భాషా కోవిదుడు శ్రీ పుట్టపర్తి నారాయణాచార్యులు. అందుకే వీరిని 'సరస్వతీ పుత్రుడు' అని కీర్తించారు.\nపుట్టపర్తి వారి రచనలలో స్వాతంత్రానంతర రచన కానిది",
    "options": [
      "మేఘదూతము",
      "జనప్రియ రామాయణం",
      "సాక్షాత్కారం",
      "శివతాండవం"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది అపరిచిత గద్యం చదివి అడిగిన ప్రశ్నకు సమాధానం గుర్తించండి.\nపూర్ణమ్మ కథ, కిన్నెరసాని పాటలు, వెంకి పాటలు వంటి గేయ కావ్యాలు ఉన్నప్పటికీ పుట్టపర్తి నారాయణాచార్యుల 'శివతాండవం' ప్రత్యేక గుర్తింపు పొందినది. భక్తి భావం దీనికొక ప్రత్యేక శక్తిని కలిగిస్తుంది. స్వాతంత్ర్యానంతరం నారాయణాచార్యులు రచించిన కావ్యాలు 'మేఘదూతము', షాజీ, సాక్షాత్కారం, పండరీ భాగవతం, జనప్రియ రామాయణం ప్రసిద్ధములు. మేఘదూతము ఆంధ్రప్రదేశపు పట్టణాలన్నిటినీ వర్ణించినది. ప్రజా జీవనం కరుణ రసార్ద్ర దృష్టితో కూడా చూపినది. సాక్షాత్కారం తులసీదాసు రామాయణం ఆలంబనగా జరిగిన రచన. పారసీ భాష కవి 'షాజీ' చరిత్రయే షాజీ. తెలుగు నుండి ఇతర భాషలలోకి విస్తృతంగా అనువాదాలు చేసిన బహు భాషా కోవిదుడు శ్రీ పుట్టపర్తి నారాయణాచార్యులు. అందుకే వీరిని 'సరస్వతీ పుత్రుడు' అని కీర్తించారు.\nపుట్టపర్తి వారికి చెందని అంశం గుర్తించండి",
    "options": [
      "వీరు 'సరస్వతీ పుత్రుడు'గా లబ్ధప్రతిష్టులు.",
      "షాజీ పారశీక కవి చరిత్ర",
      "వీరు ఇతర భాషల నుండి తెలుగులోకి అనువాదాలు చేశారు.",
      "సాక్షాత్కారం, తులసీదాస్ రామాయణానికి ఆలంబన రచన."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "'పాడరా ఓ తెలుగు వాడా!' అనే గేయ సంపుటి రాసిన కవి",
    "options": [
      "సింగమనేని నారాయణ",
      "కొండేపూడి లక్ష్మీనారాయణ",
      "చిలుకూరి దేవపుత్ర",
      "సత్యం శంకరమంచి"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"చారిత్రక కథ\" ప్రక్రియగా కల్గిన పాఠం",
    "options": [
      "మేలుకొలుపు",
      "సుభాషితాలు",
      "ధర్మ నిర్ణయం",
      "మమకారం"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "పురాణేతిహాసాలనుండి ఏదైనా చిన్న కథాంశాన్ని గ్రహించి కవులు అష్టాదశ వర్ణాలతో పెంచి పోషించి స్వతంత్ర కావ్యంగా రాయడం.",
    "options": [
      "నాటకం",
      "శతకం",
      "గేయం",
      "ప్రబంధం"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "పోతులూరి వీరబ్రహ్మం గారు రాసిన శతకానికి గల మకుటం",
    "options": [
      "అఖిల లోక మిత్ర! ఆంధ్ర పుత్ర!",
      "కాళికాంబ! హంస కాళికాంబ",
      "లలిత సుగుణ జాల! తెలుగు బాల",
      "విశ్వహిత చరిత్ర! వినర మిత్ర"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "స్త్రీలు ఆత్మాభిమానాన్ని పెంపొందించుకోవాలి అని తెలియజేయడమే ఉద్దేశంగా గల పాఠ్యాంశం",
    "options": [
      "చైతన్యం",
      "ఏ దేశమేగినా",
      "నా చదువు",
      "ఇల్లలకగానే"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "చిలుకూరి దేవపుత్ర రాసిన 'మమకారం' అను పాఠ్యాంశం ఈ కథా సంపుటి లోనిది",
    "options": [
      "అద్దంలో చందమామ",
      "వంకర టింకర",
      "ఆరు గ్లాసులు",
      "చివరి మనుషులు"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "నారాయణరాజు, సులోచన పాత్రలు కలిగిన పాఠ్యాంశం",
    "options": [
      "బాల చంద్రుని ప్రతిజ్ఞ",
      "ప్రియమిత్రునికి",
      "కప్పతల్లి పెళ్ళి",
      "చిన్ని శిశువు"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "'ఆంధ్ర పెర్ల్ బక్' గా వీరిని పిలుస్తారు",
    "options": [
      "వాసిరెడ్డి సీతాదేవి",
      "మాలింటి చంద్రకళ",
      "పింగళి బాలదేవి",
      "ఊటుకూరి లక్ష్మీ కాంతమ్మ"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది పాత్రలను సంబంధిత పాఠ్యాంశాలతో జతపరచండి.\ni) రాజారావు      A) జీవని\nii) విశ్వనాథం     B) మాతృభూమి\niii) రామప్ప      C) తీర్పు\niv) దేవదత్తుడు    D) పయనం",
    "options": [
      "i - B, ii - C, iii - A, iv - D",
      "i - B, ii - D, iii - C, iv - A",
      "i - B, ii - A, iii - D, iv - C",
      "i - B, ii - C, iii - D, iv - A"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"శ్రీ పాద వారి వచనం తెలుగు వారికి, తెలుగు తనానికి నారాయణ కవచం\" అని శ్లాఘించినవారు",
    "options": [
      "మల్లాది రామకృష్ణ శాస్త్రి",
      "దివాకర్ల తిరుపతి శాస్త్రి",
      "జంధ్యాల పాపయ్యశాస్త్రి",
      "మధునాపంతుల సత్యనారాయణ శాస్త్రి"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"పోలతి\" అనే పదానికి అర్థం\nA) స్త్రీ\nB) చిన్నదైన\nC) ఇంతి\nD) వ్యాపించు",
    "options": [
      "A, D",
      "D, C",
      "A, C",
      "A, B"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"దళము\" అనే పదానికి సరైన పర్యాయపదాలు",
    "options": [
      "దళసరి, సేన",
      "సేన, ఆధిక్యము",
      "సేన, సైన్యము",
      "సైన్యము, సేవ"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"ధర\" పదానికి నానార్థాలు",
    "options": [
      "భూమి, వెల",
      "ధరణి, వసుధ",
      "వెల, ఖరీదు",
      "కిమ్మత్తు, వెల"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"అనఘుడు\" సరైన వృత్త్యర్థం",
    "options": [
      "అఘము చేసినవాడు",
      "పాపం చేయని వాడు",
      "అఘములు చేయమన్నవాడు",
      "అనఘాలను సృష్టించువాడు"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "స్తంభం, స్థలం, స్నానము ఈ పదాలకు వికృతులు వరుసగా",
    "options": [
      "తంభం, తలం, స్నానము",
      "స్తంభం, స్తలము, తానం",
      "కంబం, స్తలము, తానం",
      "కంబము, తలము, తానము"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"అగస్త్య భ్రాత\" ఈ జాతీయాన్ని వాడే సందర్భం",
    "options": [
      "ఆగస్త్యుని కొడుకు గురించి చెప్పే సందర్భం",
      "ఆగమ శాస్త్రం తెలిసినవాడు గురించి చెప్పే సందర్భం",
      "పేరు తెలియని వాని గురించి చెప్పే సందర్భం",
      "బాగా ప్రసిద్ధి పొందిన పేరు గురించి తెలిపే సందర్భం"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"ఈనగాచి నక్కల పాలు జేసినట్లు\" ఇది ఒక",
    "options": [
      "జాతీయము",
      "సామెత",
      "శబ్ద పల్లవము",
      "పొడుపు కథ"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"ఏడుగురు అన్నదమ్ములం మేము\nవిడివిడిగా ఉంటే చెప్పగలరు\nకలిసి ఉంటే చెప్పలేరు\" ఈ పొడుపు కథకు సరైన విడుపు",
    "options": [
      "సప్తనదులు",
      "సప్తస్వరాలు",
      "ఇంద్రధనుస్సు",
      "మేఘమాలికలు"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది వానిలో 'ఉష్మాలు'",
    "options": [
      "ప, ఫ",
      "త, థ",
      "చ, ఛ",
      "క, ఖ"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "క్రియకు ముందు దేనిని/ వేనిని/ఎవరిని అనే పదాన్ని ఉంచినపుడు ఎలాంటి సమాధానం రాకపోతే అది ఈ వాక్యం",
    "options": [
      "సకర్మక",
      "వికర్మక",
      "అకర్మక",
      "తద్ధర్మక"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "\"బాగా చదివితే బాగు పడతాము\" అనేది",
    "options": [
      "క్వార్థకం",
      "చేదర్థకం",
      "శత్రర్థకం",
      "తుమున్నర్థకం"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "చంపకమాలలోని ఒక పద్యపాదంలోని గురువుల సంఖ్య",
    "options": [
      "9",
      "6",
      "7",
      "10"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "'తుట్ట తుద' విడదీస్తే",
    "options": [
      "తుట్ట + తుద",
      "తుద + తుద",
      "తుట్టన్ + తుద",
      "తుదన్ + తుదన్"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది సమాస పదాలను వాటి సమాసాలతో జతపరచండి\ni) విద్యాహీనుడు      A) పంచమీ తత్పురుష\nii) దొంగ భయం       B) సప్తమీ తత్పురుష\niii) మాట నేర్పరి     C) తృతీయా తత్పురుష",
    "options": [
      "i - C, ii - B, iii - A",
      "i - C, ii - A, iii - B",
      "i - A, ii - B, iii - C",
      "i - A, ii - C, iii - B"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "'పి. టి. ఉష గాలికంటే వేగంగా పరిగెత్తింది' ఈ వాక్యంలోని అలంకారము",
    "options": [
      "ఉపమ",
      "శ్లేష",
      "రూపక",
      "అతిశయోక్తి"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Telugu",
    "question": "కింది వానిలో ఆశీర్వాదక వాక్యం కానిది",
    "options": [
      "మీరు ఉత్తీర్ణులగుదురుగాక",
      "నీ కంతా మంచి జరుగుగాక",
      "భగవంతుడు ఆరోగ్యము ప్రసాదించుగాక",
      "ఆహా! ఎంత బాగా చిత్రాలు గీసారు"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Despite his deteriorating physical condition, the mind of Stephen Hawking burned with such fierce incandescence light emitted from heat.\nThat it forever transformed our understanding of the cosmos.\nChoose the synonym for the underlined word in the sentence.",
    "options": [
      "shadow",
      "darkness",
      "radiance",
      "gloom"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "To hear any flute is to be drawn into the commonality of all mankind.\nChoose the antonym for the underlined word in the sentence.",
    "options": [
      "uniqueness",
      "similarity",
      "uniformity",
      "universality"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the sentence with correct punctuation.",
    "options": [
      "Sindhu, whom I admire, has become an inspiration to many.",
      "Sindhu whom i admire has become, an inspiration to many",
      "Sindhu whom i admire has become an inspiration to many",
      "Sindhu: whom I admire, has become an inspiration to many?"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "The Director____his staff on their excellent performance.\nChoose the word that collocates the best:",
    "options": [
      "Complimented",
      "Complemented",
      "Supplicate",
      "reprimanded"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the correct meaning for the underlined idiom.\nOur travel plans are still up in the air.",
    "options": [
      "uncertain",
      "extremely happy",
      "manage with limited money",
      "work hard"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the correct phrasal verb to fill in the blank.\nThe cockpit ___ from the plane during the plane crash.",
    "options": [
      "broke off",
      "broke out",
      "broke down",
      "broke up"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Identify the primary purpose of a letter.",
    "options": [
      "To analyse and interpret literary works.",
      "To record historical or scientific facts.",
      "To convey a message or information.",
      "To present creative writing skills."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the expression in which the adjectives are in their correct order to fill in the blank.\nMy sister wore a ______set for her marriage.",
    "options": [
      "white oval small pearl",
      "small white oval pearl",
      "small oval white pearl",
      "white small oval pearl"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the terms that refers to a doctor who studies the effects and reactions to anesthetic medicines.",
    "options": [
      "Allergists",
      "Audiologists",
      "Anesthesiologists",
      "Dentists"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Do you think I ought to sell it?\nIdentify the language function in the above sentence.",
    "options": [
      "asking for advice",
      "refusing permission",
      "advising someone to do something",
      "advising someone not to do something"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the correct option.\nIt _____ when I got up.",
    "options": [
      "were raining",
      "raining",
      "was raining",
      "is raining"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the suffix that means 'having characteristics of'",
    "options": [
      "kingdom",
      "historical",
      "Safer",
      "Mountaineer"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Which pair of words given below are not in the order of an entry in the dictionary?",
    "options": [
      "ironical-irradiate",
      "ornament-orphanage",
      "pekinese-pelvis",
      "prodigy-prodigal"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the correct spelling.",
    "options": [
      "Souvenier",
      "Sovenir",
      "Souvenir",
      "Souvanir"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "I couldn't see the plane, because it was high _____the clouds.\nChoose the right preposition that hits the blank.",
    "options": [
      "over",
      "above",
      "under",
      "beneath"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Read the sentence below and choose the option with correct articles or no article.\nI have ____flat on the top floor. You get ___ lovely view from there.",
    "options": [
      "a; a",
      "an; a",
      "a; an",
      "no article; a"
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the correct sentence in Reported Speech.\nThey said, \"A bad carpenter quarrels with his tools.\"",
    "options": [
      "They said that a bad carpenter quarrelled with his tools.",
      "They say that a bad carpenter quarrelled with my tools.",
      "They said that a bad carpenter quarrels with his tools.",
      "They said that they are carpenters quarrelling with their tools."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "How often do the buses run?\nChoose the right type of sentence.",
    "options": [
      "Interrogative sentence.",
      "Imperative sentence.",
      "Assertive sentence.",
      "Exclamatory sentence."
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Identify the grammatically correct sentence.",
    "options": [
      "He is much clever to solved this problem.",
      "He is clever enough not to be solve this problem.",
      "He is not too clever to be solve this problem.",
      "He is clever enough to solve this problem."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Identify the silent consonant letter from the word \"sandwich\".",
    "options": [
      "c",
      "d",
      "h",
      "i"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Identify the suitable question tag.\nLet's go to the bench, _____",
    "options": [
      "will they?",
      "will we?",
      "won't you?",
      "shall we?"
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Identify the figure of speech used in the following phrase.\nThe leg of the table.",
    "options": [
      "Simile",
      "Metaphor",
      "Personification",
      "Hyperbole"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Lead is heavier than any other metal.\nChoose the sentence that converts the given sentence into Positive Degree.",
    "options": [
      "Lead is not heavy as other metals.",
      "Lead is the heaviest metal.",
      "Lead is not so heavy as some other metals.",
      "No other metal is so heavy as lead."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Choose the simple sentence from the following.",
    "options": [
      "He saved the child at the risk of his life.",
      "I saw a man who was blind.",
      "This is the place where we camp.",
      "He ran as fast as he could."
    ],
    "correct": 1
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Your behaviour vexes me.\nIdentify the correct Passive Voice for the given sentence.",
    "options": [
      "You are vexed by my behaviour.",
      "I was vexed by your behaviour.",
      "I am vexed by your behaviour.",
      "I have been vexed by your behaviour."
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Some of the students scored low ranks in the exams;\n___the teacher arranged a series of remedial classes.\nChoose the appropriate option.",
    "options": [
      "Besides",
      "So that",
      "Consequently",
      "Similarly"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "I saw him when I _____ out of the window\nChoose the most appropriate verb that fits the blank.",
    "options": [
      "looking",
      "was looking",
      "look",
      "will look"
    ],
    "correct": 2
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Read the following passage\nPoverty is wrongly considered an evil.\nThe poor lead happier life than the rich. The children of rich man are not so fortunate as those of poor men.\nThe home of poverty, free from care and social envy, is characterized by love and unity among its members.\n\nWhich idea of 'poverty' and 'being poor\" is not mentioned in the passage?",
    "options": [
      "Poor people are happier.",
      "Poor people are free from cares and are not envied.",
      "Poor people lead a life of love and unity among family.",
      "Being poor is evil."
    ],
    "correct": 4
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "English",
    "question": "Read the following stanza.\n\nHe won't do what you tell him.\nSo, come, let's build strong homes,\nLet's joint the doors firmly.\nPractise to firm the body.\nMake the heart steadfast.\nAnswer the following question.\n\nThe poet advices people to make themselves _____",
    "options": [
      "rich",
      "famous",
      "strong",
      "silent"
    ],
    "correct": 3
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "In the division algorithm of \"Division of the multiplicative inverse of -2/3 with its additive inverse\" then the Quotient is",
    "options": [
      "9/4",
      "4/9",
      "-4/9",
      "-9/4"
    ],
    "correct": 4,
    "question_te": "-2/3 యొక్క గుణకార విలోమమును, దాని సంకలన విలోమముతో భాగించిన \" భాగహార నియమము నందు భాగఫలము",
    "options_te": [
      "9/4",
      "4/9",
      "-4/9",
      "-9/4"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The LCM and HCF of two numbers are 210 and 21 respectively. If one of the numbers is 42, then the greatest prime factor of the other number is",
    "options": [
      "7",
      "3",
      "5",
      "105"
    ],
    "correct": 1,
    "question_te": "రెండు సంఖ్యల క.సా.గు. మరియు గ.సా.భా.లు వరుసగా 210 మరియు 21. వానిలో ఒక సంఖ్య 42 అయితే రెండవ సంఖ్య యొక్క గరిష్ట ప్రధాన కారణాంకము",
    "options_te": [
      "7",
      "3",
      "5",
      "105"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "If the side of an equilateral triangle is 6 cm then the difference between the radii of its circumcircle and incircle is (in cm)",
    "options": [
      "4sqrt(3)",
      "3sqrt(3)",
      "2sqrt(3)",
      "sqrt(3)"
    ],
    "correct": 4,
    "question_te": "ఒక సమబాహు త్రిభుజము యొక్క భుజం 6 సెం.మీ. అయినచో దాని పరివృత్తము మరియు అంతర వృత్త వ్యాసార్ధాల భేదం (సెం.మీ లలో)",
    "options_te": [
      "4sqrt(3)",
      "3sqrt(3)",
      "2sqrt(3)",
      "sqrt(3)"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The convex polygon that has 20 diagonals is",
    "options": [
      "Hexagon",
      "Octagon",
      "Nonagon",
      "Decagon"
    ],
    "correct": 2,
    "question_te": "20 కర్ణములు గల కుంభాకార బహుభుజి ఒక",
    "options_te": [
      "షడ్భుజి",
      "అష్టభుజి",
      "నవభుజి",
      "దశభుజి"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The formula for mean of a classified data x-bar = a + (sum(fidi)/sum(fi)), here di =",
    "options": [
      "xi + a",
      "xi/a",
      "xi - a",
      "xi x a"
    ],
    "correct": 3,
    "question_te": "వర్గీకృత దత్తాంశానికి సగటు కనుగొనుటకు సూత్రం x-bar = a + (sum(fidi)/sum(fi)), లో di =",
    "options_te": [
      "xi + a",
      "xi/a",
      "xi - a",
      "xi x a"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "\"10 added to 5 times a number is equal to 20.\" The symbolic form of this statement is",
    "options": [
      "5(x+10)=20",
      "5x+10=20",
      "x/5+10=20",
      "5x-10=20"
    ],
    "correct": 2,
    "question_te": "\"ఒక సంఖ్య యొక్క 5 రెట్లకు 10 కలుపగా ఫలితం 20.\" దీనికి సంజ్ఞారూపం",
    "options_te": [
      "5(x+10)=20",
      "5x+10=20",
      "x/5+10=20",
      "5x-10=20"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "If A = 6x^4 + 5x^3 - 14x^2 + 2x + 2 and B = 3x^2 - 2x - 1, then the remainder when A is divided by B.",
    "options": [
      "x",
      "2x",
      "3x",
      "4x"
    ],
    "correct": 1,
    "question_te": "A = 6x^4 + 5x^3 - 14x^2 + 2x + 2 మరియు B = 3x^2 - 2x - 1, అయిన A ని B చే భాగించగా వచ్చు శేషము",
    "options_te": [
      "x",
      "2x",
      "3x",
      "4x"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The sum of the first 40 whole numbers divisible by 6 is",
    "options": [
      "4920",
      "3960",
      "4860",
      "4680"
    ],
    "correct": 4,
    "question_te": "6 చే నిశ్శేషంగా భాగించబడు మొదటి 40 పూర్ణాంకాల మొత్తం",
    "options_te": [
      "4920",
      "3960",
      "4860",
      "4680"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "If three spheres with radii 2 cm, 3 cm, 4 cm are melted and cast into one big sphere, then the radius of the big sphere is (in cms)",
    "options": [
      "sqrt(99)",
      "cbrt(99)",
      "sqrt(33)",
      "cbrt(33)"
    ],
    "correct": 2,
    "question_te": "2 సెం.మీ., 3 సెం.మీ., 4 సెం.మీ. వ్యాసార్ధముగా గల గోళములను కరిగించి ఒక పెద్ద గోళంగా ఏర్పరిచిన లభించుపెద్ద గోళ వ్యాసార్ధం (సెం.మీ. లలో)",
    "options_te": [
      "sqrt(99)",
      "cbrt(99)",
      "sqrt(33)",
      "cbrt(33)"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The base of a triangle is twice its height. If its area is 12.25 cm^2, then length of the base is (in cm)",
    "options": [
      "3.5",
      "4.5",
      "7",
      "9"
    ],
    "correct": 3,
    "question_te": "12.25 చ.సెం.మీ. వైశాల్యం గల ఒక త్రిభుజపు భూమి దాని ఎత్తుకు రెండు రెట్టైన, దాని భూమి పొడవు (సెం.మీ.లలో)",
    "options_te": [
      "3.5",
      "4.5",
      "7",
      "9"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The area of the triangle having 120 cm, 170 cm and 250 cm as sides is",
    "options": [
      "9550",
      "18000",
      "900",
      "9000"
    ],
    "correct": 4,
    "question_te": "120 సెం.మీ.,170 సెం.మీ., మరియు 250 సెం.మీ. భుజములు కొలతలుగా గలిగిన త్రిభుజ వైశాల్యం (సెం.మీ.లలో)",
    "options_te": [
      "9550",
      "18000",
      "900",
      "9000"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "Which of the following outcomes are not equally likely",
    "options": [
      "getting a head or tail on a coin toss",
      "getting 1, 2, 3, 4, 5 or 6 on a fair die throw",
      "picking a red ball from a bag of 2 red and 5 blue balls",
      "picking one card from a well shuffled deck of playing cards"
    ],
    "correct": 3,
    "question_te": "కింది వానిలో సమసంభవ ఘటన కానిది",
    "options_te": [
      "నాణెమును ఎగురవేసినపుడు బొమ్మ లేదా బొరుసు పడుట",
      "పాచికను దొర్లించినపుడు 1, 2, 3, 4, 5, 6 లలో ఏదో ఒకటి పడుట",
      "2 ఎరుపు మరియు 5 నీలము బంతులు గల సంచి నుంచి ఎరుపు రంగు బంతిని ఎన్నుకొనుట.",
      "బాగా కలుపబడిన పేక ముక్కల నుంచి ఏదేని ఒక పేక ముక్కని తీయుట."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "Distance between the points (a cos(theta) + b sin(theta), 0) and (0, a sin(theta) - b cos(theta)) is",
    "options": [
      "a + b",
      "a^2 - b^2",
      "a^2 + b^2",
      "sqrt(a^2 + b^2)"
    ],
    "correct": 4,
    "question_te": "(a cos(theta) + b sin(theta), 0) మరియు (0, a sin(theta) - b cos(theta)) బిందువుల మధ్యదూరం",
    "options_te": [
      "a + b",
      "a^2 - b^2",
      "a^2 + b^2",
      "sqrt(a^2 + b^2)"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "If tan(theta) + sec(theta) = 10 then tan(theta) - sec(theta) =",
    "options": [
      "-10",
      "1/10",
      "-1/10",
      "5"
    ],
    "correct": 3,
    "question_te": "tan(theta) + sec(theta) = 10 అయితే tan(theta) - sec(theta) =",
    "options_te": [
      "-10",
      "1/10",
      "-1/10",
      "5"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The ratio of two numbers is 5 : 7. If 4 is added to each number the new ratio will be 3 : 4, then the sum of the squares of that two numbers is",
    "options": [
      "484",
      "784",
      "1084",
      "1184"
    ],
    "correct": 4,
    "question_te": "రెండు సంఖ్యల మధ్య నిష్పత్తి 5 : 7. ప్రతి సంఖ్యకు 4ను కలిపిన వచ్చే కొత్త సంఖ్యల నిష్పత్తి 3 : 4. అయితే ఆ రెండు సంఖ్యల వర్గాల మొత్తం",
    "options_te": [
      "484",
      "784",
      "1084",
      "1184"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "Of the three numbers A, B and C, the average of A and B is 16, average of B and C is 14 and the average of C and A is 18. Then the value of A + (B x C) =",
    "options": [
      "512",
      "212",
      "192",
      "202"
    ],
    "correct": 2,
    "question_te": "A, B మరియు C అను మూడు సంఖ్యలలో, A మరియు B ల సగటు 16, B మరియు C ల సగటు 14 మరియు C, A ల సగటు 18 అయితే A + (B x C) విలువ =",
    "options_te": [
      "512",
      "212",
      "192",
      "202"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "The specification 'estimates' belongs to this objective",
    "options": [
      "Skill",
      "Application",
      "Understanding",
      "Knowledge"
    ],
    "correct": 3,
    "question_te": "'అంచనా వేయును' అను స్పష్టీకరణ ఈ లక్ష్యమునకు చెందినది",
    "options_te": [
      "నైపుణ్యము",
      "వినియోగము",
      "అవగాహన",
      "జ్ఞానము"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "This method depends on John Dewey's Philosophy of Pragmatism",
    "options": [
      "Inductive",
      "Deductive",
      "Heuristic",
      "Project"
    ],
    "correct": 4,
    "question_te": "జాన్ డ్యూయి యొక్క వ్యవహారిక సత్తావాదము పై ఆధారపడిన పద్ధతి",
    "options_te": [
      "ఆగమన",
      "నిగమన",
      "అన్వేషణ",
      "ప్రాజెక్టు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "Basing on these proposals, the SFG-2011 position paper is prepared\na) NCF-2005\nb) NFG position paper - 2006\nc) RTE 2009\nd) NPE 1986",
    "options": [
      "b, c, d",
      "c, d, a",
      "a, b, d",
      "a, b, c"
    ],
    "correct": 4,
    "question_te": "వీటి ప్రతిపాదనల ఆధారంగా SFG-2011 (State Focus Group 2011) ఆధారపత్రం రూపొందించబడింది\na) NCF-2005\nb) NFG position paper - 2006\nc) RTE 2009\nd) NPE 1986",
    "options_te": [
      "b, c, d",
      "c, d, a",
      "a, b, d",
      "a, b, c"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Mathematics",
    "question": "\"The teachers are to be encouraged to teach in bilingual method when the mother tongue and the medium of instruction differ. Bilingual teaching learning material should be available.\" This paragraph is from",
    "options": [
      "National Policy on Education, 1986",
      "National Educational Policy, 2020",
      "National Curriculum Frame Work - 2005",
      "State Curriculum Frame Work - 2011"
    ],
    "correct": 2,
    "question_te": "\"విద్యార్థుల ఇంటి భాష, బోధనా మాధ్యమం వేరుగా ఉన్నప్పుడు ద్విభాష పద్ధతిలో బోధించడానికి ఉపాధ్యాయులను ప్రోత్సహించాలి. ద్విభాషా బోధనాభ్యసన సామగ్రిని అందుబాటులో ఉంచాలి.\" అని దేనిలో ప్రస్తావించబడినది.",
    "options_te": [
      "జాతీయ విద్యా విధానం, 1986",
      "జాతీయ విద్యా విధానం, 2020",
      "జాతీయ విద్యా ప్రణాళిక చట్టం – 2005",
      "రాష్ట్ర విద్యా ప్రణాళిక చట్టం – 2011"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The bob of a simple pendulum takes ½ second to move from mean position to extreme position. It's time period will be",
    "options": [
      "1 second",
      "2 seconds",
      "3 seconds",
      "4 seconds"
    ],
    "correct": 2,
    "question_te": "ఒక లఘులోలక గోళము మధ్యమ స్థానం నుండి గరిష్ట స్థానానికి వెళ్ళడానికి ½ సెకను కాలం తీసుకొంటే దాని ఆవర్తన కాలము",
    "options_te": [
      "1 సెకను",
      "2 సెకనులు",
      "3 సెకనులు",
      "4 సెకనులు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "A person while walking on a wet surface slips and falls forward. The direction of friction acted with reference to surface in this situation is",
    "options": [
      "backward",
      "forward",
      "upward",
      "downward"
    ],
    "correct": 2,
    "question_te": "తడి ఉపరితలంపై నడుస్తూ ఒక వ్యక్తి జారి ముందుకు పడ్డాడు. ఈ పరిస్థితిలో ఘర్షణ దిశ ఉపరితలంతో పోల్చినపుడు",
    "options_te": [
      "వెనుకకు",
      "ముందుకు",
      "పై వైపుకు",
      "క్రింది వైపుకు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The force of gravitation between two bodies of masses 10^5 Kg and 10^6 Kg kept at a distance of 1 m is",
    "options": [
      "6.67 N",
      "1/6.67 N",
      "6.67 x 10^-11 N",
      "6.67 x 10^11 N"
    ],
    "correct": 1,
    "question_te": "10^5 కి.గ్రా మరియు 10^6 కి.గ్రా ల ద్రవ్యరాశులు గల రెండు వస్తువుల మధ్య దూరం 1 మీ అయిన వాటి మధ్య గల గురుత్వాకర్షణ బలం",
    "options_te": [
      "6.67 N",
      "1/6.67 N",
      "6.67 x 10^-11 N",
      "6.67 x 10^11 N"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "Capacity of doing work : A :: Rate of doing work : B\nHere A and B refers to",
    "options": [
      "A = Power, B = Energy",
      "A = Momentum, B = Torque",
      "A = Torque, B = Momentum",
      "A = Energy, B = Power"
    ],
    "correct": 4,
    "question_te": "పనిచేయగల సామర్ధ్యం : A :: పనిచేసే రేటు : B\nఇచ్చట A, B లు",
    "options_te": [
      "A = సామర్ధ్యం, B = శక్తి",
      "A = ద్రవ్యవేగం, B = బలభ్రామకం",
      "A = బలభ్రామకం, B = ద్రవ్యవేగం",
      "A = శక్తి, B = సామర్ధ్యం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "Match the following\n(i) A region of high pressure    (a) Rarefaction\n(ii) A region of low pressure    (b) Frequency\n(iii) Shrillness    (c) Compression",
    "options": [
      "i - c, ii - a, iii - b",
      "i - a, ii - c, iii - b",
      "i - a, ii - b, iii - c",
      "i - c, ii - b, iii - a"
    ],
    "correct": 1,
    "question_te": "కింద వానిని జతపరచండి.\n(i) అధిక పీడన ప్రాంతం    (a) విరళీకరణము\n(ii) అల్ప పీడన ప్రాంతం    (b) పౌనఃపున్యం\n(iii) కీచుదనం    (c) సంపీడనం",
    "options_te": [
      "i - c, ii - a, iii - b",
      "i - a, ii - c, iii - b",
      "i - a, ii - b, iii - c",
      "i - c, ii - b, iii - a"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "Optical device that forms diminished virtual image\na) convex mirror   b) concave mirror\nc) convex lens   d) concave lens",
    "options": [
      "a & b",
      "b & c",
      "c & d",
      "a & d"
    ],
    "correct": 4,
    "question_te": "క్షయకరణ మిధ్యా ప్రతిబింబాన్ని ఏర్పరిచే దృశ్యా సాధనం.\na) కుంభాకార దర్పణం   b) పుటాకార దర్పణం\nc) కుంభాకార కటకం   d) పుటాకార కటకం",
    "options_te": [
      "a & b",
      "b & c",
      "c & d",
      "a & d"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "If the area of cross section of a copper wire is doubled, then its resistivity",
    "options": [
      "Becomes half",
      "Doubles",
      "Becomes 4 times",
      "Does not change"
    ],
    "correct": 4,
    "question_te": "ఒక రాగి తీగ యొక్క మధ్యచ్ఛేదన వైశాల్యాన్ని రెట్టింపు చేసిన, దాని నిరోధకత",
    "options_te": [
      "సగం అవుతుంది",
      "రెండింతలు అవుతుంది",
      "4 రెట్లు అవుతుంది",
      "మారదు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "Choose the correct option\nThe magnetic field strength inside a long straight solenoid carrying current",
    "options": [
      "Is zero",
      "Decreases as we move from center towards its end",
      "Increases as we move from center towards its end",
      "Is the same at all points"
    ],
    "correct": 4,
    "question_te": "సరైన ఐచ్చికాన్ని ఎంచుకోండి.\nవిద్యుత్ ప్రవహిస్తున్న పొడవైన తిన్నని సోలినాయిడ్ లోపల ఉన్న అయస్కాంత క్షేత్ర బలం",
    "options_te": [
      "శూన్యం",
      "మనం దాని మధ్య నుండి చివర వైపుకు వెళ్ళే కొద్దీ తగ్గుతుంది.",
      "మనం దాని మధ్య నుండి చివర వైపు వెళ్ళే కొద్దీ పెరుగుతుంది.",
      "అన్ని బిందువుల వద్ద ఒకేలా ఉంటుంది."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "Choose the correct option.\nAssertion (A): The ores of many metals are oxides.\nReason (R): Oxygen is very less reactive element and is very abundant on the Earth.",
    "options": [
      "Both A and R are correct and R is the correct reason for A.",
      "Both A and R are correct but R is not the correct reason for A.",
      "A is correct, R is incorrect.",
      "A is incorrect, R is correct."
    ],
    "correct": 3,
    "question_te": "సరైన ఐచ్చికాన్ని ఎంచుకోండి.\nప్రవచనం (A): అనేక లోహాల యొక్క ధాతువులు ఆక్సైడ్లు.\nకారణం (R): ఆక్సిజన్ అల్ప చర్యాశీలత గలది మరియు భూమిపై అత్యధికంగా లభించే మూలకం.",
    "options_te": [
      "A మరియు R లు రెండూ సరైనవి మరియు R, A కు సరైన కారణం.",
      "A మరియు R లు రెండూ సరైనవి కాని R, A కు సరైన కారణం కాదు.",
      "A సరైనది, R తప్పు.",
      "A తప్పు, R సరైనది."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The process involved in obtaining common salt from sea water",
    "options": [
      "Condensation",
      "Evaporation",
      "Sublimation",
      "Deposition"
    ],
    "correct": 2,
    "question_te": "సముద్రపు నీటి నుంచి, సాధారణ ఉప్పును పొందే ప్రక్రియ",
    "options_te": [
      "సాంద్రీకరణము",
      "బాష్పీభవనము",
      "ఉత్పతనము",
      "నిక్షేపణము"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The gas produced by the reaction between Vinegar and Baking soda",
    "options": [
      "Brighten the candle flame",
      "Put off the candle flame with pop sound",
      "Turns lime water milky",
      "Produces pungent smell"
    ],
    "correct": 3,
    "question_te": "వెనిగర్ మరియు బేకింగ్ సోడాల మధ్య చర్య ఫలితంగా ఉత్పన్నమయ్యే వాయువు",
    "options_te": [
      "కొవ్వొత్తి మంటను కాంతివంతంగా చేస్తుంది.",
      "కొవ్వొత్తి మంటను 'టప్'మనే శబ్దంతో ఆర్పివేస్తుంది.",
      "సున్నపు నీటిని పాలవలే తెల్లగా మారుస్తుంది",
      "దుర్వాసనను కలిగిస్తుంది"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "This is not an example of a compound with more than one bond",
    "options": [
      "H2",
      "O2",
      "N2",
      "C2H2"
    ],
    "correct": 1,
    "question_te": "ఒకటి కంటే ఎక్కువ బంధాలు కలిగిన సమ్మేళనానికి ఉదాహరణ కానిది",
    "options_te": [
      "H2",
      "O2",
      "N2",
      "C2H2"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The ratio of concentrated Hydrochloric acid and Nitric acid in Aqua regia is",
    "options": [
      "3 : 1",
      "2 : 3",
      "1 : 2",
      "1 : 3"
    ],
    "correct": 1,
    "question_te": "ద్రవరాజములో గాఢ హైడ్రోక్లోరిక్ ఆమ్లం మరియు నైట్రిక్ ఆమ్లాల నిష్పత్తి",
    "options_te": [
      "3 : 1",
      "2 : 3",
      "1 : 2",
      "1 : 3"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "This is also called as 'black gold'",
    "options": [
      "Petrol",
      "Coal",
      "Coke",
      "Petroleum"
    ],
    "correct": 4,
    "question_te": "దీనిని 'నల్ల బంగారం' అని కూడా పిలుస్తారు",
    "options_te": [
      "పెట్రోలు",
      "నేలబొగ్గు",
      "కోక్",
      "పెట్రోలియం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "The substance used to remove permanent hardness of water",
    "options": [
      "Sodium hydrogen carbonate",
      "Bleaching powder",
      "Gypsum",
      "Sodium carbonate"
    ],
    "correct": 4,
    "question_te": "నీటి శాశ్వత కాఠిన్యతను తొలగించడానికి ఉపయోగించే పదార్థం",
    "options_te": [
      "సోడియం హైడ్రోజన్ కార్బోనేట్",
      "బ్లీచింగ్ పౌడర్",
      "జిప్సం",
      "సోడియం కార్బోనేట్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "In view of static and dynamic nature of science, this can be understood as\n(a) Science = Knowledge + Procedures\n(b) Science = Process + Product\n(c) Science = Scientific processes + Procedures + Attitudes",
    "options": [
      "a and b only",
      "a and c only",
      "a, b and c only",
      "c only"
    ],
    "correct": 3,
    "question_te": "విజ్ఞాన శాస్త్రాన్ని స్థబ్ద, గతిశీల దృష్టితో చూసినప్పుడు ఈ విధమైనదిగా అర్థం చేసుకోవాలి.\n(a) విజ్ఞాన శాస్త్రం = జ్ఞానం + పద్ధతులు\n(b) విజ్ఞాన శాస్త్రం = ప్రక్రియ + ఉత్పన్నం\n(c) విజ్ఞాన శాస్త్రం = శాస్త్రీయ ప్రక్రియలు + పద్ధతులు + వైఖరులు",
    "options_te": [
      "a మరియు b మాత్రమే",
      "a మరియు c మాత్రమే",
      "a, b మరియు c మాత్రమే",
      "c మాత్రమే"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "After reading the lesson 'Heat', a student explained reasons for increase of sea levels and decided to stop environment pollution activities. The educational objectives achieved by him are.",
    "options": [
      "Knowledge, Understanding",
      "Application, Characterization",
      "Characterization, Precision",
      "Evaluation, Responding"
    ],
    "correct": 4,
    "question_te": "'ఉష్ణం' పాఠం చదివిన విద్యార్థి సముద్ర ఎత్తులు పెరుగుతుండడానికి గల కారణాలు చెప్పడంతో పాటు వాతావరణ కాలుష్యం కలిగించే పనులు చేయకూడదని నిర్ణయించుకున్నాడు. ఆ విద్యార్థి సాధించిన విద్యా లక్ష్యాలు",
    "options_te": [
      "జ్ఞానం, అవగాహన",
      "వినియోగం, శీల స్థాపన",
      "శీలస్థాపన, సునిశితత్వం",
      "మూల్యాంకనం, ప్రతిస్పందన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "'Instructional Cards' generally used in this teaching method",
    "options": [
      "Synthetic- Analytic method",
      "Instruction method",
      "Heuristic method",
      "Laboratory method"
    ],
    "correct": 4,
    "question_te": "'సూచన కార్డు' లను సాధారణంగా ఈ బోధన పద్ధతిలో వినియోగిస్తారు.",
    "options_te": [
      "సంశ్లేషణ – విశ్లేషణ పద్ధతి",
      "సూచనల పద్ధతి",
      "అన్వేషణ పద్ధతి",
      "ప్రయోగశాల పద్ధతి"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Physical Science",
    "question": "This is not an advantage of Objective test",
    "options": [
      "Takes less time to answer and evaluate",
      "Easy to prepare question paper",
      "Can test all the objectives",
      "Get equal marks if evaluated by anyone at anytime."
    ],
    "correct": 2,
    "question_te": "లక్ష్యాత్మక ప్రశ్నల ప్రయోజనం కానిది",
    "options_te": [
      "పరీక్ష రాయడానికి, గణనకు తక్కువ సమయం పడుతుంది.",
      "ప్రశ్నాపత్రం తయారుచేయడం సులభం.",
      "అన్ని లక్ష్యాలను పరీక్ష చేయవచ్చు.",
      "ఎవరు, ఏ సమయంలో గణన చేసినా, ఒకే రకమైన మార్కులు వస్తాయి."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "The vitamin that gets destroyed easily by heating is",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "correct": 3,
    "question_te": "వేడి చేయడం వలన సులభంగా నశించే విటమిన్",
    "options_te": [
      "A",
      "B",
      "C",
      "D"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "The monocotyledonous plants have\na) Tap root\nb) Parallel venation\nc) Reticulate venation\nd) Fibrous root",
    "options": [
      "a & b only",
      "a & c only",
      "c & d only",
      "b & d only"
    ],
    "correct": 4,
    "question_te": "ఏకదళ బీజ మొక్కలు కలిగి ఉండేవి\na) తల్లి వేరు\nb) సమాంతర ఈనెల వ్యాపనం\nc) జాలాకార ఈనెల వ్యాపనం\nd) గుబురు వేర్లు",
    "options_te": [
      "a & b only",
      "a & c only",
      "c & d only",
      "b & d only"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "The digestive juice without an enzyme\n(a) Saliva\n(b) Bile\n(c) Pancreatic",
    "options": [
      "a only",
      "b only",
      "a, b only",
      "a, b and c"
    ],
    "correct": 2,
    "question_te": "ఎంజైము లేని జీర్ణరసం\n(a) లాలాజలం\n(b) పైత్యరసం\n(c) క్లోమం",
    "options_te": [
      "a only",
      "b only",
      "a, b only",
      "a, b and c"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Microorganisms feed on dead plant and animal tissues and convert them into a dark coloured substance called",
    "options": [
      "Soil",
      "Black soil",
      "Humus",
      "Compost"
    ],
    "correct": 3,
    "question_te": "సూక్ష్మజీవులు చనిపోయిన మొక్కలు మరియు జంతు కణజాలాల నుండి ఆహారమును పొంది, వాటిని ముదురు రంగు గల ఈ పదార్థంగా మార్చుతాయి.",
    "options_te": [
      "మృత్తిక",
      "నల్ల మట్టి",
      "హ్యూమస్",
      "కంపోస్ట్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "The major source of pollutants like sulphur dioxide and nitrogen dioxide are",
    "options": [
      "Rubber processing units",
      "Petroleum refineries",
      "Burning of coal",
      "Automobile industries"
    ],
    "correct": 2,
    "question_te": "సల్ఫర్ డై ఆక్సైడ్ మరియు నైట్రోజన్ డై ఆక్సైడ్ వంటి కాలుష్యకారకాల ప్రధాన వనరు",
    "options_te": [
      "రబ్బరు ప్రాసెసింగ్ యూనిట్లు",
      "చమురు శుద్ధి కర్మాగారములు",
      "బొగ్గును మండించుట",
      "ఆటోమొబైల్ పరిశ్రమలు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Preservatives like Sodium benzoate, sodium meta bisulphite are the preservatives used for preserving of",
    "options": [
      "Meat & Fish",
      "Pickles and jellies",
      "Jams & Squashes",
      "Amla & Tamarind"
    ],
    "correct": 3,
    "question_te": "సోడియం బెంజోయేట్, సోడియం మెటాబైసల్ఫైట్ వంటి ప్రిజర్వేటివ్‌లను ఉపయోగించి నిల్వచేయునవి",
    "options_te": [
      "మాంసం & చేప",
      "పచ్చళ్లు మరియు జెల్లీలు",
      "జామ్ & స్క్వాష్‌లు",
      "ఉసిరి & చింతపండు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Longer alimentary canal is characterised by",
    "options": [
      "Organisms eating only plants",
      "Organisms eating only fish",
      "Organisms eating both plants & animal food",
      "Organisms feeding on detritus"
    ],
    "correct": 1,
    "question_te": "పొడవైన జీర్ణనాళం కలిగి ఉండటం ఈ జీవుల లక్షణం",
    "options_te": [
      "మొక్కల్ని మాత్రమే తినే జీవులు",
      "మాంసమును మాత్రమే తినే జీవులు",
      "మొక్కల్ని మరియు జంతువులను తినే జీవులు",
      "కుళ్ళుతున్న వ్యర్థాలను ఆహారంగా తీసుకునే జీవులు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Match the following.\na) Leishmania    i) Budding\nb) Plasmodium    ii) Multiple fission\nc) Hydra    iii) Regeneration\nd) Planaria    iv) Binary fission",
    "options": [
      "a-i, b-iii, c-iv, d-ii",
      "a-iv, b-ii, c-i, d-iii",
      "a-ii, b-iv, c-i, d-iii",
      "a-iv, b-iii, c-ii, d-i"
    ],
    "correct": 2,
    "question_te": "జతపరచండి.\na) లీష్మానియా    i) మొగ్గతొడగటం\nb) ప్లాస్మోడియం    ii) బహుదావిచ్చిత్తి\nc) హైడ్రా    iii) పునరుత్పత్తి\nd) ప్లనేరియా    iv) ద్విదావిచ్చిత్తి",
    "options_te": [
      "a-i, b-iii, c-iv, d-ii",
      "a-iv, b-ii, c-i, d-iii",
      "a-ii, b-iv, c-i, d-iii",
      "a-iv, b-iii, c-ii, d-i"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Choose the correct answer.\nAssertion A : The flow of energy is unidirectional.\nAssertion R : The energy got by the primary consumers can be reverted to producers.",
    "options": [
      "Both A & R are correct and R is correct explanation to A",
      "A & R both are correct but R is not correct explanation to A",
      "A is correct, R is incorrect",
      "Both A & R are incorrect."
    ],
    "correct": 3,
    "question_te": "సరైన సమాధానం రాయండి.\nప్రవచనం A : శక్తి ప్రవాహం ఏకదిశాత్మకంగా ఉంటుంది.\nవివరణ R : ప్రాథమిక వినియోగదారుల చేత సంగ్రహించబడిన శక్తి ఉత్పత్తి దారుల వద్దకు తిరిగి వెళ్ళును.",
    "options_te": [
      "A మరియు R సరి అయినవి మరియు R, A కు సరైన వివరణ",
      "A మరియు R సరి అయినవి అయితే R, A కు సరైన వివరణ కాదు",
      "A సరి అయినది R సరైనది కాదు.",
      "A మరియు రెండూ R సరికావు."
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Two deshelled eggs A & B were taken. A was placed in a beaker with pure water and B was placed in a beaker with salt solution. Assess the correct results.",
    "options": [
      "A shrinks, B swells",
      "A swells and B shrinks",
      "Both A and B shrink",
      "Both A and B swells"
    ],
    "correct": 2,
    "question_te": "పెంకు తొలగించిన రెండు గుడ్లు A, B లను తీసుకున్నారు. Aను మంచి నీరు కలిగిన బీకరులో, Bను ఉప్పునీటి ద్రావణంగల బీకరులో ఉంచారు. ఫలితాలను అంచనా వేయండి.",
    "options_te": [
      "A కుంచించుకుపోతుంది B ఉబ్బుతుంది",
      "A ఉబ్బుతుంది B కుంచించుకుపోతుంది",
      "A మరియు B కూడా కుచించుకుపోతాయి",
      "A మరియు B కూడా ఉబ్బుతాయి"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Statement A : Ligaments are not elastic and has considerable strength as they connect bones to bones.\nStatement B : Tendons are highly elastic and has great strength as they connect muscles to bones.",
    "options": [
      "Both A and B are true",
      "Only A is true",
      "Both A and B are false",
      "Only B is true"
    ],
    "correct": 3,
    "question_te": "ప్రవచనం A : సంధి బంధనం సాగదు, దానికి దృఢత్వం ఉంటుంది ఎందుకనగా అది ఎముకలతో ఎముకలను కలిపి ఉంచుతుంది.\nప్రవచనం B : స్నాయుబంధనం బాగా సాగే గుణం కలిగి ఉండి బాగా దృఢంగా ఉంటుంది ఎందుకంటే అది కండరాలను ఎముకతో అతికి ఉంచుతుంది.",
    "options_te": [
      "Both A and B are true",
      "Only A is true",
      "Both A and B are false",
      "Only B is true"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Penaeus monodon is an example for",
    "options": [
      "Marine fish",
      "Freshwater prawn",
      "Marine prawn",
      "Freshwater fish"
    ],
    "correct": 3,
    "question_te": "పీనియస్ మొనోడాన్ అనేది దీనికి ఉదాహరణ",
    "options_te": [
      "సముద్రపు చేప",
      "మంచినీటి రొయ్య",
      "సముద్రపు రొయ్య",
      "మంచినీటి చేప"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Largest flowers are found in",
    "options": [
      "Wolfia",
      "Rafflesia",
      "Victoria Lilly",
      "Yucca"
    ],
    "correct": 2,
    "question_te": "అతిపెద్ద పుష్పాలు కలిగి యుండునది",
    "options_te": [
      "ఉల్ఫియా",
      "రఫ్లీషియా",
      "విక్టోరియా లిల్లీ",
      "యుక్కా"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "\"Water soluble inorganic nutrients go down into the soil and get precipitated as unavailable salts.\" This process is called",
    "options": [
      "Fragmentation",
      "Weathering",
      "Mineralization",
      "Leaching"
    ],
    "correct": 4,
    "question_te": "\"నీటిలో కరిగే అకర్బన పోషక పదార్థాలు నేలలోకి ఇంకి, లభ్యం కాని లవణ అవక్షేపాలుగా ఏర్పడతాయి\". ఈ ప్రక్రియను ఈ విధంగా పిలుస్తారు.",
    "options_te": [
      "శకలీకరణం",
      "క్రమక్షయం",
      "మినరలైజేషన్",
      "విక్షాళక ప్రక్రియ"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "The first product in the Calvin cycle is",
    "options": [
      "C6H12O6",
      "OAA",
      "PGA",
      "Pyruvic acid / పైరువిక్ ఆమ్లం"
    ],
    "correct": 3,
    "question_te": "కెల్విన్ వలయం నందు ఏర్పడే మొదటి ఉత్పన్నం",
    "options_te": [
      "C6H12O6",
      "OAA",
      "PGA",
      "Pyruvic acid / పైరువిక్ ఆమ్లం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "This hormone plays a very important role in the regulation of circadian rhythms 24 hours in our body.",
    "options": [
      "Vasopressin",
      "Somatostatin",
      "Melatonin",
      "Cortisol"
    ],
    "correct": 3,
    "question_te": "మన శరీరంలోని 24 గంటల దినప్రవర్తన లేదా సర్కాడియన్ లయలను క్రమపరచడంలో ముఖ్య పాత్ర పోషించే హార్మోన్",
    "options_te": [
      "వాసోప్రెస్సిన్",
      "సోమాటోస్టాటిన్",
      "మెలటోనిన్",
      "కార్టిసాల్"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "This will be the cause of learning",
    "options": [
      "Curious nature of science",
      "Explorative nature of science",
      "Dynamic nature of science",
      "Experiences gained by senses"
    ],
    "correct": 4,
    "question_te": "దీనిని అభ్యసననికి మూలంగా పేర్కొంటారు .",
    "options_te": [
      "సైన్స్ కుతూహల స్వభావాన్ని కలిగి ఉండటం",
      "సైన్స్ అన్వేషణాత్మక స్వభావాన్ని కలిగి ఉండటం",
      "సైన్స్ మార్పుకు లోనయ్యే స్వభావాన్ని కలిగి ఉండటం",
      "జ్ఞానేంద్రియాల ద్వారా పొందే అనుభవాలు"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "Questioning the believes, thoughts, realities in society based on scientific researches is",
    "options": [
      "Logical thinking",
      "Skepticism",
      "Open mind ness",
      "Critical thinking"
    ],
    "correct": 2,
    "question_te": "సమాజంలో ఉండే నమ్మకాలు, ఆలోచనలు, నిజాలను శాస్త్రీయ పరిశోధనల ఆధారంగా ప్రశ్నించడం అనునది",
    "options_te": [
      "తార్కిక ఆలోచన",
      "సంశయ వాదం",
      "విశాల దృక్పథం",
      "విమర్శనాత్మక ఆలోచన"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "A student established relationship between the usage of fossil fuels and environment pollution. The objective achieved here is",
    "options": [
      "Interpretation",
      "Scientific attitude",
      "Application",
      "Naturalization"
    ],
    "correct": 3,
    "question_te": "ఒక విద్యార్థి శిలాజ ఇందనాల వినియోగానికి వాతావరణ కాలుష్యానికి సంబంధం ఏర్పరచినాడు. అతడు సాధించిన లక్ష్యం",
    "options_te": [
      "వ్యాఖ్యానించడం",
      "శాస్త్రీయ వైఖరి",
      "వినియోగం",
      "సహజీకరణం"
    ]
  },
  {
    "year": 2026,
    "paper": "AP TET Paper 2A (Maths & Science), 12th August 2026 Shift 2",
    "subject": "Biology",
    "question": "A teacher prepared different types of house models by their students. Which type of project is this?",
    "options": [
      "Consumer Project",
      "Productive Project",
      "Problem Project",
      "Training Project"
    ],
    "correct": 2,
    "question_te": "ఒక ఉపాధ్యాయుడు విద్యార్థులతో రకరకాల ఇళ్ల నమూనాలను తయారు చేయించాడు. దీనిని ఈ రకమైన ప్రాజెక్టుగా పేర్కొనవచ్చు.",
    "options_te": [
      "వినియోగ ప్రాజెక్టు",
      "ఉత్పాదక ప్రాజెక్టు",
      "సమస్యా ప్రాజెక్టు",
      "శిక్షణ ప్రాజెక్టు"
    ]
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
