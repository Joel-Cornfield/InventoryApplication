const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Error handling
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Pool
const pool = require('./db/pool');

// Routes
const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Home Route
app.get('/', async (req, res) => {
    try {
        const categoriesResult = await pool.query('SELECT * FROM categories');
        const itemCountResult = await pool.query(`
            SELECT category_id, COUNT(*) as item_count 
            FROM items 
            GROUP BY category_id
        `);
        
        // Create a map of category item counts
        const itemCountMap = itemCountResult.rows.reduce((acc, curr) => {
            acc[curr.category_id] = curr.item_count;
            return acc;
        }, {});

        // Attach item count to categories
        const categoriesWithCount = categoriesResult.rows.map(category => ({
            ...category,
            item_count: itemCountMap[category.id] || 0
        }));

        res.render('home', { 
            categories: categoriesWithCount,
            title: 'Supermarket Inventory' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            message: 'Error fetching categories', 
            error: err 
        });
    }
});

// Mount Routes
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        message: 'Something broke!', 
        error: err 
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('error', { 
        message: 'Page Not Found', 
        error: { status: 404 } 
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});