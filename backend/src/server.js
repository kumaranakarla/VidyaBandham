require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // ensures tables exist before routes run

const { seedIfEmpty } = require('./seed');
seedIfEmpty(); // on a host that wipes the database on restart, this keeps demo logins working

const authRoutes = require('./routes/auth');
const diaryRoutes = require('./routes/diary');
const homeworkRoutes = require('./routes/homework');
const studentsRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const feesRoutes = require('./routes/fees');
const tetRoutes = require('./routes/tet');
const tet2026Routes = require('./routes/tet2026');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Vidya Bandham API', time: new Date().toISOString() });
});

// Each router applies requireAuth/requireTeacher itself on the routes that need it.
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/tet', tetRoutes);
// Its own mount point, on purpose — see the comment at the top of
// routes/tet2026.js. The subscription/paywall check lives inside
// tet2026Routes itself (it needs to filter which questions come back, not
// just allow/deny the whole request), so there's nothing extra to wire up
// here beyond the sibling router below.
app.use('/api/tet-2026', tet2026Routes);
app.use('/api/subscription', subscriptionRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Vidya Bandham API listening on http://localhost:${PORT}`);
});
