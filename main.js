document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const sendBtn = document.querySelector('.send-btn');
    const navItems = document.querySelectorAll('.nav-item');

    // Auto-resize textarea
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchInput.style.height = 'auto';
            searchInput.style.height = (searchInput.scrollHeight) + 'px';
            
            // Enable/Disable send button
            if (searchInput.value.trim().length > 0) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                sendBtn.style.cursor = 'pointer';
                sendBtn.style.backgroundColor = '#ffffff';
                sendBtn.style.color = '#000000';
            } else {
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.5';
                sendBtn.style.cursor = 'not-allowed';
                sendBtn.style.backgroundColor = 'var(--accent)';
                sendBtn.style.color = 'var(--text-secondary)';
            }
        });
    }

    // Sidebar navigation active state
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Handle search submission
    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const prompt = searchInput.value.trim();
            if (!prompt) return;

            const chatResults = document.getElementById('chat-results');
            const suggestionsSection = document.querySelector('.suggestions-section');
            const logoText = document.querySelector('.logo-text');

            // UI state: Loading
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i>';
            lucide.createIcons();

            // Clear previous results or show container
            chatResults.classList.remove('hidden');
            chatResults.innerHTML = `
                <div class="user-query">${prompt}</div>
                <div class="ai-response loading">Thinking...</div>
            `;
            
            // Adjust main center logo if first search
            if (logoText) logoText.style.margin = "20px 0";
            if (suggestionsSection) suggestionsSection.style.display = "none";

            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                const data = await response.json();
                
                if (data.status === 'success') {
                    chatResults.innerHTML = `
                        <div class="user-query">${prompt}</div>
                        <div class="ai-response">${formatResponse(data.response)}</div>
                    `;
                } else {
                    chatResults.innerHTML += `<div class="error">Error: ${data.error}</div>`;
                }
            } catch (error) {
                console.error("Fetch error:", error);
                chatResults.innerHTML += `<div class="error">Failed to connect to backend.</div>`;
            } finally {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i data-lucide="arrow-right"></i>';
                lucide.createIcons();
                searchInput.value = '';
                searchInput.style.height = 'auto';
            }
        });
    }

    // Basic markdown-like formatter
    function formatResponse(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // File Upload Handling
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    let activeFile = null;

    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            // UI: Show loading on attach button
            attachBtn.innerHTML = '<i data-lucide="loader-2" class="spin small-icon"></i>';
            lucide.createIcons();

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.status === 'success') {
                    activeFile = data.filename;
                    showFileBadge(data.filename);
                } else {
                    alert("Upload failed: " + data.error);
                }
            } catch (err) {
                console.error("Upload error:", err);
                alert("Failed to upload PDF.");
            } finally {
                attachBtn.innerHTML = '<i data-lucide="plus"></i>';
                lucide.createIcons();
            }
        });
    }

    function showFileBadge(filename) {
        let badge = document.querySelector('.file-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'file-badge';
            const wrapper = document.querySelector('.search-input-wrapper');
            wrapper.insertBefore(badge, searchInput);
        }
        badge.innerHTML = `
            <i data-lucide="file-text" class="small-icon"></i>
            <span>${filename}</span>
            <i data-lucide="x" class="close-icon" id="remove-file"></i>
        `;
        lucide.createIcons();

        document.getElementById('remove-file').addEventListener('click', () => {
            badge.remove();
            activeFile = null;
            // Optionally tell backend to clear context
        });
    }

    // Handle tag switching in Suggestions section
    const tags = document.querySelectorAll('.tag, .tagactive');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => {
                t.classList.remove('tagactive');
                t.classList.add('tag');
            });
            tag.classList.add('tagactive');
            tag.classList.remove('tag');
        });
    });
});
