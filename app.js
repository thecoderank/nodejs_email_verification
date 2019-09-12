const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app = express();
const nodemailer = require('nodemailer');

// parser for forms undefined problem when submit form
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// views 
app.set('view engine', 'ejs');
app.set('views', 'views');


// email connection

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:'thecoderank@gmail.com',
        pass:'thecoderank2018'
    }
});

// database connection for storing data
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'emailverify'
});

// cookie parser
app.use(cookieParser());

connection.connect();




app.get('/', (req, res) => {
    res.render('index');
});



// this is for registration
app.post('/', (req, res) => {

    // verification
    function Store(pass) {
        var verify = Math.floor((Math.random() * 10000000) + 1);

        var mailOption = {
            from :'thecoderank@gmail.com', // sender this is your email here
            to : `${req.body.Email}`, // receiver email2
            subject: "Account Verification",
            html: `<h1>Hello Friend Please Click on this link<h1><br><hr><p>HELLO I AM 
        THECODERANK I MAKE THIS TUTORIAL FOR MY SUBSCRIBERS AND OUR FRIENDS.</p>
        <br><a href="http://localhost:3000/verification/?verify=${verify}">CLICK ME TO ACTIVATE YOUR ACCOUNT</a>`
        }
        // store data 

        var userData = { email: req.body.Email, password: pass, verification: verify };
        connection.query("INSERT INTO verify SET ?", userData, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                transporter.sendMail(mailOption,(error,info)=>{
                    if(error){
                        console.log(error)
                    }else{

                        let userdata = {
                            email : `${req.body.Email}`,
                        }
                        res.cookie("UserInfo",userdata);
                        res.send("Your Mail Send Successfully")
                    }
                })
                console.log('Data Successfully insert')
            }
        })

    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.Password, salt, function (err, hash) {
            if (err) {
                console.log(err);
            } else {
                Store(hash);
            }
        });
    });
})

// verification 
app.get('/verification/',(req,res)=>{
    function activateAccount(verification) {
        if(verification == req.query.verify){
            connection.query("UPDATE verify SET active = ?","true",(err,result)=>{
                if(err){
                    console.log(err);
                }
                else{
                    let userdata = {
                        email : `${req.body.Email}`,
                        verify: "TRUE"
                    }
                    res.cookie("UserInfo",userdata);
                    res.send('<h1>Account Verification Successfully</h1>');
                }
            })
        }else{
            res.send("<h1>verification failed</h1>")
        }
    };

    connection.query("SELECT verify.verification FROM verify WHERE email = ?",req.cookies.UserInfo.email,(err,result) => {
        if(err){
            console.log(err);
        }else{
            activateAccount(result[0].verification);
            /* var verify1 = req.query.verify;
            var verify2 = result[0].verification; 
            if(verify1 == verify2) {
                activateAccount(result[0].verification);
            }else{
                res.send("<h1>verification fail</h1>")
            } */
        }
    })
});

app.get('/dashboard',(req,res)=>{
    res.render('dashboard');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login',(req,res)=>{
    var email = req.body.Email;
    var pass = req.body.Password;

    function LoginSuccess() {
        let userdata = {
            email : `${req.body.Email}`,
            verify: "TRUE"
        }
        res.cookie("UserInfo",userdata);
        res.json({verify: "true"});
    }
    connection.query('SELECT * FROM verify WHERE email = ?',email,(err,result)=>{
        if(err){
            console.log(err);
        }else{
            var hash = result[0].password;
            bcrypt.compare(pass, hash, function(err, res) {
                if(err){
                    res.json({msg:"ERROR"})
                }else{
                    LoginSuccess();
                }
            });
        }
    })
})

app.listen(3000);