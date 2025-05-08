document.addEventListener('DOMContentLoaded', () => {
   // — When the page has fully loaded, run everything inside this function.
    const form = document.getElementById('postForm');
    const container = document.getElementById('postsContainer');
    const filterSelect = document.getElementById('filterSubject');
    const toggleBtn = document.getElementById('toggleMyPosts');
  
  // We’ll store the current user’s ID here once we fetch it.
    let currentUserId = null;

  // This flag controls whether we show only the user’s own posts or all posts.
    let showMyPostsOnly = false;
  
      // — Ask the server “who am I?” to learn the current user’s ID.
    fetch('/session')
      .then(res => res.json()) // Convert the server’s reply into a JavaScript object
      .then(data => {
        currentUserId = data.userId; // Remember our user ID
        loadPosts();    // And then load the list of posts
      });
  
    // — When the “new post” form is submitted:
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop the browser from reloading the page

   // Build a “post” object from the three form fields
      const post = {
        subject: document.getElementById('subject').value, // Which subject to show
        description: document.getElementById('description').value,
        type: document.getElementById('type').value,
      };
  // Send that object to the server to create a new post
      fetch('/posts', {
        method: 'POST',  // We are creating data
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(post) // Turn our object into JSON text
      })
      .then(res => res.json())  // Read back the server’s response
      .then(() => {
        form.reset(); // Clear the form fields
        loadPosts();  // Refresh the list so the new post appears
      });
    });
  
    
     // — This function fetches and displays posts according to the current filter settings:
  function loadPosts() {
    const selectedSubject = filterSelect.value.toLowerCase();  // Which subject to show

    fetch('/posts')                       // Ask server for all posts
      .then(res => res.json())            // Parse JSON list
      .then(posts => {
        container.innerHTML = '';         // Clear out whatever was showing

        posts
          .filter(post => {
            // Decide if this post matches the selected subject
            const subjectMatches = !selectedSubject || post.subject.toLowerCase() === selectedSubject;
            // Decide if this post matches our “only my posts” toggle
            const userMatches = !showMyPostsOnly || post.user_id === currentUserId;
            // Only keep posts that match both rules
            return subjectMatches && userMatches;
          })
          .forEach(post => {
            // For each remaining post, build a little card
            const div = document.createElement('div');
            div.className = 'post';
            div.innerHTML = `
              <strong>${post.type === 'offer' ? ' Tutor Offer' : '❓ Help Request'}</strong><br>
              <b>Subject:</b> ${post.subject}<br>
              <b>Description:</b> ${post.description}<br>
              <small>By: ${post.name}</small>
              ${post.user_id === currentUserId
                ? `<br><button onclick="deletePost(${post.id})"> Delete</button>`
                : ''}
              <hr>
            `;
            container.appendChild(div);   // And add it into the page
          });
      });
  }

  // — Remove a post by ID, then reload the list
  function deletePost(id) {
    fetch(`/posts/${id}`, { method: 'DELETE' })
      .then(() => loadPosts());
  }

  // — When the subject filter dropdown changes, reload the list
  filterSelect.addEventListener('change', loadPosts);

  // — When the “toggle my posts” button is clicked:
  toggleBtn.addEventListener('click', () => {
    // Flip our flag between true/false
    showMyPostsOnly = !showMyPostsOnly;
    // Update the button text to match the new state
    toggleBtn.innerText = showMyPostsOnly ? 'Show All Posts' : 'Show My Posts Only';
    loadPosts();  // Reload with the new filter
  });
});
