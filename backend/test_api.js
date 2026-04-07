const http = require('http');

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch(e) { resolve({ status: res.statusCode, data }) }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Tests ---');
  try {
    // 1. Signup Teacher
    console.log('1. Signing up teacher...');
    const tSignup = await request('POST', '/auth/signup', {
      name: 'Test Teacher', email: 't1@test.com', password: 'password', role: 'teacher', admin_key: 'TEACHER_SECRET_2026'
    });
    console.log('Teacher signup:', tSignup.status, tSignup.data);

    // 2. Signup Student
    console.log('2. Signing up student...');
    const sSignup = await request('POST', '/auth/signup', {
      name: 'Test Student', email: 's1@test.com', password: 'password', role: 'student'
    });
    console.log('Student signup:', sSignup.status, sSignup.data);

    // 3. Login Teacher
    const tLogin = await request('POST', '/auth/login', { email: 't1@test.com', password: 'password' });
    const tToken = tLogin.data.token;
    
    // 4. Login Student
    const sLogin = await request('POST', '/auth/login', { email: 's1@test.com', password: 'password' });
    const sToken = sLogin.data.token;

    // 5. Teacher creates a course
    console.log('5. Teacher creating course...');
    const createRes = await request('POST', '/courses', { course_name: 'Live Node.js Testing', max_seats: 5 }, tToken);
    console.log('Create course:', createRes.status, createRes.data);
    const courseId = createRes.data.course_id;

    // 6. Student enrolls
    console.log('6. Student enrolling in course...');
    const enroll1 = await request('POST', '/enroll', { course_id: courseId }, sToken);
    console.log('Enroll 1:', enroll1.status, enroll1.data);

    // 7. Student enrolls AGAIN (should fail)
    console.log('7. Student enrolling AGAIN...');
    const enroll2 = await request('POST', '/enroll', { course_id: courseId }, sToken);
    console.log('Enroll 2:', enroll2.status, enroll2.data);

    // 8. Fetch My Courses
    console.log('8. Fetching my courses...');
    const myCourses = await request('GET', '/my-courses', null, sToken);
    console.log('My courses:', myCourses.status);
    console.dir(myCourses.data, { depth: null });

    // 9. Fetch All Courses (verify decrement)
    console.log('9. Fetching all courses to verify seats...');
    const allCourses = await request('GET', '/courses', null, sToken);
    const target = allCourses.data.find(c => c.course_id === courseId);
    console.log(`Course seats: ${target.available_seats} / ${target.max_seats} (Should be 4 / 5)`);

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTests();
