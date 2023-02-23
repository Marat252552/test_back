import express from 'express'
import dotenv from 'dotenv'
import session from 'express-session';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise'
import db from './db.js'
import MySQLStore  from 'express-mysql-session';
 
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
 
 
app.use(bodyParser.urlencoded({
    extended: true
}));
 
app.use(bodyParser.json())
 
 
app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        sameSite: true,
        secure: IN_PROD
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
        console.log(user)
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
    try{ 
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
        return res.redirect('/home');
     
 
    } catch(e){
        console.log(e);
    }
});
 
 
 
 
 
 
app.post('/register',  async (req, res, next)=>{
    try{
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        let password = req.body.password;
 
 
              if (!firstName || !lastName || !email || !password) {
                return res.sendStatus(400);
             }
 
              
 
        const user =  await db.insertUser(firstName, lastName, email, password).then(insertId=>{return db.getUser(insertId);});
        req.session.userId = user.id
        
            return res.redirect('/register') 
 
    } catch(e){    
        console.log(e);
        res.sendStatus(400);
    }
});
 
 
 
app.post('/logout', (req, res)=>{
    console.log(req.session)
    req.session.destroy(err => {
        if(err){
            return res.redirect('/home')
        }
        sessionStore.close()
        res.clearCookie(process.env.SESS_NAME)
        res.redirect('/login')
    })
 
})
 
 
 
 
app.listen(PORT, ()=>{console.log(`server is listening on ${PORT}`)});