let form = document.getElementById('join_room_form');

// Retrieve display name from session storage
let displayName = sessionStorage.getItem('display_name');
if (displayName) {
    form.name.value = displayName;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve form data
    const displayName = form.name.value;
    const roomCode = form.room.value;

    if (!displayName || !roomCode) {
        alert('Please fill out all fields.');
        return;
    }

    // Save display name to session storage
    sessionStorage.setItem('display_name', displayName);

    console.log('Display Name:', displayName);

    try {
        // Make GET request to the API
        const response = await fetch(`https://video-backend-jckn.onrender.com/meeting-exists/${roomCode}`);



        // Parse the response
        const responseData = await response.json();

        // Handle backend response
        if (responseData.exists) {
            // Redirect to the room
            window.location.href = `room.html?room=${roomCode}`;
        } else {
            // Display backend-provided error message
            alert(responseData.message || 'Room with the given ID does not exist. Please check the room code.');
        }
    } catch (error) {
        console.error('Error Joining room:', error);
        alert('An error occurred while joining the room. Please try again later.');
    }
});


