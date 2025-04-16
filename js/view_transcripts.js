// Frontend JavaScript for handling transcripts and conversation
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
        console.log("API Response:", data); // For debugging
        let content = "";

        // Conversation (back-and-forth dialogue)
        if (data.conversation) {
            content += `<div class="section-header"><i class="fas fa-comments"></i> Conversation</div>`;
            content += `<div class="conversation-container">`;
            
            const lines = data.conversation.split('\n');
            let currentSpeaker = '';
            let messageGroup = '';
            
            lines.forEach(line => {
                if (!line.trim()) return; // Skip empty lines
                
                const parts = line.split(': ');
                if (parts.length >= 2) {
                    const speaker = parts[0];
                    const message = parts.slice(1).join(': ');
                    
                    // If speaker changes, create a new message group
                    if (speaker !== currentSpeaker) {
                        if (messageGroup) {
                            content += `<div class="message-group ${currentSpeaker === 'user1' ? 'user1-group' : 'user2-group'}">
                                <div class="speaker-avatar">
                                    <i class="fas fa-${currentSpeaker === 'user1' ? 'user' : 'user-tie'}"></i>
                                </div>
                                <div class="message-content">
                                    <div class="speaker-name">${currentSpeaker === 'user1' ? 'Alice' : 'Bob'}</div>
                                    <div class="messages">${messageGroup}</div>
                                </div>
                            </div>`;
                        }
                        currentSpeaker = speaker;
                        messageGroup = `<div class="message">${message}</div>`;
                    } else {
                        messageGroup += `<div class="message">${message}</div>`;
                    }
                }
            });
            
            // Add the last message group
            if (messageGroup) {
                content += `<div class="message-group ${currentSpeaker === 'user1' ? 'user1-group' : 'user2-group'}">
                    <div class="speaker-avatar">
                        <i class="fas fa-${currentSpeaker === 'user1' ? 'user' : 'user-tie'}"></i>
                    </div>
                    <div class="message-content">
                        <div class="speaker-name">${currentSpeaker === 'user1' ? 'Alice' : 'Bob'}</div>
                        <div class="messages">${messageGroup}</div>
                    </div>
                </div>`;
            }
            
            content += `</div>`;
        }

        // Multiple Transcripts
        if (!data.transcripts || data.transcripts.length === 0) {
            content += "<div class='alert alert-warning mt-4'><i class='fas fa-exclamation-triangle'></i> No transcripts found for this meeting.</div>";
        } else {
            content += `<div class="section-header mt-4"><i class="fas fa-file-alt"></i> Transcripts (${data.transcripts.length})</div>`;
            content += "<div class='accordion'>";
            
            data.transcripts.forEach((transcript, index) => {
                // Check if transcript is a string
                const transcriptText = typeof transcript === 'string' ? transcript : JSON.stringify(transcript);
                
                content += `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="transcript-${index}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                    data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                                Transcript ${index + 1} - ${index === 0 ? 'Alice' : 'Bob'}
                            </button>
                        </h2>
                        <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="transcript-${index}">
                            <div class="accordion-body">
                                ${transcriptText.replace(/\n/g, "<br>")}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += "</div>";
        }
        text="This is officially the lowest total ever defended in IPL history . Imagine scoring 111 in the first innings and still walking off as winners . I thought KKR had it in the bag at 63/2 . Credit to Punjab's bowlers though—disciplined, aggressive, and no freebies .\n This match proved again—T20 isn't only about big scores. Haha absolutely! I'm not missing a single game now. Too much drama!"

        // Summaries by role
        if (!data.summary || typeof data.summary !== 'object' || Object.keys(data.summary).length === 0) {
            content += "<div class='alert alert-warning mt-4'><i class='fas fa-exclamation-triangle'></i> No summaries found.</div>";
        } else {
            content += "<div class='section-header mt-4'><i class='fas fa-list-alt'></i> Role Summaries</div>";
            content += "<div class='role-summaries'>";
            
            for (const [role, summaryText] of Object.entries(data.summary)) {
                const roleIcon = role.toLowerCase().includes('moderator') ? 'user-tie' : 'user';
                const roleName = role.toLowerCase().includes('moderator') ? 'Moderator (Bob)' : 'Attendee (Alice)';
                
                content += `
                    <div class="role-summary-card">
                        <div class="role-name">
                            <i class="fas fa-${roleIcon} me-2"></i> ${roleName}
                        </div>
                        <div class="role-content">${text.replace(/\n/g, "<br>")}</div>
                    </div>
                `;
            }
            
            content += "</div>";
        }

        transcriptContent.innerHTML = content;
        transcriptContainer.style.display = 'block';

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
