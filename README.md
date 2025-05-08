EduBridge is a student help platform connecting learners with qualified tutors for on demand academic support.

1. Problem: 
 Students struggle to find timely, subject specific help, tutors lack an easy way to connect with those who need them.
 2. Solution: 
 EduBridge lets students submit questions and instantly matches them with tutors who have the right expertise.

 3. Tech Stack:
 Backend: Node.js, Express ----> API server,routing business logic
 Database: SQLite ----> Lightweight, file-based data storage
 Frontend: HTML, CSS, JS ----> Responsive UI client-side interactivity

 4. Installation and Setup
 * Clone repository: 
 git clone https://github.com/hanabejaoui EduBridge-app.git
 cd EduBridge-app
 * Install dependencies:
 npm install
 * Start server (auto-creates database):
 node server.js
 * Open in browser: http://localhost:3000

 5. Usage: 

 * Student: Register, ask a question, view answers.
 * Tutors:  Register, select subjects, accept student requests, send responses.
 6. System and architecture:
 Browser <--> Express API <--> SQLite database
 * Browser <--> Express API:
 Your web browser (the “client”) runs the HTML/CSS/JS front‑end. Whenever it needs data (e.g. “give me the list of posts”) it does a fetch (an HTTP request) to the Express server (the “API”). Express receives that request, runs whatever JavaScript logic you wrote, and returns JSON.
 * Express API <--> SQLite database:
 Inside your Express code you use SQL commands to read and write data in the SQLite file (e.g. create a new question, look up all questions, record a tutor’s response). SQLite stores everything in a single file on disk (tutor.db), so it’s very simple to deploy.

 Note: 
- Your HTML, CSS and client‑side JavaScript live in a folder called public. When the browser first loads the page (e.g. goes to /dashboard.html), Express simply sends those static files.
- The user’s browser loads your front‑end assets. The front end uses fetch() to call endpoints like /posts, /session, /student-requests, /accept-request/:id, /submit-response, etc. Express handles each route by talking to SQLite (CRUD operations) and then returns JSON success/failure or data. The front end JS takes that JSON and updates the page dynamically.

