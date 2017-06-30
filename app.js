
var bodyParser = require("body-parser"),
methodOverride = require("method-override"),
expressSanitizer = require("express-sanitizer"),
mongoose       = require("mongoose"),
passport       = require("passport"),
LocalStrategy  = require("passport-local"),
User           = require("./models/user"),
express        = require("express"),
app            = express();


//APP CONFIG
//mongoose.connect("mongodb://localhost/restful_blog_app");
mongoose.connect("mongodb://tester:tester@ds139262.mlab.com:39262/simpleblogapp");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(expressSanitizer());


//PASSPORT CONGIF
app.use(require("express-session")({
    secret: "Go Dodgers!!!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// MONGOOSE/MODEL CONFIG
var blogSchema  = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog", blogSchema);


app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});


//INDEX ROUTES
app.get("/", function(req,res){
   res.redirect("/blogs"); 
});

app.get("/blogs", function(req,res){
    
    Blog.find({},function(err, blogs){
        if(err)
        {
            console.log(err);
        } 
        else 
        {
             res.render("index", {blogs: blogs});
        }
    });
   
});

// NEW/CREATE ROUTE
app.get("/blogs/new", isLoggedIn,function(reg,res){
   res.render("new"); 
});

//CREATE ROUTE
app.post("/blogs", isLoggedIn, function(req,res){
   //CREATE BLOG
   req.body.blog.body = req.sanitize(req.body.blog.body);
   Blog.create(req.body.blog,function(err, newBlog){
       if(err)
       {
           res.render("new");
       }
       else
       {
             //redirect to index
           res.redirect("/blogs");
       }
   });
 
});

//SHOW ROUTE
app.get("/blogs/:id", function(req,res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err)
        {
            res.redirect("/blogs");
        }
        else
        {
            res.render("show", {blog:foundBlog});
        }
    });
});
// EDIT ROUTE
app.get("/blogs/:id/edit",function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err)
        {
            res.redirect("/blogs");
        }
        else
        {
            res.render("edit",{blog: foundBlog});
        }
    });
});

//UPDATE ROUTE
app.put("/blogs/:id", isLoggedIn,  function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
      if(err)
      {
          res.redirect("/blogs");
      }
      else
      {
          res.redirect("/blogs/" + req.params.id);
      }
    });
});

//DELETE ROUTE
app.delete("/blogs/:id", isLoggedIn, function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err){
      if(err)
      {
          res.redirect("/blogs");
      }
      else
      {
          res.redirect("/blogs/");
      }
    });
 });


//AUTHENTICATION ROUTES

//show register form
app.get("/register", isLoggedIn, function (req,res){
    res.render("register");
});

//handle sign up logic
app.post("/register", isLoggedIn, function(req,res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function (err, user){
        if(err)
        {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req,res, function(){
            res.redirect("/blogs");
        })
    })
});

//show login form
app.get("/login", function(req,res){
    res.render("login");
});

//handle login logic
app.post("/login",passport.authenticate("local", 
{
    successRedirect: "/blogs",
    failureRedirect:"/login"
    
    }), function(req,res){

});


//logout logic 
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/blogs");
})

function isLoggedIn(req,res,next)
{
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("SERVER IS RUNNING!"); 
});