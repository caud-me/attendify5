const express = require('express')
const session = require('express-session')
const mysql = require('mysql2/promise')
const cron = require('node-cron');
const app = express()
const port = 3000

app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({extended: true}))
app.use(session({
    secret: 'npfnqh9op8f9wenfp49r38r4',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}))

const requireRole = (roles) => (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      console.error('[Attendify] Unauthorized access attempt');
      return res.redirect('/401');
    }
    next();
  };

function generatePassword(length) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

function toUsername(fullName) {
    return fullName
        .replace(/[^a-zA-Z\s]/g, '') // regex!!!
        .trim()
        .split(/\s+/) // regex-mini
        .map(name => name.toLowerCase())
        .join('.');
}

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Jamesros092607',
        // magkaiba tayo pasword
    database: 'attendify5',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
console.log('Attendify database is ready')

app.get('/', (req,res) => {
    if (req.session.user) {
        console.log(req.session.user)
        const redirectPaths = {
            teacher: '/instructors',
            guards: '/guards',
            admins: '/admins'
        }
        res.redirect(redirectPaths[req.session.user.role])
    } else {
        res.redirect('/home')
    }
})
// wassup lil nigger henry is a fucking nigga love nath and erron
app.post('/Login', async (req, res) => {
    const {username, password} = req.body
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username])
        if (rows[0] && rows[0].password === password) {
            req.session.user = rows[0] 
            req.session.save((err) => { 
                if (err) { return res.status(500).send("Internal Server Error")}

                const redirectPaths = {
                    teacher: '/instructors',
                    guard: '/guards',
                    admin: '/admins'
                }

                res.redirect(redirectPaths[req.session.user.role])
            })
            console.log('[Attendify] logged in as', req.session.user.username)
        } else {
            res.send(`Invalid credentials <a href='/home'>Go back.</a>`)
        }
    } catch (error) {
        console.error("[Attendify] Database error:", error)
    }
})

// static pages
app.get('/401', (req, res) => {res.sendFile(__dirname + '/public/401.html')})
app.get('/home', (req, res) => {res.sendFile(__dirname + '/public/index.html')})
app.get('/checklists', (req, res) => {res.sendFile(__dirname + '/public/checklists.html')})
app.get('/welcome', (req, res) => {res.sendFile(__dirname + '/public/immersive-area.html')})

