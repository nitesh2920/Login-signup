const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const { setUser, getUser } = require("./auth");

const { connectMongoDb } = require("./connect");
const app = express();

const PORT = 3001;

//connection with database
connectMongoDb(
  "mongodb+srv://nitesh:1234@cluster0.2cefcqf.mongodb.net/Registration?retryWrites=true&w=majority&appName=Cluster0"
)
  .then(() => console.log("MongoDb connected"))
  .catch((err) => console.log("Server error", err));

//middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

async function restrictLogin(req, res, next) {
  const userUid = req.cookies.uid;
  if (!userUid) {
    return res.redirect("/login");
  }
  const user = getUser(userUid);
  if (!user) {
    return res.redirect("/login");
    req.user = user;
    next();
  }
}

//setting up views engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

//schema
const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const userModel = mongoose.model("userInfo", userSchema);

//Routes

app.get("/", async (req, res) => {
  const users = await userModel.find({});
  // res.json(
  //   users.map((user) => ({
  //     name: user.userName,
  //     email: user.email,
  //     id: user._id,
  //     password: user.password,
  //   }))
  // );
  res.redirect("signup");
});

app.post("/signup", async (req, res) => {
  const body = req.body;
  //hash password
  const pass = body.password;
  const saltRounds = 10;
  const hashPass = await bcrypt.hash(pass, saltRounds);

  // console.log("hi ", body);
  const result = await userModel.create({
    userName: body.userName,
    email: body.email,
    password: hashPass,
  });
  // console.log(result);

  res.redirect("/login");
});

app.delete("/user/:id", async (req, res) => {
  try {
    const result = await userModel.findByIdAndDelete(req.params.id);
    // res.json({
    //   message: "success",
    //   id: req.params.id,
    //   name: result.userName,
    //   password: result.password,
    // });
    res.redirect("/signup");
  } catch (err) {
    // console.log("error", err);
    res.status(500).send("Internal server error");
  }
});

//delete user account
app.post("/deletaccount/:id", async (req, res) => {
  try {
    const result = await userModel.findByIdAndDelete(req.params.id);
    res.json("success", "User deleted successfully");
    // res.redirect("/signup");
    // console.log(result);
  } catch (err) {
    // console.error(err);

    res.redirect("/");
  }
});

/*It is not connect to client side yet  */
app.patch("/user/:id", async (req, res) => {
  const id = req.params.id;

  const { userName, email, password } = req.body;
  if (password) {
    const pass = req.body.password;
    const saltRounds = 10;
    const hashPass = await bcrypt.hash(pass, saltRounds);

    const updateUser = await userModel.findByIdAndUpdate(
      id,
      { password: hashPass },
      { new: true }
    );
    res.json(updateUser);
  } else {
    const updateUser = await userModel.findByIdAndUpdate(
      id,
      { userName, email, password: hashPass },
      { new: true }
    );
    res.json(updateUser);
  }
});

//update user using POST
app.post("/updateUser/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id);
  try {
    const { userName, email } = req.body;

    const updateUser = await userModel.findByIdAndUpdate(
      id,
      { userName, email },
      { new: true }
    );
    res.json(updateUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal server error");
  }
});

//static Routes
app.get("/login", async (req, res) => {
  res.render("login");
});

app.get("/signup", async (req, res) => {
  res.render("signup");
});

app.get("/home",async (req, res) => {
  try {
    // req.user now contains user information decoded from the JWT token
    const token = req.cookies.uid;
    const userData = getUser(token); // Validate and get user data from token

    if (!userData) {
      return res.status(401).send("Unauthorized: Invalid token");
    }
    // Render the home page with user information
    const user = await userModel.findById(userData._id);

    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("home", { userInfo: user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Internal server error");
  }
});


//loginUser
app.post("/login", async (req, res) => {
  try {
    // console.log(req.body.email);
    const check = await userModel.findOne({ email: req.body.email });
    // console.log("check", check);
    if (!check) {
      return res.send("email cannot found");
    }
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );

    if (isPasswordMatch) {
      const token = setUser(check);
      res.cookie("uid", token);
      // console.log(token)
      res.redirect("/home");
    } else {
      res.send("wrong password or username ");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("wrong details");
  }
});

try {
  app.listen(PORT, () => console.log(`server started at ${PORT}`));
} catch (err) {
  console.log("error hogya");
}
