const form = document.getElementById('view-transcripts-form');
const transcriptContainer = document.getElementById('transcript-container');
const transcriptContent = document.getElementById('transcript-content');
const loadingText = document.getElementById('loading');

async function fetchData(id) {
    try {
        loadingText.style.display = 'block'; // Show loading text
        transcriptContainer.style.display = 'none'; // Hide transcript while loading
        
        const response = await fetch(`https://video-backend-jckn.onrender.com/meeting-transcript/${id}`);
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();

        // If there's no transcript, show an error
        if (!data || !data.transcript) {
            transcriptContent.innerHTML = "⚠️ No transcript found for this meeting.";
        } else {
            transcriptContent.innerHTML = data.transcript.replace(/\n/g, "<br>"); // Format new lines properly
        }

        transcriptContainer.style.display = 'block'; // Show transcript
    } catch (error) {
        console.error('Error:', error);
        transcriptContent.innerHTML = "⚠️ Error fetching transcript.";
        transcriptContainer.style.display = 'block';
    } finally {
        loadingText.style.display = 'none'; // Hide loading text after fetching
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
