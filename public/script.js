
let currentVlogData = {};
// Load all vlogs (both example and uploaded)
async function loadAllVlogs() {
  const vlogContainer = document.getElementById("vlogContainer");
  if (!vlogContainer) return;

  try {
    // First show example vlogs
    vlogContainer.innerHTML = exampleVlogs.map((v, index) => {
      const vlogId = `example_${index}`;
      currentVlogData[vlogId] = v;
      return `
      <div class="vlog-card fade-in">
        <img src="${v.img}" alt="${v.title}">
        <div class="vlog-info">
          <h3>${v.title}</h3>
          <p>${v.desc}</p>
          <span class="tag ${v.tag}">${v.tag}</span>
          <button class="read-btn" onclick="showExampleVlogDetails('${vlogId}'); event.stopPropagation();">📖 Read Blog</button>
        </div>
      </div>`;
    }).join('');

    // Then fetch and append real vlogs
    const res = await fetch('http://localhost:3000/vlogs');
    const vlogs = await res.json();

    if (vlogs && vlogs.length > 0) {
      vlogContainer.innerHTML += vlogs.map(v => {
        currentVlogData[v.id] = v;
        return `
        <div class="vlog-card fade-in">
          <img src="${v.image}" alt="${v.title}">
          <div class="vlog-info">
            <h3>${v.title}</h3>
            <div class="vlog-content">
              ${v.content ? `
                <div class="content-preview">${v.content.substring(0, 150)}...</div>
              ` : `<p>${v.description}</p>`}
            </div>
            <div class="vlog-meta">
              <span class="tag">by ${v.username}</span>
              <span class="date">${new Date(v.timestamp).toLocaleDateString()}</span>
            </div>
            <button class="read-btn" onclick="showVlogDetails('${v.id}'); event.stopPropagation();">📖 Read Blog</button>
          </div>
        </div>
      `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading vlogs:', err);
  }
}

function showExampleVlogDetails(vlogId) {
  if (!document.getElementById('vlogModal')) {
    createVlogModal();
  }

  const vlog = currentVlogData[vlogId];
  if (!vlog) {
    console.error('Example vlog not found:', vlogId);
    return;
  }

  const modal = document.getElementById('vlogModal');
  document.getElementById('modalTitle').textContent = vlog.title;
  document.getElementById('modalImage').src = vlog.img;
  document.getElementById('modalAuthor').textContent = `📁 Example Vlog`;
  document.getElementById('modalDate').textContent = '---';
  document.getElementById('modalDescriptionText').textContent = vlog.desc;
  document.getElementById('modalFullContent').innerHTML = `<p>${vlog.desc}</p>`;

  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Call loadAllVlogs when the page loads
if (document.getElementById("vlogContainer")) {
  loadAllVlogs();
}

// Ensure form elements exist at top-level so later checks don't throw ReferenceError
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const uploadForm = document.getElementById('uploadForm');
const uploadFormHasInlineHandler = uploadForm && uploadForm.dataset.inlineHandler === 'true';

// Scroll animation
const cards = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
});
cards.forEach(c => observer.observe(c));

// Show full content when clicking Read More
function showFullContent(button) {
  const fullContent = decodeURIComponent(button.getAttribute('data-full-content'));
  const contentPreview = button.previousElementSibling;
  if (button.textContent === 'Read More') {
    contentPreview.innerHTML = fullContent;
    button.textContent = 'Show Less';
  } else {
    contentPreview.innerHTML = fullContent.substring(0, 150) + '...';
    button.textContent = 'Read More';
  }
}

// --- LOGIN / SIGNUP SYSTEM (temporary local storage) ---
document.addEventListener('DOMContentLoaded', () => {

  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = document.getElementById('signupUser').value;
      const email = document.getElementById('signupEmail').value;
      const pass = document.getElementById('signupPass').value;

      localStorage.setItem('userData', JSON.stringify({ user, email, pass }));
      alert('Account created successfully! Now you can login.');
      window.location.href = 'login.html';
    });
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = document.getElementById('loginUser').value;
      const pass = document.getElementById('loginPass').value;
      const stored = JSON.parse(localStorage.getItem('userData'));

      if (stored && user === stored.user && pass === stored.pass) {
        localStorage.setItem('loggedInUser', user);
        alert('Login successful!');
        window.location.href = 'profile.html';
      } else {
        alert('Invalid username or password.');
      }
    });
  }

  // Upload form (noop when inline handler already present)
  if (uploadForm && !uploadFormHasInlineHandler) {
    uploadForm.addEventListener('submit', e => {
      e.preventDefault();
      const loggedIn = localStorage.getItem('loggedInUser');
      if (!loggedIn) {
        alert('Please create an account or login first to publish your vlog.');
        window.location.href = 'signup.html';
        return;
      }
      alert('Your vlog has been published successfully! (Feature will be live soon)');
    });
  }
});
// Signup form
if (signupForm) {
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('signupUser').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPass').value;

    try {
      const res = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (data.success) {
        alert(' Account created successfully! Now login with your email.');
        window.location.href = 'login.html';
      } else {
        alert('' + (data.message || 'Signup failed'));
      }
    } catch (err) {
      alert('Error during signup');
      console.error(err);
    }
  });
}

