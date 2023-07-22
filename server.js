require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const connectDb = require('./db');
const UserSchema = require('./model/model');

const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./auth');
initializePassport(passport);

const APP_PORT = process.env.APP_PORT || 3000;

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const httpserver = createServer(app);

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login');
}

function checkNotAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
}

app.get('/login', checkNotAuth, (req, res) => {
    res.render('login');
})

app.post('/login', checkNotAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuth, (req, res) => {
    res.render('register');
})

app.post('/register', checkNotAuth, async (req, res) => {
    try {
        await UserSchema.create({
            name: req.body.name,
            password: req.body.password
        });
        res.redirect('/login');
        // res.status(201).json({ user });
    }
    catch (err) {
        res.redirect('/register');
        // res.status(500).json({ msg: err })
    }
})

app.get('/', checkAuth, (req, res) => {
    app.use(express.static(path.join(__dirname, 'views')));
    res.render('index', { name: req.user.name });
})

app.post('/logout', (req, res) => {
    req.logOut(req.user, err => {
        if (err) return next(err);
        res.redirect('/login');
    });
})

const io = new Server(httpserver, {
    cors: {
        origin: 'http://localhost:3000', //change this in production
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`new connection ${socket.id}`);
    socket.on('chat-message', (mssg) => {
        io.emit('new_message', mssg);
    });
    // socket.broadcast.emit('chat-message', 'A user has joined');

    // io.on('disconnect', ()=>{
    //     io.emit('chat-message', 'A user left');
    // })
});

const start = async () => {
    try {
        await connectDb(process.env.MONGO_URI);
        httpserver.listen(APP_PORT, () => { console.log(`listening on port ${APP_PORT}`); });
    } catch (error) {
        console.log(error);
    }
}

start();