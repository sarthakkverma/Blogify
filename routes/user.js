const { Router } = require("express");
const User = require("../models/user");

const router = Router();

router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    await User.create({
      fullName,
      email,
      password,
    });
    return res.redirect("/user/signin");
  } catch (error) {
    if (error.code === 11000) {
      return res.render("signup", {
        error: "An account already exists with this email",
      });
    }
    return res.render("signup", {
      error: "Error creating account",
    });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    await Blog.deleteMany({ createdBy: user._id });
    await Comment.deleteMany({ createdBy: user._id });
    await User.deleteOne({ _id: user._id });
    res.clearCookie("token").redirect("/");
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user");
  }
});

router.get("/delete", async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/user/signin");
    }
    await Promise.all([
      Blog.deleteMany({ createdBy: req.user._id }),
      Comment.deleteMany({ createdBy: req.user._id }),
      User.findByIdAndDelete(req.user._id),
    ]);
    res.clearCookie("token");
    return res.redirect("/");
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).send("Error deleting account");
  }
});

module.exports = router;