// Login form
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('loggedInUser', data.username);
        localStorage.setItem('loggedInEmail', email);
        alert(' Login successful!');
        window.location.href = 'profile.html';
      } else {
        alert('' + (data.message || 'Login failed'));
      }
    } catch (err) {
      alert('Error during login');
      console.error(err);
    }
  });
}

// Upload form
if (uploadForm && !uploadFormHasInlineHandler) {
  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    const loggedIn = localStorage.getItem('loggedInUser');
    if (!loggedIn) {
      alert('Please login first');
      window.location.href = 'login.html';
      return;
    }

    const formData = new FormData();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const imageInput = document.getElementById('imageUpload');
    const content = document.getElementById('vlogEditor') ? document.getElementById('vlogEditor').innerHTML : '';

    if (!imageInput || !imageInput.files[0]) {
      alert('Please select an image file');
      return;
    }

    // Create FormData with all fields
    formData.append('username', loggedIn);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content', content);
    formData.append('image', imageInput.files[0]);

    try {
      const res = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        alert('Vlog uploaded successfully!');
        uploadForm.reset();
        window.location.href = 'index.html';
      } else {
        alert('' + (data.message || 'Upload failed'));
      }
    } catch (err) {
      alert('Error uploading vlog');
      console.error(err);
    }
  });
}

// Modal for showing vlog details
function createVlogModal() {
  // Check if modal already exists
  let modal = document.getElementById('vlogModal');
  if (modal) return;

  modal = document.createElement('div');
  modal.id = 'vlogModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle">Vlog Title</h2>
        <button class="close-btn" onclick="closeVlogModal()">&times;</button>
      </div>
      <img id="modalImage" src="" alt="Vlog" class="modal-image">
      <div class="modal-meta">
        <span class="modal-author" id="modalAuthor">Author</span>
        <span class="modal-date" id="modalDate">Date</span>
      </div>
      <div class="modal-description">
        <h4>Description:</h4>
        <p id="modalDescriptionText"></p>
      </div>
      <div class="modal-full-content">
        <h4>Full Content:</h4>
        <div id="modalFullContent"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeVlogModal();
    }
  });
}

function closeVlogModal() {
  const modal = document.getElementById('vlogModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function showVlogDetails(vlogId) {
  // Create modal if it doesn't exist
  if (!document.getElementById('vlogModal')) {
    createVlogModal();
  }

  const vlog = currentVlogData[vlogId];
  if (!vlog) {
    console.error('Vlog not found:', vlogId);
    return;
  }

  const modal = document.getElementById('vlogModal');
  document.getElementById('modalTitle').textContent = vlog.title;
  document.getElementById('modalImage').src = vlog.image;
  document.getElementById('modalAuthor').textContent = `📝 ${vlog.username}`;
  document.getElementById('modalDate').textContent = vlog.date || new Date(vlog.timestamp).toLocaleString();
  document.getElementById('modalDescriptionText').textContent = vlog.description;
  document.getElementById('modalFullContent').innerHTML = vlog.content || vlog.description;

  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

// Load vlogs on homepage
async function loadVlogs() {
  const container = document.getElementById('vlogContainer');
  if (!container) return;

  const res = await fetch('http://localhost:3000/vlogs');
  const vlogs = await res.json();

  container.innerHTML = vlogs.map(v => {
    currentVlogData[v.id] = v;
    return `
    <div class="vlog-card fade-in">
      <img src="${v.image}" alt="${v.title}">
      <div class="vlog-info">
        <h3>${v.title}</h3>
        <p>${v.description}</p>
        <span class="tag">user: ${v.username}</span>
        <button class="read-btn" onclick="showVlogDetails('${v.id}'); event.stopPropagation();">📖 Read Blog</button>
      </div>
    </div>
  `;
  }).join('');
}
loadVlogs();

// Global logout function for navbar button
function logout() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('loggedInEmail');
  localStorage.removeItem('loggedInId');
  alert('✅ Logged out successfully!');
  window.location.href = 'index.html';
}
