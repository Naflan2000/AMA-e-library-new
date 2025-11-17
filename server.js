const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');  // for passwords
const app = express();
const PORT = 3000;

// Folders
const booksFolder = path.join(__dirname, 'books');
if (!fs.existsSync(booksFolder)) fs.mkdirSync(booksFolder);
const usersPath = path.join(__dirname, 'users.json');
const booksJsonPath = path.join(__dirname, 'books.json');

// Multer storage for safe filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'books'),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-').replace(/-+/g,'-');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === SIGNUP ===
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  let users = [];
  if(fs.existsSync(usersPath)) users = JSON.parse(fs.readFileSync(usersPath));
  if(users.find(u=>u.username===username)) return res.json({success:false,message:'Username exists'});
  const hashed = bcrypt.hashSync(password,10);
  users.push({username, password: hashed});
  fs.writeFileSync(usersPath, JSON.stringify(users,null,2));
  res.json({success:true});
});

// === LOGIN ===
app.post('/login', (req,res)=>{
  const { username, password } = req.body;
  if(!fs.existsSync(usersPath)) return res.json({success:false,message:'No users'});
  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u=>u.username===username);
  if(!user) return res.json({success:false,message:'User not found'});
  const match = bcrypt.compareSync(password,user.password);
  if(match) res.json({success:true});
  else res.json({success:false,message:'Wrong password'});
});

// === UPLOAD BOOK (ADMIN) ===
app.post('/upload', upload.single('file'), (req,res)=>{
  const { title, author, desc, category } = req.body;
  const file = req.file.filename;
  let books = [];
  if(fs.existsSync(booksJsonPath)) books = JSON.parse(fs.readFileSync(booksJsonPath));
  books.push({title, author, desc, category, file:'books/'+file, cover:''});
  fs.writeFileSync(booksJsonPath, JSON.stringify(books,null,2));
  res.json({success:true});
});

// === GET BOOKS ===
app.get('/books', (req,res)=>{
  if(fs.existsSync(booksJsonPath)){
    const books = JSON.parse(fs.readFileSync(booksJsonPath));
    res.json(books);
  } else res.json([]);
});

app.listen(PORT,()=>console.log(`Server running at http://localhost:${PORT}`));
