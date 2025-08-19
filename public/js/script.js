// public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
  // Get references
  const searchInput = document.querySelector('form input[name="query"]');
  const sabjiLinks = document.querySelectorAll('section[aria-label="Popular Sabjiyan Categories"] a');

  if (!searchInput || sabjiLinks.length === 0) return;

  // Event listener for input event to filter instantly while typing
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      // Agar search box empty hai to sab dikhado
      sabjiLinks.forEach(link => {
        link.style.display = 'block';
      });
      return;
    }

    sabjiLinks.forEach(link => {
      const sabjiName = link.querySelector('h3').textContent.toLowerCase();
      // Agar sabji name me query ka kuch part hai toh show, warna hide
      if (sabjiName.includes(query)) {
        link.style.display = 'block';
      } else {
        link.style.display = 'none';
      }
    });
  });

  // Optional: Prevent form submission to avoid page reload
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  }
});
