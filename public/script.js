document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('postForm');
    const container = document.getElementById('postsContainer');
    const filterSelect = document.getElementById('filterSubject');
    const toggleBtn = document.getElementById('toggleMyPosts');
  
    let currentUserId = null;
    let showMyPostsOnly = false;
  
    // 🔐 Get current user ID from session
    fetch('/session')
      .then(res => res.json())
      .then(data => {
        currentUserId = data.userId;
        loadPosts();
      });
  
    // 🧾 Submit new post
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const post = {
        subject: document.getElementById('subject').value,
        description: document.getElementById('description').value,
        type: document.getElementById('type').value,
      };
  
      fetch('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      })
      .then(res => res.json())
      .then(() => {
        form.reset();
        loadPosts();
      });
    });
  
    // 🔍 Filter posts by subject + user
    function loadPosts() {
      const selectedSubject = filterSelect.value.toLowerCase();
  
      fetch('/posts')
        .then(res => res.json())
        .then(posts => {
          container.innerHTML = '';
          posts
            .filter(post => {
              const subjectMatches = !selectedSubject || post.subject.toLowerCase() === selectedSubject;
              const userMatches = !showMyPostsOnly || post.user_id === currentUserId;
              return subjectMatches && userMatches;
            })
            .forEach(post => {
              const div = document.createElement('div');
              div.className = 'post';
              div.innerHTML = `
              <strong>${post.type === 'offer' ? '🧑‍🏫 Tutor Offer' : '❓ Help Request'}</strong><br>
              <b>Subject:</b> ${post.subject}<br>
              <b>Description:</b> ${post.description}<br>
              <small>By: ${post.name}</small>
              ${post.user_id === currentUserId ? `<br><button onclick="deletePost(${post.id})">🗑️ Delete</button>` : ''}
              <hr>
            `;
            
              container.appendChild(div);
            });
        });
    }

    function deletePost(id) {
        fetch(`/posts/${id}`, {
          method: 'DELETE'
        }).then(() => loadPosts());
      }
      
  
    // 🔄 Listen for filter changes
    filterSelect.addEventListener('change', loadPosts);
  
    // 👤 Toggle My Posts view
    toggleBtn.addEventListener('click', () => {
      showMyPostsOnly = !showMyPostsOnly;
      toggleBtn.innerText = showMyPostsOnly ? '🔄 Show All Posts' : '👤 Show My Posts Only';
      loadPosts();
    });
  });
  