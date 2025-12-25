// Google OAuth 2.0 Helper Module
const { OAuth2Client } = require("google-auth-library");
const fs = require("fs");
require("dotenv").config();

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

// Helper function to read/write data
const readData = () => {
    try {
        return JSON.parse(fs.readFileSync("data.json", "utf8"));
    } catch {
        return { users: [], vlogs: [] };
    }
};

const writeData = (data) => {
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
};

/**
 * Verify Google ID Token and extract user information
 * @param {string} token - Google ID Token from frontend
 * @returns {object} - User info: { id, email, name, picture }
 */
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            verified: true
        };
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return { verified: false, error: error.message };
    }
};

/**
 * Create or get user from database
 * Auto-creates user if they don't exist
 * @param {object} userInfo - User info from Google
 * @returns {object} - User object from database
 */
const createOrGetUser = (userInfo) => {
    const data = readData();

    // Check if user already exists by email
    let user = data.users.find(u => u.email === userInfo.email);

    if (!user) {
        // Create new user
        user = {
            id: Date.now().toString(),
            username: userInfo.name.replace(/\s+/g, "_").toLowerCase(),
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            googleId: userInfo.googleId,
            isGoogleAuth: true,
            createdAt: new Date().toISOString(),
            password: null // No password for Google OAuth users
        };

        data.users.push(user);
        writeData(data);
        console.log("✅ New user created via Google OAuth:", user.email);
    } else {
        // Update existing user with latest Google info
        user.picture = userInfo.picture;
        user.name = userInfo.name;
        user.googleId = userInfo.googleId;
        user.isGoogleAuth = true;
        writeData(data);
    }

    return user;
};

/**
 * Generate session data for user
 * @param {object} user - User object
 * @returns {object} - Session data to store
 */
const generateSessionData = (user) => {
    return {
        userId: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isGoogleAuth: true,
        loginTime: new Date().toISOString()
    };
};

/**
 * Get authorization URL for Google Login
 * @returns {string} - Google OAuth consent URL
 */
const getAuthorizationUrl = () => {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ];

    return client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent"
    });
};

/**
 * Handle Google OAuth callback and get tokens
 * @param {string} code - Authorization code from Google
 * @returns {object} - User info and tokens
 */
const handleGoogleCallback = async (code) => {
    try {
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        return {
            success: true,
            user: {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture
            },
            tokens: tokens
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

module.exports = {
    verifyGoogleToken,
    createOrGetUser,
    generateSessionData,
    getAuthorizationUrl,
    handleGoogleCallback
};
