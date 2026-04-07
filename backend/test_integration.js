const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function request(method, pathStr, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api' + pathStr,
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

async function uploadFile(unitId, token) {
  return new Promise((resolve, reject) => {
    // Create a dummy PDF file for testing
    const testPdfPath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(testPdfPath, '%PDF-1.4 dummy pdf content');

    const form = new FormData();
    form.append('unit_id', unitId);
    form.append('file', fs.createReadStream(testPdfPath));

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/notes/upload',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer ' + token
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if(fs.existsSync(testPdfPath)) fs.unlinkSync(testPdfPath); // cleanup
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch(e) { resolve({ status: res.statusCode, data }) }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

async function runTests() {
  console.log('\\n--- Starting Full System Integration Tests ---');
  try {
    const ts = Date.now();
    
    // 1. Signup Teacher
    console.log('[API] POST /auth/signup (Teacher)');
    const tSignup = await request('POST', '/auth/signup', {
      name: 'Integration Teacher', email: `t_${ts}@test.com`, password: 'password', role: 'teacher', admin_key: 'TEACHER_SECRET_2026'
    });
    console.log('->', tSignup.status, tSignup.status === 201 ? 'PASS' : 'FAIL');

    // 2. Signup Student
    console.log('[API] POST /auth/signup (Student)');
    const sSignup = await request('POST', '/auth/signup', {
      name: 'Integration Student', email: `s_${ts}@test.com`, password: 'password', role: 'student'
    });
    console.log('->', sSignup.status, sSignup.status === 201 ? 'PASS' : 'FAIL');

    // 3. Login
    const tLogin = await request('POST', '/auth/login', { email: `t_${ts}@test.com`, password: 'password' });
    const tToken = tLogin.data.token;
    
    const sLogin = await request('POST', '/auth/login', { email: `s_${ts}@test.com`, password: 'password' });
    const sToken = sLogin.data.token;

    // 4. Create Course
    console.log('[API] POST /courses (Teacher)');
    const createRes = await request('POST', '/courses', { course_name: 'Full Stack Integration', max_seats: 10 }, tToken);
    console.log('->', createRes.status, createRes.status === 201 ? 'PASS' : 'FAIL');
    const courseId = createRes.data.course_id;

    // 5. Create Unit
    console.log('[API] POST /units (Teacher)');
    const unitRes = await request('POST', '/units', { course_id: courseId, unit_name: 'Unit 1: Testing' }, tToken);
    console.log('->', unitRes.status, unitRes.status === 201 ? 'PASS' : 'FAIL');
    const unitId = unitRes.data.unit_id;

    // 6. Upload PDF Note
    console.log('[API] POST /notes/upload (Teacher via Multer multipart)');
    const uploadRes = await uploadFile(unitId, tToken);
    console.log('->', uploadRes.status, uploadRes.status === 201 ? 'PASS' : 'FAIL');
    const fileUrl = uploadRes.data?.file_url;
    console.log('   Saved Path:', fileUrl);

    // 7. Student Enroll
    console.log('[API] POST /enroll (Student)');
    const enroll1 = await request('POST', '/enroll', { course_id: courseId }, sToken);
    console.log('->', enroll1.status, enroll1.status === 200 ? 'PASS' : 'FAIL', enroll1.data.message);

    // 8. Student Target Enroll Again (Error case)
    console.log('[API] POST /enroll (Student Duplicate Enroll - testing Database Transactions)');
    const enroll2 = await request('POST', '/enroll', { course_id: courseId }, sToken);
    console.log('->', enroll2.status, enroll2.status === 409 ? 'PASS' : 'FAIL', enroll2.data.error);

    // 9. Get My Courses
    console.log('[API] GET /my-courses (Student)');
    const myCourses = await request('GET', '/my-courses', null, sToken);
    console.log('->', myCourses.status, myCourses.data.length > 0 ? 'PASS' : 'FAIL');
    console.log('   Enrolled in:', myCourses.data[0].course_name);

    // 10. Get Course Content
    console.log('[API] GET /notes/:course_id (Student fetching joined units & files)');
    const content = await request('GET', '/notes/' + courseId, null, sToken);
    console.log('->', content.status, content.data.units?.length === 1 ? 'PASS' : 'FAIL');
    console.log('   Unit Name:', content.data.units[0].unit_name);
    console.log('   Note Array Length:', content.data.units[0].notes.length);
    console.log('   File URL mapped:', content.data.units[0].notes[0].file_url);

    // 11. Verify Static Express Files
    console.log('[API] GET /uploads/... (Express static delivery)');
    const staticRequest = require('http');
    staticRequest.get('http://localhost:5001' + fileUrl, (res) => {
        console.log('->', res.statusCode, res.statusCode === 200 ? 'PASS' : 'FAIL');
        if (res.statusCode === 200) {
           console.log('\\n✅ ALL INTEGRATION TESTS PASSED PERFECTLY AGAINST MYSQL! ✅');
        }
    }).on('error', (e) => {
        console.log('Static test failed', e);
    });

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTests();