// role protected pages
app.get('/instructors', requireRole(['teacher']), (req, res) => { res.sendFile(__dirname + '/public/instructors.html')})
app.get('/guards', requireRole(['guard']), (req, res) => { res.sendFile(__dirname + '/public/guards.html')})
app.get('/admins', requireRole(['admin']), (req, res) => { res.sendFile(__dirname + '/public/admins.html')})

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/instructors/me', requireRole(['teacher']), async (req, res) => {
    const $instructor_username = req.session.user.username

    const [me_fullname] = await pool.execute(`
        SELECT full_name FROM users WHERE username = ?
    `, [$instructor_username]); 

    const [me_schedule] = await pool.execute(`
        SELECT 
            c.course_name, 
            class_meeting.grade_section,
            class_meeting.day,  -- Using the actual column name "day"
            class_meeting.start_time, 
            class_meeting.end_time
        FROM 
            classes AS class_meeting
        JOIN 
            courses AS c ON class_meeting.course_code = c.course_code
        WHERE 
            class_meeting.teacher_username = ?
        ORDER BY 
            FIELD(class_meeting.day, 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'),  -- Using the actual column name "day"
            class_meeting.start_time;
        `, [$instructor_username])

    const result = {
        fullname: me_fullname,
        schedule: me_schedule
    }

    res.json(result);
})
app.get('/instructors/ongoing', async (req, res) => {
    const username = req.session.user.username;
    // hardcode for testing
    // const dateString = req.query.date || '2025-02-10';
    // const timeString = req.query.time || '17:00:00';

    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // e.g., '2025-02-02'
    const timeString = now.toTimeString().split(' ')[0]; // e.g., '00:51:00'

    const date = new Date(dateString + 'T' + timeString);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const currentTime = timeString;

    try { // Important: Wrap the database operations in a try...catch block
        const [ongoing_class] = await pool.execute(
            `SELECT 
                cm.class_id,
                c.course_name AS subject,
                cm.grade_section,
                cm.start_time,
                cm.end_time
            FROM classes cm
            JOIN courses c ON cm.course_code = c.course_code
            WHERE cm.teacher_username = ? 
                AND cm.day = ? 
                AND ? BETWEEN cm.start_time AND cm.end_time`,
            [username, dayName, currentTime]
        );

        if (ongoing_class.length === 0) {  // Check if a class was found
            return res.status(404).json({ message: 'No ongoing class found.' }); // Return 404 if not found
        }

        const class_id = ongoing_class[0].class_id; // Now it's safe to access index 0

        const [ongoing_students] = await pool.execute(
            `SELECT 
                s.student_id,
                s.full_name,
                s.grade_section, 
                a.status,
                a.time_in
            FROM students s
            JOIN student_classes sc ON s.student_id = sc.student_id
            LEFT JOIN attendance a ON s.student_id = a.student_id AND a.class_id = ? AND a.attendance_date = ?
            WHERE sc.class_id = ?
            ORDER BY CASE WHEN s.grade_section IS NULL THEN 1 ELSE 0 END, s.grade_section;`,
            [class_id, dateString, class_id]
        );

        const studentsWithStatus = ongoing_students.map(student => ({
            ...student, // Spread the existing student properties
            status: student.status || 'absent', // Default to 'absent' if no record
            time_in: student.time_in ? student.time_in.toString() : null // Format time or null
        }));


        const result = {
            class: ongoing_class[0], // Send only the first class object, not the whole array
            students: studentsWithStatus
        };

        res.json(result);

    } catch (error) {  // Handle any errors during the database operations
        console.error("Error fetching ongoing class:", error); // Log the error for debugging
        res.status(500).json({ message: 'Internal Server Error' }); // Send a 500 response
    }
});
app.post('/instructors/update_status', async (req, res) => {
    const { student_id, status, class_id } = req.body; // Get class_id from req.body
    console.log("Received:", { student_id, status, class_id });s
    const dateString = '2025-01-27';

    try {
        const [result] = await pool.execute(`
            UPDATE attendance 
            SET status = ? 
            WHERE student_id = ? 
              AND attendance_date = ? 
              AND class_id = ? 
        `, [status, student_id, dateString, class_id]);

        console.log("MySQL Result:", result);
        res.json({ message: 'Status updated successfully' });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

app.get('/guards/me', requireRole(['guard']), async (req, res) => {
    const $guard_username = req.session.user.username

    const [me_fullname] = await pool.execute(`
        SELECT full_name, role FROM users WHERE username = ?
    `, [$guard_username]); 

    const result = {
        fullname: me_fullname
    }

    res.json(result);
})

app.get('/admins/me', requireRole(['admin']), async (req, res) => {
    const $admin_username = req.session.user.username

    const [me_fullname] = await pool.execute(`
        SELECT full_name, role FROM users WHERE username = ?
    `, [$admin_username]); 

    const result = {
        fullname: me_fullname
    }

    res.json(result);
})

app.listen(port, () => {
    console.log(`Attendify is now running on http://localhost:${port}/`)
})

app.use(express.static('public'))

app.get('/admins/api', requireRole(['admin']), async (req, res) => {
    const [users] = await pool.execute(`
        SELECT * FROM users
    `)
    const [students] = await pool.execute(`
        SELECT * FROM students
    `) 
    const [student_classes] = await pool.execute(`
        SELECT * FROM student_classes
    `)
    const [courses] = await pool.execute(`
        SELECT * FROM courses
    `) 
    const [classes] = await pool.execute(`
        SELECT * FROM classes
    `) 
    const [attendance_history] = await pool.execute(`
        SELECT * FROM attendance_history
    `)
    const [attendance] = await pool.execute(`
        SELECT * FROM attendance
    `) 

    const result = {
        admin_users: users,
        admin_students: students,
        admin_student_classes: student_classes,
        admin_courses: courses,
        admin_classes: classes,
        admin_attendance_history: attendance_history,
        admin_attendance: attendance
    }

    res.json(result);
})

app.post('/admins/createGuard', requireRole(['admin']), async (req, res) => {
    const {fullname} = req.body;

    const username = toUsername(fullname);
    const password = generatePassword(12);

    try {
        const [result] = await pool.execute(
            `INSERT INTO users (username, full_name, password, role) VALUES (?, ?, ?, ?)`,
            [username, fullname, password, 'guard']
        );
    
        res.json({ message: 'User created', fullname, password });
        console.log(`[Attendify] Admin created guard ${username}`)
    } catch (error) {
        res.json({ message: 'Either duplicate entry, or something is wrong'});
    }
});

app.post('/admins/createTeacher', requireRole(['admin']), async (req, res) => {
    const {fullname} = req.body;

    const username = toUsername(fullname);
    const password = generatePassword(12);

    try {
        const [result] = await pool.execute(
            `INSERT INTO users (username, full_name, password, role) VALUES (?, ?, ?, ?)`,
            [username, fullname, password, 'teacher']
        );
    
        res.json({ message: 'User created', fullname, password });
        console.log(`[Attendify] Admin created teacher ${username}`)
    } catch (error) {
        res.json({ message: 'Either duplicate entry, or something is wrong'});
    }
});

app.post('/admins/createAdmin', requireRole(['admin']), async (req, res) => {
    const {fullname} = req.body;

    const username = toUsername(fullname);
    const password = generatePassword(12);

    try {
        const [result] = await pool.execute(
            `INSERT INTO users (username, full_name, password, role) VALUES (?, ?, ?, ?)`,
            [username, fullname, password, 'admin']
        );
    
        res.json({ message: 'User created', fullname, password });
        console.log(`[Attendify] Admin created admin ${username}`)
    } catch (error) {
        res.json({ message: 'Either duplicate entry, or something is wrong'});
    }
});

app.post('/admins/addCourse', requireRole(['admin']), async (req, res) => {
    const {coursecode, coursename} = req.body;

    try {
        const [result] = await pool.execute(
            `INSERT INTO courses (course_code, course_name) VALUES (?, ?)`,
            [coursecode, coursename]
        );
    
        res.json({ message: 'Course Created'});
        console.log(`[Attendify] Admin created course ${coursecode, coursename}`)
        console.log(`[Attendify] ${coursecode, coursename} requires an instructor, set up by adding a class`)
    } catch (error) {
        res.json({ message: 'Either duplicate entry, or something is wrong'});
    }
});

/* <input type="text" name="coursecode" placeholder="e.g. SHS1000" required><br>
<small>For Grade Section?</small><br>
<input type="text" name="gradesection" placeholder="e.g. 12-STEM" required><br>
<small>Whos the Instructor for this course?</small><br>
<input type="text" name="username" placeholder="e.g. johnny.appleseed" required><br>
<h3>Schedule</h3>
<small>Day of class</small><br>
<select name="day" title="day">
    <option value="Mon" default>Mon</option>
    <option value="Tue">Tue</option>
    <option value="Wed">Wed</option>
    <option value="Thu">Thu</option>
    <option value="Fri">Fri</option>
</select><br>
<small>Start Time</small><br>
<input type="text" name="starttime" placeholder="e.g. 10:30" required><br>
<small>End Time</small><br>
<input type="text" name="endtime" placeholder="e.g. 10:30" required><br> */

app.post('/admins/addClass', requireRole(['admin']), async (req, res) => {
    const { coursecode, gradesection, username, day, starttime, endtime } = req.body;

    // generate class_id in the format:: grade_section-course_code-day-start_time
    const CLASSID = `${gradesection}-${coursecode}-${day.toUpperCase()}-${starttime.replace(':', '')}`;

    const pattern = /^\d{2}-[A-Z]+-[A-Z0-9]+-[A-Z]{3}-\d{4}$/;

    // validation regex!!!!
    if (!pattern.test(CLASSID)) {
        console.log(CLASSID)
        return res.status(400).json({ message: 'Invalid class_id format. Follow: 12-MAWD-APPLIED1006-MON-0900' });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO classes (class_id, course_code, grade_section, teacher_username, day, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [CLASSID, coursecode, gradesection, username, day, starttime, endtime]
        );

        res.json({ message: 'Class Created', class_id: CLASSID });
        console.log(`[Attendify] Admin created class ${CLASSID}`);
        console.log(`[Attendify] ${username} is now incharge of course ${coursecode}`)
    } catch (error) {
        console.error(error);
        res.json({ message: 'Either duplicate entry, or something is wrong' });
    }
});

app.post('/admins/createStudent', requireRole(['admin']), async (req, res) => {
    const { student_id, full_name, rfid, is_regular, grade_section, guardian_contact, class_ids } = req.body;
    const profile_image = req.file ? req.file.filename : null; // Handle file upload if applicable

    try {
        console.log(`[Attendify] Attempting to create student: ${full_name} (${student_id})`);

        // Check if RFID already exists
        const [existingStudent] = await pool.execute(`SELECT * FROM students WHERE rfid = ?`, [rfid]);
        if (existingStudent.length > 0) {
            console.log(`[Attendify] RFID conflict: ${rfid} already exists.`);
            return res.status(400).json({ message: 'RFID already exists' });
        }

        // Insert student into database
        await pool.execute(
            `INSERT INTO students (student_id, full_name, rfid, is_regular, grade_section, profile_image, guardian_contact) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [student_id, full_name, rfid, is_regular, is_regular == 1 ? grade_section : null, profile_image, guardian_contact]
        );

        console.log(`[Attendify] Student created: ${full_name} (${student_id})`);

        if (is_regular == 1) {
            // Auto-enroll regular students in their grade section courses
            const [classes] = await pool.execute(`SELECT class_id FROM classes WHERE grade_section = ?`, [grade_section]);
            for (const cls of classes) {
                await pool.execute(
                    `INSERT INTO student_classes (student_id, class_id, enrollment_type, enrollment_date) VALUES (?, ?, 'preset', CURDATE())`,
                    [student_id, cls.class_id]
                );
                console.log(`[Attendify] Auto-enrolled ${full_name} in class ${cls.class_id}`);
            }
        } else {
            // Manually enroll irregular students in selected classes
            if (class_ids && class_ids.length > 0) {
                const values = class_ids.map(class_id => [student_id, class_id, 'manual', new Date()]);
                await pool.query(`INSERT INTO student_classes (student_id, class_id, enrollment_type, enrollment_date) VALUES ?`, [values]);
                console.log(`[Attendify] Manually enrolled ${full_name} in ${class_ids.length} classes`);
            }

            console.log(`[Attendify] Irregular student enrollment completed. Available classes can be fetched from '/admins/api'`);
        }

        res.json({ message: 'Student Enrolled Successfully' });
        console.log(`[Attendify] Enrollment completed: ${full_name} (${student_id})`);

    } catch (error) {
        console.error(`[Attendify] Error enrolling student:`, error);
        res.status(500).json({ message: 'Error enrolling student' });
    }
});

app.post('/admins/resetDatabase', requireRole(['admin']), async (req, res) => {
    const { password } = req.body;

    try {
        console.log(`[Attendify] Reset database request received`);


        if (password !== process.env.ADMIN_RESET_PASSWORD) {
            console.log(`[Attendify] Reset database failed: Incorrect password`);
            return res.status(403).json({ message: 'Incorrect password' });
        }


        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');


        const tables = ['student_classes', 'students', 'classes', 'users', 'courses', 'attendance_history', 'attendance']; 
        for (const table of tables) {
            await pool.execute(`TRUNCATE TABLE ${table}`);
            console.log(`[Attendify] Cleared table: ${table}`);
        }

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log(`[Attendify] Database reset successfully`);
        res.json({ message: 'Database reset successfully' });

    } catch (error) {
        console.error(`[Attendify] Error resetting database:`, error);
        res.status(500).json({ message: 'Error resetting database' });
    }
});

async function prefillAttendance() {
    try {
        console.log(`[Attendify] Starting attendance prefill process at ${new Date().toISOString()}`);

        // 1. Archive current attendance records into attendance_history
        const archiveQuery = `
            INSERT INTO attendance_history (attendance_id, student_id, class_id, attendance_date, status, time_in, time_out, recorded_by)
            SELECT attendance_id, student_id, class_id, attendance_date, status, time_in, time_out, recorded_by
            FROM attendance
        `;
        await pool.execute(archiveQuery);
        console.log(`[Attendify] Archived attendance records to history.`);

        // 2. Truncate the attendance table
        await pool.execute(`TRUNCATE TABLE attendance`);
        console.log(`[Attendify] Attendance table truncated.`);

        // 3. Prefill attendance for today's classes
        //    Note: The classes table has a 'day' column (enum: 'Mon','Tue','Wed','Thu','Fri').
        //          DATE_FORMAT(CURDATE(), '%a') returns a three-letter abbreviation (e.g., 'Mon') that matches.
        const prefillQuery = `
            INSERT INTO attendance (student_id, class_id, attendance_date, status, recorded_by)
            SELECT sc.student_id, cm.class_id, CURDATE(), 'absent', 'system'
            FROM student_classes sc
            JOIN classes cm ON sc.class_id = cm.class_id
            WHERE cm.day = DATE_FORMAT(CURDATE(), '%a')
              AND sc.enrollment_type IN ('preset', 'manual')
              AND NOT EXISTS (
                  SELECT 1 FROM attendance a
                  WHERE a.student_id = sc.student_id 
                    AND a.class_id = cm.class_id 
                    AND a.attendance_date = CURDATE()
              )
        `;
        await pool.execute(prefillQuery);
        console.log(`[Attendify] Attendance prefilled for ${new Date().toISOString()}.`);

    } catch (error) {
        console.error(`[Attendify] Error during attendance prefill process:`, error);
    }
}

cron.schedule('0 0 * * *', () => {
    console.log(`[Attendify] Cron job triggered at ${new Date().toISOString()}.`);
    prefillAttendance();
});
const cronTasks = cron.getTasks();

console.log(`[Attendify] Is cron running and listening?`, cronTasks.size > 0 ? 'Yes' : 'No');
