import mysql from 'mysql2'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
    connectionLimit: 10,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.MYSQL_DB,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
});
 
let db = {
    getUser: (id) =>{
        return new Promise((resolve, reject)=>{
            pool.query('SELECT * FROM users WHERE id= ?', [id], (error, user)=>{
                if(error){
                    return reject(error);
                }
                return resolve(user);
            });
        });
    },
    getUserByEmail: (email) =>{
        return new Promise((resolve, reject)=>{
            pool.query('SELECT * FROM users WHERE email = ?', [email], (error, users)=>{
                if(error){
                    return reject(error);
                }
                return resolve(users[0]);
            });
        });
    },
    insertUser: (firstName, lastName, email, password) =>{
        return new Promise((resolve, reject)=>{
            pool.query('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [firstName, lastName, email, password], (error, result)=>{
                if(error){
                    return reject(error);
                }
                 
                  return resolve(result.insertId);
            });
        });
    }
};

 
export default db