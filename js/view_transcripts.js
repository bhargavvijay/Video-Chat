const form = document.getElementById('view-transcripts-form');
const transcriptContainer = document.getElementById('transcript-container');
const transcriptContent = document.getElementById('transcript-content');
const loadingText = document.getElementById('loading');

async function fetchData(id) {
    try {
        loadingText.style.display = 'block';
        transcriptContainer.style.display = 'none';

        const response = await fetch(`https://video-backend-jckn.onrender.com/meeting-transcript/${id}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        let content = "";

        // Transcript
        if (!data.transcript) {
            content += "<p>⚠️ No transcript found for this meeting.</p>";
        } else {
            content += `<h3>📝 Transcript</h3><p>${data.transcript.replace(/\n/g, "<br>")}</p>`;
        }

        // Summaries by role
        if (!data.summary || Object.keys(data.summary).length === 0) {
            content += "<p>⚠️ No summaries found.</p>";
        } else {
            content += "<h3>📋 Summaries by Role</h3>";
            for (const [role, summaryText] of Object.entries(data.summary)) {
                content += `<p><strong>${role.toUpperCase()}:</strong><br>${summaryText.replace(/\n/g, "<br>")}</p>`;
            }
        }

        transcriptContent.innerHTML = content;
        transcriptContainer.style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        transcriptContent.innerHTML = "⚠️ Error fetching data.";
        transcriptContainer.style.display = 'block';
    } finally {
        loadingText.style.display = 'none';
    }
}


form.addEventListener('submit', (e) => {
    e.preventDefault();

    const meetingId = form["meeting-id"].value.trim();

    if (meetingId) {
        fetchData(meetingId);
    } else {
        alert('Enter a valid meeting ID');
    }
});
