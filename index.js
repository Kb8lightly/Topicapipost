const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI 

// Middleware
app.use(bodyParser.json());

// MongoDB connection setup
let db;

MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log("Connected to MongoDB");
        db = client.db("Docprompts");
    })
    .catch(error => console.error("Error connecting to MongoDB:", error));

// API endpoint for posting data
app.post('/post_topic', async (req, res) => {
    try {
        const data = req.body;
        let totalTopicsPosted = 0;
        let similarTopicsFound = 0;

        for (const topicData of data) {
            const { course_code, course_name, Topic, Used } = topicData;
            if (!course_code || !course_name || !Topic) {
                return res.status(400).json({ error: "Required fields missing" });
            }

            // Check if similar topic already exists
            const similarTopic = await db.collection('topics').findOne({ topic: Topic });
            if (similarTopic) {
                similarTopicsFound++;
                continue; // Skip inserting if similar topic found
            }

            // Insert data into MongoDB collection
            await db.collection('topics').insertOne({
                course_code,
                course_name,
                topic: Topic,
                used: Used || false
            });
            totalTopicsPosted++;
        }

        const successMessage = `${totalTopicsPosted} topics added successfully. ${similarTopicsFound} similar topics found and skipped.`;
        res.status(201).json({ message: successMessage });
    } catch (error) {
        console.error("Error posting topic:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// API endpoint for retrieving topics
app.get('/get_topics', async (req, res) => {
    try {
        const topics = await db.collection('topics').find({}, { _id: 0 }).toArray();
        res.status(200).json(topics);
    } catch (error) {
        console.error("Error getting topics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
