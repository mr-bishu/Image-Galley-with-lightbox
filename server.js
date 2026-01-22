const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));

// serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// simple sqlite DB
const db = new sqlite3.Database(path.join(__dirname, 'users.db'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function createToken(payload){
  return jwt.sign(payload, JWT_SECRET, {expiresIn: '7d'});
}

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({error: 'Email and password required'});
  try{
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [name||'', email, hash], function(err){
      if(err) return res.status(400).json({error: 'Email already in use'});
      const user = { id: this.lastID, name: name||'', email };
      const token = createToken({id: user.id, email: user.email});
      res.json({user, token});
    });
  }catch(e){ res.status(500).json({error: 'Server error'}); }
});

app.post('/api/login', (req, res)=>{
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({error: 'Email and password required'});
  db.get('SELECT id,name,email,password_hash FROM users WHERE email = ?', [email], async (err, row)=>{
    if(err) return res.status(500).json({error:'Server error'});
    if(!row) return res.status(401).json({error:'Invalid credentials'});
    const match = await bcrypt.compare(password, row.password_hash);
    if(!match) return res.status(401).json({error:'Invalid credentials'});
    const user = { id: row.id, name: row.name, email: row.email };
    const token = createToken({id: user.id, email: user.email});
    res.json({user, token});
  });
});

app.get('/api/me', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ','');
  if(!token) return res.status(401).json({error:'Not authenticated'});
  jwt.verify(token, JWT_SECRET, (err, payload)=>{
    if(err) return res.status(401).json({error:'Invalid token'});
    db.get('SELECT id,name,email,created_at FROM users WHERE id = ?', [payload.id], (err,row)=>{
      if(err || !row) return res.status(401).json({error:'Not found'});
      res.json({user:row});
    });
  });
});

app.listen(PORT, ()=> console.log('Server running on http://localhost:'+PORT));
