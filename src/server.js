require("dotenv").config();
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const port = process.env.PORT || 3000;
require("./db/conn");

const Register = require("./models/registers");

app.use(express.static(path.join(__dirname, "../public")));
// const static_path = path.join(__dirname, "../public");
// app.use(express.static(static_path));
// const template_path = path.join(__dirname, "../templates/views");
// const partial_path = path.join(__dirname, "../templates/partials");
// app.set("view engine", "hbs");
// app.set("views", template_path);
// hbs.registerPartials(partial_path);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.get("/", (req, res) => {
//     res.render("index.hbs");
// })

app.set("views", path.join(__dirname, "../templates/views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "../templates/partials"));

console.log(process.env.SECRET_KEY);

app.get("/logout", auth, async (req, res) => {
  try {
    let uInfo = req.user;
    let m = uInfo.token.filter((curEle) => {
      return curEle !== req.cookies.jwt;
    });
    uInfo.token = m;
    console.log(uInfo);
    // console.log("zero index "+m);
    // console.log(req.cookies.jwt === uInfo.token[0]);
    res.clearCookie("jwt");
    await uInfo.save();
    res.render("login.hbs");
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/", (req, res) => {
  res.render("home.hbs");
});

app.get("/secret", auth, (req, res) => {
  // console.log(`this is the cookie ${req.cookies.jwt}`);
  res.render("secret.hbs");
});

app.get("/index", (req, res) => {
  res.render("index.hbs");
});

app.get("/show", (req, res) => {
  res.render("show.hbs");
});

app.get("/login", (req, res) => {
  res.render("login.hbs");
});

app.get("/home", (req, res) => {
  res.render("home.hbs");
});

//create new user in our database
app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;

    if (password === cpassword) {
      const RegisterEmployee = new Register({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        phone: req.body.phone,
        age: req.body.age,
        password: req.body.password,
      });
      // const check = RegisterEmployee.firstname;
      // console.log(check)
      // hash password

      // console.log("the success part is " + RegisterEmployee);

      // const token = await RegisterEmployee.generateAuthToken();
      // console.log("the par " + token);

      // const user = await Register.create({
      //     first_name,
      //     last_name,
      //     email: email.toLowerCase(), // sanitize: convert email to lowercase
      //     password: encryptedPassword,
      //   });

      // Create token
      const token = jwt.sign(
        { _id: RegisterEmployee._id },
        process.env.SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );
      // save user token
      RegisterEmployee.token = token;
      console.log("register " + token);

      // The res.cookie() function is used to set the cookies name to value.
      // The value parameter may be a string or object converted to JSON.

      // syntax
      // res.cookie(name, value ,[options])
      await RegisterEmployee.save();

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 900000),
        httpOnly: true,
      });
      // console.log(cookie);

      res.status(201).render("login");

      // console.log("the par page " + registered);
    } else {
      res.send("password are not matching");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//login check
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userEmail = await Register.findOne({ email: email });
    let name = userEmail.firstname;
    let lname = userEmail.lastname;

    const token = jwt.sign({ _id: userEmail._id }, process.env.SECRET_KEY, {
      expiresIn: "2h",
    });

    console.log("before login: " + token);
    userEmail.token = token;
    console.log("after login: " + token);
    await userEmail.save();
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 900000),
      httpOnly: true,
    });
    console.log(new Date(Date.now()) + 900000);
    const checkP = await bcrypt.compare(password, userEmail.password);

    if (checkP) {
      res.status(201).render("show", {
        username: name + " " + lname,
      });
    } else {
      res.send("password are not matching");
    }
  } catch (error) {
    res.status(400).send("invalid email");
  }
});

app.listen(port, () => {
  console.log(`server is running at localhost ${port}`);
});
