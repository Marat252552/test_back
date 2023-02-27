import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise'
import db from './db.js'
import cors from 'cors'
import MySQLStore  from 'express-mysql-session';
import cookieParser from 'cookie-parser';
 

const mysqlStore = MySQLStore(session);

dotenv.config()

const PORT= process.env.APP_PORT;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2

const options ={
    connectionLimit: 10,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.MYSQL_DB,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    createDatabaseTable: true
}
const pool = mysql.createPool(options);
 
const  sessionStore = new mysqlStore(options, pool);
 


 

const app=express();
app.use(cookieParser())
const jsonBodyMiddleware = express.json()
app.use(jsonBodyMiddleware)
const corsOptions ={
   origin:['http://localhost:5173', 'http://127.0.0.1:5174'], 
   credentials:true,            
   optionSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())
app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        // sameSite: 'none',
        // secure: true
    }
}))

app.get('/', (req, res)=>{
    const { userId } = req.session
    res.send(`
    <h1> Welcome!</h1>
    ${userId ?`<a href = '/home'> Home </a>
    <form method='post' action='/logout'>
    <button>Logout</button>
    </form>` : `<a href = '/login'> Login </a>
    <a href = '/register'> Register </a>
`}
    `)
})

app.get('/home',  async(req,res)=>{
    const {userId} =req.session
     if(userId){
    try{
        const user = await db.getUser(userId);
        req.user = user;
        res.send(`
        <h1>Home</h1>
        <a href='/'>Main</a>
        <ul>
        <li> Name: ${user[0].first_name} </li>
        <li> Email:${user[0].email} </li>
        </ul>
     
        `)
         
    } catch(e) {
        console.log(e);
        res.sendStatus(404);
    }
}
    
})

app.get('/login', (req,res)=>{
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
})

app.get('/register', (req,res)=>{
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/Register'>
    <input type='text' name='firstName' placeholder='First Name' required />
    <input type='text' name='lastName' placeholder='Last Name' required />
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/login'>Login</a>
    `)
})

app.post('/login', async(req, res, next)=>{
    console.log(req.cookies)
    try{ 
        console.log(req.body.email)
    const email = req.body.email;
    let password = req.body.password;
    let user = await db.getUserByEmail(email);
    if(!user){
        return res.send({
            message: "Invalid email"
        })
    }
    if(user.password !== password){
        return res.send({
            message: "Invalid  password"
        })
    }
        req.session.userId = user.id
        console.log(req.session)
        res.sendStatus(200)
    } catch(e){
        console.log(e);
    }
});

app.get('/testing', (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
    res.send('Test OK')
})

app.post('/register',  async (req, res, next)=>{
    try{
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        let password = req.body.password;
 
 
              if (!firstName || !lastName || !email || !password) {
                res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
                return res.sendStatus(400);
             }
 
              
 
        const user =  await db.insertUser(firstName, lastName, email, password).then(insertId=>{return db.getUser(insertId);});
        req.session.userId = user.id
        console.log(req.session)
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
        res.redirect('/register')
        return
 
    } catch(e){    
        console.log(e);
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
        res.sendStatus(400);
    }
});

app.post('/logout', (req, res)=>{
    console.log(req.session)
    req.session.destroy(err => {
        if(err){
            res.redirect('/home')
            return
        }
        sessionStore.close()
        res.clearCookie(process.env.SESS_NAME)
        res.sendStatus(201)
    })
})

app.listen(PORT, ()=>{console.log(`server is listening on ${PORT}`)});