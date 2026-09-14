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
      source: `AP TET Paper 1, June ${q.year}`,
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
