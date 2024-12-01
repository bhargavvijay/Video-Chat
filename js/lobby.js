let form = document.getElementById('create_room_form');

// Retrieve display name from session storage
let displayName = sessionStorage.getItem('display_name');
if (displayName) {
    form.name.value = displayName;
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve form data
    const hostName = form.name.value;

    if (!hostName) {
        alert('Please fill out fields.');
        return;
    }

    // Save display name to session storage
    sessionStorage.setItem('display_name', hostName);

    // Prepare data for the request
    const requestData = {
        hostName: hostName, // Use "hostName" to match backend expectations
    };

    console.log(hostName);

    try {
        // Make POST request to the API
        const response = await fetch('https://video-backend-jckn.onrender.com/create-meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the response
        const responseData = await response.json();

        // Redirect to the created room (assuming the response contains a room ID)
        if (responseData.roomId) {
            console.log('here')
            window.location.href = `room.html?room=${responseData.roomId}`;
        } else {
            alert('Room creation failed. Please try again.');
        }
    } catch (error) {
        console.error('Error creating room:', error);
        alert('An error occurred while creating the room.');
    }
});

