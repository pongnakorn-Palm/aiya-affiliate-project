# Longchamp LIFF App

A LINE Front-end Framework (LIFF) application for Longchamp project.

## What is LIFF?

LIFF (LINE Front-end Framework) is a platform for web apps that run in LINE. You can use it to create web apps that can be launched in LINE.

## Project Structure

```
longchampTest/
├── index.html      # Main HTML file
├── app.js          # LIFF application logic
├── style.css       # Application styling
├── package.json    # Project dependencies
└── README.md       # This file
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A LINE Business Account with LINE Channel created

### 2. Installation

```bash
# Navigate to the project directory
cd longchampTest

# Install dependencies
npm install
```

### 3. Get LIFF ID

1. Go to [LINE Developers Console](https://developers.line.biz/console)
2. Create or select your channel
3. Create a LIFF app to get your LIFF ID
4. Open `app.js` and replace `YOUR_LIFF_ID_HERE` with your actual LIFF ID

```javascript
const LIFF_ID = 'YOUR_LIFF_ID_HERE';
```

### 4. Run the Application

#### Development Mode
```bash
npm run dev
```

The app will be available at `http://localhost:8000`

#### Production Deployment

To deploy the LIFF app:

1. **Choose a hosting platform** (Heroku, Firebase, AWS, etc.)
2. **Upload the files** to your hosting service
3. **Set the LIFF Endpoint URL** in LINE Developers Console to your hosting URL
4. **Update LIFF ID** if needed

Example for simple HTTP server:
```bash
npm start
```

## Features

- User authentication via LIFF
- Display user profile information
- Send messages back to the LINE chat
- Close the LIFF window
- Responsive design for mobile

## How It Works

### LIFF Initialization
The app initializes LIFF SDK and checks if the user is logged in. If not, it redirects to login.

### User Profile
Once logged in, the app displays the user's LINE profile information.

### Messaging
Users can send messages back to the chat where they opened the LIFF app (only works when opened from LINE).

### Standalone Mode
The app can be opened in a standalone browser window for testing.

## Important Notes

- The `sendMessages` function only works when the LIFF app is opened within LINE
- The `closeWindow` function only works when the LIFF app is opened within LINE
- In standalone mode (browser), these features are disabled with appropriate messages

## Environment

- **Development**: Use `npm run dev` for local testing
- **Testing**: Open in LINE app using the provided LIFF URL
- **Production**: Deploy to a web server and set the URL in LINE Developers Console

## Debugging

1. Use browser DevTools console for JavaScript errors
2. Check LINE Developers Console logs
3. Verify LIFF ID is correct
4. Ensure your domain is whitelisted in LINE Channel settings

## Resources

- [LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [LINE Developers Console](https://developers.line.biz/console)
- [LIFF JavaScript SDK Reference](https://developers.line.biz/en/reference/liff-web/)

## License

MIT

---

**Note**: Replace `YOUR_LIFF_ID_HERE` with your actual LIFF ID before deploying.
