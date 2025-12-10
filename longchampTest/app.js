// LIFF ID - Replace with your actual LIFF ID
const LIFF_ID = '2008668433-poONz00J';

console.log('Starting LIFF initialization with ID:', LIFF_ID);
console.log('Page loaded at:', new Date());

// Check if LIFF SDK is loaded
if (typeof liff === 'undefined') {
    console.error('LIFF SDK not loaded!');
    document.getElementById('message').textContent = 'LIFF SDK not loaded. Check console.';
} else {
    console.log('LIFF SDK found, initializing...');
    
    // Initialize LIFF
    liff
        .init({ liffId: LIFF_ID })
        .then(() => {
            console.log('✅ LIFF initialized successfully');
            console.log('Is logged in:', liff.isLoggedIn());
            console.log('Context:', liff.getContext());
            
            if (!liff.isLoggedIn()) {
                console.log('Not logged in, attempting login');
                liff.login();
            } else {
                console.log('Already logged in, displaying user info');
                displayUserInfo();
            }
        })
        .catch((err) => {
            console.error('❌ LIFF initialization error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                fullError: err
            });
            document.getElementById('message').textContent = 'LIFF Error: ' + err.message;
        });
}

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
