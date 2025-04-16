// Frontend JavaScript for handling transcripts
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

        // Multiple Transcripts
        if (!data.transcripts || data.transcripts.length === 0) {
            content += "<div class='alert alert-warning'><i class='fas fa-exclamation-triangle'></i> No transcripts found for this meeting.</div>";
        } else {
            content += `<div class="section-header"><i class="fas fa-file-alt"></i> Transcripts (${data.transcripts.length})</div>`;
            content += "<div class='accordion'>";
            
            data.transcripts.forEach((transcript, index) => {
                content += `
                    <div class="accordion-item">
                        <div class="accordion-header" id="transcript-${index}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                    data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                                Transcript ${index + 1}
                            </button>
                        </div>
                        <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="transcript-${index}">
                            <div class="accordion-body">
                                ${transcript.replace(/\n/g, "<br>")}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += "</div>";
        }

        // Summaries by role
        if (!data.summary || Object.keys(data.summary).length === 0) {
            content += "<div class='alert alert-warning mt-4'><i class='fas fa-exclamation-triangle'></i> No summaries found.</div>";
        } else {
            content += "<div class='section-header mt-4'><i class='fas fa-list-alt'></i> Role Summaries</div>";
            content += "<div class='role-summaries'>";
            
            for (const [role, summaryText] of Object.entries(data.summary)) {
                content += `
                    <div class="role-summary-card">
                        <div class="role-name">${role.toUpperCase()}</div>
                        <div class="role-content">${summaryText.replace(/\n/g, "<br>")}</div>
                    </div>
                `;
            }
            
            content += "</div>";
        }

        transcriptContent.innerHTML = content;
        transcriptContainer.style.display = 'block';
        
        // Initialize Bootstrap accordion (if not automatically handled)
        if (typeof bootstrap !== 'undefined') {
            const accordionElements = document.querySelectorAll('.accordion-collapse');
            accordionElements.forEach(collapse => {
                new bootstrap.Collapse(collapse, {
                    toggle: false
                });
            });
        }

    } catch (error) {
        console.error('Error:', error);
        transcriptContent.innerHTML = `<div class='alert alert-danger'><i class='fas fa-exclamation-circle'></i> Error fetching data: ${error.message}</div>`;
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
        alert('Please enter a valid meeting ID');
    }
});