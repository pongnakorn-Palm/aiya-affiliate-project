// LIFF ID - Replace with your actual LIFF ID
const LIFF_ID = 'YOUR_LIFF_ID_HERE';

// Initialize LIFF
liff
    .init({ liffId: LIFF_ID })
    .then(() => {
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            displayUserInfo();
        }
    })
    .catch((err) => {
        console.log(err);
        document.getElementById('message').textContent = 'Failed to initialize LIFF: ' + err.message;
    });

// Display user information
function displayUserInfo() {
    liff.getProfile()
        .then((profile) => {
            document.getElementById('userId').textContent = 'User ID: ' + profile.userId;
            document.getElementById('message').textContent =
                'Welcome, ' + profile.displayName + '!';
        })
        .catch((err) => {
            console.log('Error getting profile:', err);
        });
}

// Send message button
document.getElementById('sendBtn').addEventListener('click', () => {
    if (liff.getContext().type !== 'none') {
        liff.sendMessages([
            {
                type: 'text',
                text: 'Hello from LIFF app!'
            }
        ])
            .then(() => {
                document.getElementById('message').textContent = 'Message sent!';
            })
            .catch((err) => {
                document.getElementById('message').textContent = 'Error: ' + err.message;
            });
    } else {
        document.getElementById('message').textContent = 'Cannot send message from standalone mode';
    }
});

// Close button
document.getElementById('closeBtn').addEventListener('click', () => {
    if (liff.isInClient()) {
        liff.closeWindow();
    } else {
        document.getElementById('message').textContent = 'Cannot close in standalone mode';
    }
});
