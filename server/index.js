const express = require("express");
const app = express();
const PORT = 4000;

const http = require("http").Server(app);
const cors = require("cors");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Generates a random string
const fetchID = () => Math.random().toString(36).substring(2, 10);

// Nested object for dummy data
let tasks = {
    pending: {
        title: "pending",
        items: [
            {
                id: fetchID(),
                title: "Send the Figma file to Dima",
                comments: [],
            },
        ],
    },

    ongoing: {
        title: "ongoing",
        items: [
            {
                id: fetchID(),
                title: "Review GitHub issues",
                comments: [
                    {
                        name: "David",
                        text: "Ensure you review before merging",
                        id: fetchID(),
                    },
                ],
            },
        ],
    },

    completed: {
        title: "completed",
        items: [
            {
                id: fetchID(),
                title: "Create technical contents",
                comments: [
                    {
                        name: "Dima",
                        text: "Make sure you check the requirements",
                        id: fetchID(),
                    },
                ],
            },
        ],
    },
};

// to allow data transfer between client and server domains
// listening to the client connection
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

// setting up socket.uio for real time connection
socketIO.on('connection', (socket) => {
    console.log(`Active: ${socket.id} user just connected!`);

    // creating a listener to the taskDragged event on the backend.
    socket.on("taskDragged", (data) => {
        console.log(data);
    });

    socket.on('disconnect', () => {
        socket.disconnect()
        console.log('Offline: A user disconnected');
    });
});

app.get("/api", (req, res) => {
    res.json(tasks);
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});