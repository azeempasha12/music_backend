const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const URL = "mongodb+srv://ishitamalik68:pasha123@cluster0.t3jtoov.mongodb.net/";
const Client = new MongoClient(URL);

// Email validation regex for basic validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

app.post('/user', async (req, res) => {
    console.log("Data USer",req.body)
    try {
        await Client.connect();
        const db = Client.db("myDatabase");
        const { name, email, password } = req.body;
        console.log("data",req.body)

        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format. Only gmail.com addresses are allowed." });
        }

        // Check if email is already registered
        const existingUser = await db.collection("MusicDatabase").findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const user = { name, email, password: hashedPassword };
        await db.collection("MusicDatabase").insertOne(user);
        res.status(201).json({ message: "Account has been created successfully." });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        Client.close();
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("pasha bhai is good always",req.body)
    try {
        await Client.connect();
        const db = Client.db("myDatabase");
        console.log("connected to mongoDB")

        // Find the user
        const user = await db.collection("MusicDatabase").findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Compare hashed passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("checker",isPasswordValid)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.status(200).json({ message: "Login successful.",email});
        console.log("meri jaan",email)
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        Client.close();
    }
});

app.post("/bookmark/add", async (req, res) => {
    const { email, bookmark } = req.body;
    console.log("data recived",req.body)
    try {
        await Client.connect();
        const db = Client.db("myDatabase");

        // Validate inputs
        if (!email || !bookmark || !bookmark.id || !bookmark.title || !bookmark.url) {
            return res.status(400).json({ message: "Invalid request data." });
        }

        // Find the user and update bookmarks
        const result = await db.collection("MusicDatabase").updateOne(
            { email },
            { $addToSet: { bookmarks: bookmark } } // $addToSet prevents duplicate bookmarks
        );
console.log("result", result)
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "Bookmark added successfully." });
    } catch (error) {
        console.error("Error adding bookmark:", error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        Client.close();
    }
});

app.get("/bookmark/:email", async (req, res) => {
    const { email } = req.params;
    try {
        await Client.connect();
        const db = Client.db("myDatabase");

        // Find the user and return their bookmarks
        const user = await db.collection("MusicDatabase").findOne(
            { email },
            { projection: { bookmarks: 1, _id: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ bookmarks: user.bookmarks });
    } catch (error) {
        console.error("Error retrieving bookmarks:", error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        Client.close();
    }
});

app.delete("/bookmark/remove", async (req, res) => {
    const { email, bookmarkId } = req.body;
    try {
        await Client.connect();
        const db = Client.db("myDatabase");

        // Remove the bookmark by ID
        const result = await db.collection("MusicDatabase").updateOne(
            { email },
            { $pull: { bookmarks: { id: bookmarkId } } } // $pull removes matching elements
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found or bookmark not found." });
        }

        res.status(200).json({ message: "Bookmark removed successfully." });
    } catch (error) {
        console.error("Error removing bookmark:", error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        Client.close();
    }
});



app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
