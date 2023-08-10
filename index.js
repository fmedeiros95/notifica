const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: '*' }
});
const cors = require('cors');

app.use(cors()); // CORS policy
app.set('view engine', 'ejs'); // View engine

const users = {};

io.on('connection', socket => {
    console.log('New user connected');

    socket.on('register', data => {
        const user = users[data.id];
        users[data.id] = [...(user || []), socket.id];
        console.log('Registered user: ' + JSON.stringify(data));
        console.log('Users: ' + JSON.stringify(users));
    });

    socket.on('send-message', data => {
        const socketIds = users[data.receiverId];
        if (!socketIds || !socketIds.length) return console.log('User is not online');
        socketIds.forEach(socketId => io.to(socketId).emit('new-message', data));
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');

        // Remove socketId from users
        Object.keys(users).forEach(userId => {
            users[userId] = users[userId].filter(socketId => socketId !== socket.id);
        });

        // If user has no socketId, remove user from users
        Object.keys(users).forEach(userId => {
            if (!users[userId].length) delete users[userId];
        });
    });
});

app.get('/', (req, res) => {    
    res.render('index');
});

app.post('/:userId', (req, res) => {
    const { userId } = req.params;
    const socketIds = users[userId];
    if (!socketIds || !socketIds.length) return res.status(404).json({ message: 'User is not online' });
    socketIds.forEach(socketId => io.to(socketId).emit('notification', { message: 'You have a new message' }));

    res.json({ message: 'Notification sent' });
});
server.listen(3333, () => console.log('Server running on port 3333'));