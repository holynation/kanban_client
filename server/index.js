const express = require("express");
const app = express();
const PORT = 4000;

const http = require("http");
const cors = require("cors");
const { Server } = require('socket.io');

// add middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

// to allow data transfer between client and server domains
// listening to the client connection
const socketIO = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

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

// setting up socket.uio for real time connection
socketIO.on('connection', (socket) => {
    console.log(`Active: ${socket.id} user just connected!`);

    // creating a listener to the task:dragged event on the backend.
    socket.on("task:dragged", (data) => {
        const {source, destination} = data;
        // Gets the item that was dragged
        const itemMoved = {
            ...tasks[source.droppableId].items[source.index],
        };
        console.log("DraggedItem >>> ", itemMoved);
        // Removes the item from the its source
        tasks[source.droppableId].items.splice(source.index, 1);
        // Add the item to its destination using its destination index
        tasks[destination.droppableId].items.splice(destination.index, 0, itemMoved);
        // Sends the updated tasks object to the React app
        socket.emit("task:update", tasks);

        //  Print the items at the Source and Destination
        console.log("Source >>>", tasks[source.droppableId].items);
        console.log("Destination >>>", tasks[destination.droppableId].items);
    });

    // event listener for tasks:create
    socket.on("task:create", (data) => {
        // Constructs an object according to the data structure
        const newTask = { id: fetchID(), title: data.task, comments: [] };
        // Adds the task to the pending category
        tasks["pending"].items.push(newTask);
        // Fires the tasks event for update
        socket.emit("task:update", tasks);
    });

    socket.on("task:addComment", (data) => {
        const { category, userId, comment, id } = data;
        // Gets the items in the task's category
        const taskItems = tasks[category].items;
        // Loops through the list of items to find a matching ID
        for (let i = 0; i < taskItems.length; i++) {
            if (taskItems[i].id === id) {
                // Then adds the comment to the list of comments under the item (task)
                taskItems[i].comments.push({
                    name: userId,
                    text: comment,
                    id: fetchID(),
                });
                // sends a new event to the React app
                socket.emit("task:updateComments", taskItems[i].comments);
            }
        }
    });

    socket.on("task:fetchComments", (data) => {
        const { category, id } = data;
        const taskItems = tasks[category].items;
        for (let i = 0; i < taskItems.length; i++) {
            if (taskItems[i].id === id) {
                socket.emit("task:updateComments", taskItems[i].comments);
            }
        }
    });

    socket.on('disconnect', () => {
        socket.disconnect()
        console.log('Offline: A user disconnected');
    });
});

// here is the api code to get the tasks on the server
app.get("/api", (req, res) => {
    res.json(tasks);
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});