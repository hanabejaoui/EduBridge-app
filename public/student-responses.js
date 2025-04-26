// public/student-responses.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/my-responses')
      .then(res => res.json())
      .then(responses => {
        const container = document.getElementById('responsesContainer');
        container.innerHTML = '';
  
        if (responses.length === 0) {
          container.innerHTML = '<p>No tutor responses yet.</p>';
          return;
        }
  
        responses.forEach(resp => {
          const div = document.createElement('div');
          div.className = 'post';
          div.innerHTML = `
            <b>Subject:</b> ${resp.subject}<br>
            <b>Question:</b> ${resp.description}<br>
            <b>Answer:</b> ${resp.message}<br>
            <small><i>From Tutor:</i> ${resp.tutor_name}</small>
            <hr>
          `;
          container.appendChild(div);
        });
      });
  });
  