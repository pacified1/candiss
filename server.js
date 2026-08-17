const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = 3000;

// Very simple prototype authentication.
// We'll replace this with proper authentication later.
const USERS = {
    you: {
        password: "you123"
    },
    girlfriend: {
        password: "gf123"
    }
};

const connectedUsers = new Map();

io.on("connection", (socket) => {
    console.log("A device connected");

    socket.on("login", ({ username, password }) => {
        const user = USERS[username];

        if (!user || user.password !== password) {
            socket.emit("login_failed");
            return;
        }

        // Only allow one of our two users.
        socket.user = username;

        connectedUsers.set(username, socket.id);

        socket.emit("login_success", {
            username
        });

        console.log(`${username} logged in`);
    });

    socket.on("send_message", ({ text, notify }) => {
        if (!socket.user) return;

        if (!text || !text.trim()) return;

        const message = {
            id: Date.now(),
            sender: socket.user,
            text: text.trim(),
            notify: Boolean(notify),
            timestamp: new Date().toISOString()
        };

        // Send the message to both users.
        io.emit("new_message", message);

        // In the real application:
        //
        // if (notify) {
        //     sendPushNotificationToOtherUser(message);
        // }
        //
        // That will eventually use a real push notification
        // service such as Firebase Cloud Messaging / APNs.
    });

    socket.on("disconnect", () => {
        if (socket.user) {
            connectedUsers.delete(socket.user);
            console.log(`${socket.user} disconnected`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Couple app running at http://localhost:${PORT}`);
});
