const firebaseConfig = {
  apiKey:            "AIzaSyAP8iD7RG7T7W29OcJY8hsxKp3Jb1lCwzE",
  authDomain:        "strikethrough-ss.firebaseapp.com",
  projectId:         "strikethrough-ss",
  storageBucket:     "strikethrough-ss.firebasestorage.app",
  messagingSenderId: "311777425941",
  appId:             "1:311777425941:web:b026f2cf84357fc0a86c1c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
