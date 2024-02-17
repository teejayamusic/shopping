const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001;
const jwt = require('jsonwebtoken');

const secretKey = 'hello1234';

const db = mysql.createConnection({
  host: 'sql6.freesqldatabase.com',
  user: 'sql6684809',
  password: '7pbcALPYXe',
  database: 'sql6684809',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});

app.use(bodyParser.json());










app.use(cors());



app.options('*', cors()); // Enable preflight requests for all routes


app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});




app.post('/api/register', (req, res) => {
  const { username, password, name, number, address } = req.body;

  const sql = 'INSERT INTO user (username, password, name, number, address) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [username, password, name, number, address], (err, result) => {
    if (err) {
      console.error('Error registering user: ', err);
      res.status(500).send('Error registering user');
    } else {
      console.log('User registered successfully');

      // Generate JWT token
      const token = jwt.sign({ id: result.insertId, username }, secretKey, { expiresIn: '400h' });

      // Send the token back to the client (optional)
      res.status(200).json({ message: 'User registered successfully', token });
    }
  });
});



app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM user WHERE username = ?';

  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error logging in: ', err);
      res.status(500).send('Error logging in');
    } else {
      if (results.length === 0) {
        // User not found
        res.status(401).json({ message: 'Invalid username or password' });
      } else {
        const user = results[0];
        if (password === user.password) {
          // Passwords match, login successful
          // Generate JWT token
          const token = jwt.sign({ id: user.id, username }, secretKey, { expiresIn: '400h' });

          // Send the token back to the client (optional)
          res.status(200).json({ message: 'Login successful', token });
        } else {
          // Passwords don't match
          res.status(401).json({ message: 'Invalid username or password' });
        }
      }
    }
  });
});











const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};










app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'payment=(self)');
  next();
});



app.use('/items', verifyToken); // Apply middleware to item-related routes




app.get('/username', verifyToken, (req, res) => {
  const username = req.user.username;
  res.status(200).json({ username });
});


app.post('/items/upload', (req, res) => {
  const { title, img_url,price,gender,type,description } = req.body;
  const user_id = req.user.id; // Assuming you use the username as the user_id
const username=req.user.username;
  const sql = 'INSERT INTO items (title, img_url, user_id,username,price,gender,type,description) VALUES (?,?,?,?,?,?,?,? )';
  db.query(sql, [title, img_url,user_id,username,price,gender,type,description], (err, result) => {
    if (err) {
      console.error('Error uploading item: ', err);
      res.status(500).send('Error uploading item');
    } else {
      console.log('Item uploaded successfully');
      res.status(200).json({ message: 'Item uploaded successfully' });
    }
  });
});


app.get('/items/user/:username', async (req, res) => {
  
const username=req.user.username;

  const sql = 'SELECT * FROM items WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error retrieving items: ', err);
      res.status(500).send('Error retrieving items');
    } else {
      res.status(200).json(results);
    }
  });
});






// GET request to retrieve all items
app.get('/items/all', (req, res) => {
  const sql = 'SELECT * FROM items';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error retrieving all items: ', err);
      res.status(500).send('Error retrieving all items');
    } else {
      res.status(200).json(results);
    }
  });
});

app.get('/items/fetch/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const sql = 'SELECT * FROM items WHERE id = ?';
  db.query(sql, [itemId], (err, results) => {
    if (err) {
      console.error('Error retrieving item by ID: ', err);
      res.status(500).send('Error retrieving item by ID');
    } else {
      if (results.length === 0) {
        res.status(404).send('Item not found');
      } else {
        res.status(200).json(results[0]);
      }
    }
  });
});


app.post('/cart/add', (req, res) => {
    const { user_id, product_id, quantity } = req.body;
  
    // First, fetch product details based on product_id
    const getProductSql = 'SELECT title, img_url,price FROM items WHERE id = ?';
    db.query(getProductSql, [product_id], (getProductErr, productResult) => {
      if (getProductErr) {
        console.error('Error fetching product details: ', getProductErr);
        res.status(500).send('Error fetching product details');
      } else {
        const { title, img_url,price} = productResult[0];
  const status='pending'
        // Now, insert the item into the cart_items table
        const insertIntoCartSql = 'INSERT INTO cart_items (user_id, product_id, quantity, title, img_url,price,status) VALUES (?, ?, ?, ?, ?,?,?)';
        db.query(
          insertIntoCartSql,
          [user_id, product_id, quantity, title, img_url,price,status],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Error adding item to cart: ', insertErr);
              res.status(500).send('Error adding item to cart');
            } else {
              console.log('Item added to cart successfully');
              res.status(200).json({ message: 'Item added to cart successfully' });
            }
          }
        );
      }
    });
  });
  










  app.delete('/cart/delete/:itemId', (req, res) => {
    const itemId = req.params.itemId;
    const userid=req.user.id
    if (!itemId) {
      return es.status(400).send('User ID is required');
    }
    if (!userid) {
      return res.status(400).send('User ID is required');
    }
    // Delete the item from the cart_items table based on its ID
    const deleteItemSql = 'DELETE FROM cart_items WHERE (product_id,user_id) = (?,?)';
    db.query(deleteItemSql, [itemId,userid], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('Error deleting item from cart: ', deleteErr);
        res.status(500).send('Error deleting item from cart');
      } else {
        console.log('Item deleted from cart successfully');
        res.status(200).json({ message: 'Item deleted from cart successfully' });
      }
    });
  });
  








app.get('/cart/items', verifyToken, async (req, res) => {
  const user_id = req.user.id; // Assuming you use the username as the user_id

  if (!user_id) {
    return res.status(400).send('User ID is required');
  }

  const sql = 'SELECT * FROM cart_items WHERE user_id = ?';

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error retrieving cart items: ', err);
      res.status(500).send('Error retrieving cart items');
    } else {
      res.status(200).json(results);
    }
  });
});
app.post('/cart/buy', verifyToken, (req, res) => {
  const user_id = req.user.id; // Assuming you use the username as the user_id
  const { razorpay_payment_id } = req.body;

  if (!user_id) {
    return res.status(400).send('User ID is required');
  }

  const sql = 'UPDATE cart_items SET status = "bought" WHERE user_id = ?';

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error('Error updating items status: ', err);
      res.status(500).send('Error updating items status');
    } else {
      console.log('Items marked as success');
      res.status(200).json({ message: 'Items marked as success' });
    }
  });
});


app.put('/user/update', verifyToken, (req, res) => {
  const { id, name, number, address } = req.body;

  const sql = 'UPDATE user SET name = ?, number = ?, address = ? WHERE id = ?';

  db.query(sql, [name, number, address, id], (err, result) => {
    if (err) {
      console.error('Error updating user details: ', err);
      res.status(500).send('Error updating user details');
    } else {
      console.log('User details updated successfully');
      res.status(200).json({ message: 'User details updated successfully' });
    }
  });
});


app.get('/user/details', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM user WHERE id = ?';

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error('Error retrieving user details: ', err);
      res.status(500).send('Error retrieving user details');
    } else {
      console.log('User details retrieved successfully');
      res.status(200).json({ user: results[0] });
    }
  });
});
