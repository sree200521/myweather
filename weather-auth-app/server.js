const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set, get } = require('firebase/database');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1) Mandatory Use of the POST Method for Sign-In and Sign-Up Functionality:
// Already implemented correctly.

// 2) Password Hashing in Sign-Up Functionality:
// Firebase Authentication handles this. We don't need to add explicit hashing here.

// 3) Email Duplication Prevention in Sign-Up Functionality:
app.post('/register', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST for registration.' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        set(ref(db, 'users/' + user.uid), {
            email: user.email
        });
        res.status(201).json({ message: 'User registered successfully', user: { uid: user.uid, email: user.email } });
    } catch (error) {
        console.error('Error registering user:', error);
        let errorMessage = 'Registration failed';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email address is already in use.';
        }
        res.status(400).json({ error: errorMessage });
    }
});

// 1) Mandatory Use of the POST Method for Sign-In and Sign-Up Functionality:
// Already implemented correctly.
app.post('/login', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST for login.' });
    }
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        res.json({ message: 'Logged in successfully', user: { uid: user.uid, email: user.email } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Get Weather Data route (using Express)
app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    const apiKey = process.env.WEATHER_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
