document.addEventListener('DOMContentLoaded', () => {
    loadStudentRequests();
    loadAcceptedRequests();
  });
  
  // Load student requests
  function loadStudentRequests() {
    fetch('/student-requests')
      .then(res => res.json())
      .then(requests => {
        const container = document.getElementById('requestsContainer');
        container.innerHTML = '';
  
        if (requests.length === 0) {
          container.innerHTML = '<p>No student requests right now.</p>';
          return;
        }
  
        requests.forEach(post => {
          const div = document.createElement('div');
          div.classList.add('post');
          div.innerHTML = `
            <strong>Subject:</strong> ${post.subject}<br>
            <strong>Question:</strong> ${post.description}<br>
            <small>From: ${post.name}</small><br>
            <button onclick="acceptRequest(${post.id})">✅ Accept</button>
            <hr>
          `;
          container.appendChild(div);
        });
      });
  }
  
  // Accept request
  function acceptRequest(postId) {
    fetch(`/accept-request/${postId}`, {
      method: 'POST'
    }).then(res => {
      if (res.ok) {
        alert('🎉 You accepted the request!');
        loadStudentRequests();
        loadAcceptedRequests();
      } else {
        alert('⚠️ Something went wrong.');
      }
    });
  }
  
  // Load accepted requests
  function loadAcceptedRequests() {
    fetch('/accepted-requests')
      .then(res => res.json())
      .then(accepted => {
        const container = document.getElementById('acceptedContainer');
        container.innerHTML = '';
  
        if (accepted.length === 0) {
          container.innerHTML = '<p>You haven’t accepted any requests yet.</p>';
          return;
        }
  
        accepted.forEach(post => {
          const div = document.createElement('div');
          div.classList.add('post');
          div.innerHTML = `
            <strong>Subject:</strong> ${post.subject}<br>
            <strong>Question:</strong> ${post.description}<br>
            <small>Student: ${post.student_name}</small><br><br>
            <textarea id="answer-${post.id}" rows="3" style="width:100%;" placeholder="Write your answer..."></textarea><br>
            <button onclick="sendAnswer(${post.id})">Send</button>
            <hr>
          `;
          container.appendChild(div);
        });
      });
  }
  
  // Send response
  function sendAnswer(postId) {
    const textarea = document.getElementById(`answer-${postId}`);
    const message = textarea.value.trim();
  
    if (!message) {
      alert("📝 Please write your answer before sending.");
      return;
    }
  
    fetch('/submit-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ postId, message })
    })
      .then(res => {
        if (res.ok) {
          alert("✅ Response sent!");
          textarea.value = '';
        } else {
          alert("❌ Failed to send response.");
        }
      })
      .catch(err => {
        console.error(err);
        alert("⚠️ Error sending response.");
      });
  }
  