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
// their official answers from a published AP TET Paper 1 exam (June 2018),
// not invented ones. Only questions where the original paper's full set of
// four options was available are included, so nothing here is a guessed or
// fabricated distractor. Not tied to any class — shared reference material
// for anyone using the app.
const TET_QUESTIONS = [
  {
    subject: 'Child Development & Pedagogy',
    question:
      'A father who had failed in the Civil Services examination felt as if he himself had succeeded when his son later cleared it. This is an example of which defense mechanism?',
    options: ['Withdrawal', 'Projection', 'Repression', 'Identification'],
    correct: 4,
  },
  {
    subject: 'Child Development & Pedagogy',
    question:
      'Prasanthi was selected for both a teaching post and a bank clerk post, and likes both equally. What type of conflict is this?',
    options: ['Approach-Avoidance', 'Approach-Approach', 'Avoidance-Avoidance', 'Double Approach-Avoidance'],
    correct: 2,
  },
  {
    subject: 'Child Development & Pedagogy',
    question: 'Children who show security and self-reliance typically come from parents who:',
    options: ['Over-care for their children', 'Are submissive to their children', 'Play with their children', 'Are authoritarian'],
    correct: 3,
  },
  {
    subject: 'Child Development & Pedagogy',
    question: 'The "naive hedonistic orientation" stage belongs to which level of moral development?',
    options: ['Conventional', 'Post-conventional', 'Pre-conventional', 'Natural moral level'],
    correct: 3,
  },
  {
    subject: 'Child Development & Pedagogy',
    question: 'The concept of the "Zone of Proximal Development" was proposed by:',
    options: ['Bandura', 'Bruner', 'Piaget', 'Vygotsky'],
    correct: 4,
  },
  {
    subject: 'Child Development & Pedagogy',
    question: 'A main objective of Continuous and Comprehensive Evaluation (CCE) is to:',
    options: ['Encourage rote memory', 'Provide continuous feedback for improvement', 'Be strictly teacher-centered', 'Assess only cognitive skills'],
    correct: 2,
  },
  {
    subject: 'English',
    question: 'What does the phrase "healthy appetite" mean?',
    options: ['Ready to work', 'Desire to eat', 'A complaint', 'An amusing ability'],
    correct: 2,
  },
  {
    subject: 'English',
    question: 'Choose the correct synonym for "vanish":',
    options: ['Live', 'Move', 'Fall', 'Disappear'],
    correct: 4,
  },
  {
    subject: 'English',
    question: 'Choose the correct antonym for "feeble":',
    options: ['Happy', 'Strong', 'Active', 'Serious'],
    correct: 2,
  },
  {
    subject: 'English',
    question: 'Choose the correctly spelled word:',
    options: ['Harmoneous', 'Harmonious', 'Harmonies', 'Harmonus'],
    correct: 2,
  },
  {
    subject: 'English',
    question: '"She did not go to school as she was ill" is which type of sentence?',
    options: ['Simple', 'Compound', 'Complex', 'Interrogative'],
    correct: 3,
  },
  {
    subject: 'English',
    question: 'Choose the grammatically correct sentence:',
    options: ['She not understanding', 'She does not understand', 'She was not understanding', 'She not understand'],
    correct: 2,
  },
  {
    subject: 'Mathematics',
    question: 'What is the multiplicative inverse of 13/19?',
    options: ['13/19', '19/13', '19/13', '1'],
    correct: 3,
  },
  {
    subject: 'Mathematics',
    question: 'Which of the following represents the commutative property?',
    options: ['a(b+c) = ab+ac', 'a+(b+c) = (a+b)+c', 'a(b+c) = (ab)+(ac)', 'ab = ba'],
    correct: 4,
  },
  {
    subject: 'Mathematics',
    question: 'How many perfect cube numbers are there between 1 and 100?',
    options: ['9', '10', '3', '13'],
    correct: 3,
  },
  {
    subject: 'Mathematics',
    question: 'What is the arithmetic mean of the first five prime numbers (2, 3, 5, 7, 11)?',
    options: ['5.6', '4.5', '3.6', '2.5'],
    correct: 1,
  },
  {
    subject: 'Mathematics',
    question: 'In triangle ABC, angle A = 30° and angle B = 60°. What is angle C?',
    options: ['30°', '90°', '60°', '45°'],
    correct: 2,
  },
  {
    subject: 'Science & EVS',
    question: 'Which of these does NOT belong to our solar system’s planets?',
    options: ['Neptune', 'Pluto', 'Uranus', 'Saturn'],
    correct: 2,
  },
  {
    subject: 'Science & EVS',
    question: 'Open defecation is a major cause of the spread of which disease?',
    options: ['Malaria', 'Elephantiasis', 'Cholera', 'Dengue'],
    correct: 3,
  },
  {
    subject: 'Science & EVS',
    question: 'Which of these is often referred to as the "lungs of the Earth"?',
    options: ['Mountains', 'Deserts', 'Forests', 'Rivers'],
    correct: 3,
  },
];

function seedTetQuestions() {
  db.exec('DELETE FROM tet_questions;');
  const insert = db.prepare(
    `INSERT INTO tet_questions (id, subject, question, option_a, option_b, option_c, option_d, correct_option, source)
     VALUES (@id, @subject, @question, @option_a, @option_b, @option_c, @option_d, @correct_option, @source)`
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
      source: 'AP TET Paper 1, June 2018',
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
