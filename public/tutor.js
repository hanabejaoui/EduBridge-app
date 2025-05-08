// Listen for the browser to finish loading the HTML document
document.addEventListener('DOMContentLoaded', () => {
  // Once loaded, fetch and display new student requests
  loadStudentRequests();
  // Then fetch and display requests you've already accepted
  loadAcceptedRequests();
});

// Fetches and displays all unclaimed student requests
function loadStudentRequests() {
  // Call the backend API at /student-requests
  fetch('/student-requests')
    // Convert the response into a JavaScript object
    .then(res => res.json())
    // Handle the parsed list of requests
    .then(requests => {
      // Find the container element in the page
      const container = document.getElementById('requestsContainer');
      // Clear out any old content
      container.innerHTML = '';

      // If there are no requests, show a friendly message
      if (requests.length === 0) {
        container.innerHTML = '<p>No student requests right now.</p>';
        return;
      }

      // For each request...
      requests.forEach(post => {
        // Create a new DIV to hold it
        const div = document.createElement('div');
        // Add the .post styling class
        div.classList.add('post');
        // Fill in the HTML for subject, question, student name, and an Accept button
        div.innerHTML = `
          <strong>Subject:</strong> ${post.subject}<br>
          <strong>Question:</strong> ${post.description}<br>
          <small>From: ${post.name}</small><br>
          <button onclick="acceptRequest(${post.id})">Accept</button>
          <hr>
        `;
        // Add the new DIV into the container
        container.appendChild(div);
      });
    })
    // If the fetch fails, log an error
    .catch(err => console.error('Error loading student requests:', err));
}

// Sends a POST to claim a student request, then refreshes both lists
function acceptRequest(postId) {
  // Call the backend at /accept-request/:postId
  fetch(`/accept-request/${postId}`, { method: 'POST' })
    // After the call returns...
    .then(res => {
      // If successful...
      if (res.ok) {
        // Tell the tutor it worked
        alert('You accepted the request!');
        // Reload the lists to reflect the change
        loadStudentRequests();
        loadAcceptedRequests();
      } else {
        // Otherwise, show an error
        alert('Something went wrong accepting the request.');
      }
    })
    // If the network failed entirely, catch and log it
    .catch(err => {
      console.error('Error accepting request:', err);
      alert('Network error while accepting request.');
    });
}

// Fetches and displays the list of requests you’ve already accepted
function loadAcceptedRequests() {
  // Call the backend API at /accepted-requests
  fetch('/accepted-requests')
    // Parse the JSON response
    .then(res => res.json())
    // Handle the array of accepted posts
    .then(accepted => {
      // Find the container element
      const container = document.getElementById('acceptedContainer');
      // Clear any previous content
      container.innerHTML = '';

      // If none are accepted yet, show a placeholder message
      if (accepted.length === 0) {
        container.innerHTML = '<p>You haven’t accepted any requests yet.</p>';
        return;
      }

      // For each accepted request...
      accepted.forEach(post => {
        // Create a new post DIV
        const div = document.createElement('div');
        // Add the styling class
        div.classList.add('post');
        // Fill in subject, question, student's name, plus a textarea and Send button
        div.innerHTML = `
          <strong>Subject:</strong> ${post.subject}<br>
          <strong>Question:</strong> ${post.description}<br>
          <small>Student: ${post.student_name}</small><br><br>
          <textarea id="answer-${post.id}" rows="3" style="width:100%;" placeholder="Write your answer..."></textarea><br>
          <button onclick="sendAnswer(${post.id})">Send</button>
          <hr>
        `;
        // Append the DIV into its container
        container.appendChild(div);
      });
    })
    // Log any errors fetching the accepted list
    .catch(err => console.error('Error loading accepted requests:', err));
}

// Reads a tutor's answer and submits it to the server
function sendAnswer(postId) {
  // Find the textarea by its dynamic ID
  const textarea = document.getElementById(`answer-${postId}`);
  // Grab and trim the value the tutor entered
  const message = textarea.value.trim();

  // If the message is empty, prevent submission
  if (!message) {
    alert("Please write your answer before sending.");
    return;
  }

  // Send the answer via a URL-encoded POST
  fetch('/submit-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ postId, message })
  })
  // After the server responds...
  .then(res => {
    // If OK, notify and clear the textarea
    if (res.ok) {
      alert("Response sent!");
      textarea.value = '';
    } else {
      // Otherwise, show failure
      alert("Failed to send response.");
    }
  })
  // Catch network or other errors and log them
  .catch(err => {
    console.error('Error sending response:', err);
    alert("Error sending response.");
  });
}
