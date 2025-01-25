const pool = require('../db/pool');

exports.getAllItems = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                items.*, 
                categories.name AS category_name,
                CAST(items.price AS NUMERIC) AS price,
                CAST(items.stock_quantity AS INTEGER) AS stock_quantity
            FROM items 
            JOIN categories ON items.category_id = categories.id
        `);
        
        // Ensure price and stock_quantity are numbers
        const processedItems = result.rows.map(item => ({
            ...item,
            price: parseFloat(item.price),
            stock_quantity: parseInt(item.stock_quantity, 10)
        }));
        
        res.render('items/index', { 
            items: processedItems,
            title: 'All Items' 
        });
    } catch (err) {
        console.error('Error in getAllItems:', err);
        res.status(500).render('error', { 
            message: 'Error fetching items', 
            error: err 
        });
    }
};

exports.getNewItemForm = async (req, res) => {
    try {
        const categoriesResult = await pool.query('SELECT * FROM categories');
        
        res.render('items/new', { 
            categories: categoriesResult.rows,
            title: 'Add New Item',
            error: null,
            formData: null
        });
    } catch (err) {
        console.error('Error rendering new item form:', err);
        res.status(500).render('error', { 
            message: 'Error loading new item form', 
            error: err 
        });
    }
};

exports.getItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Fetch item details with category name
        const result = await pool.query(`
            SELECT 
                items.*, 
                categories.name AS category_name 
            FROM items 
            JOIN categories ON items.category_id = categories.id 
            WHERE items.id = $1
        `, [itemId]);

        // Check if item exists
        if (result.rows.length === 0) {
            return res.status(404).render('error', { 
                message: 'Item not found', 
                error: { status: 404 } 
            });
        }

        // Render item details view
        res.render('items/view', { 
            item: result.rows[0],
            title: result.rows[0].name 
        });
    } catch (err) {
        console.error('Error fetching item details:', err);
        res.status(500).render('error', { 
            message: 'Error loading item details', 
            error: err 
        });
    }
};

exports.getEditItemForm = async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Fetch categories and item details concurrently
        const [categoriesResult, itemResult] = await Promise.all([
            pool.query('SELECT * FROM categories'),
            pool.query('SELECT * FROM items WHERE id = $1', [itemId])
        ]);

        // Check if item exists
        if (itemResult.rows.length === 0) {
            return res.status(404).render('error', { 
                message: 'Item not found', 
                error: { status: 404 } 
            });
        }

        res.render('items/edit', { 
            categories: categoriesResult.rows,
            item: itemResult.rows[0],
            title: 'Edit Item',
            error: null,
            formData: null
        });
    } catch (err) {
        console.error('Error fetching item for edit:', err);
        res.status(500).render('error', { 
            message: 'Error loading item edit form', 
            error: err 
        });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { name, category_id, description, price, stock_quantity, image_url } = req.body;
        
        // Validate required fields
        if (!name || !category_id || !price || !stock_quantity) {
            const categoriesResult = await pool.query('SELECT * FROM categories');
            return res.render('items/new', {
                title: 'Add New Item',
                categories: categoriesResult.rows,
                error: 'All fields except image URL are required',
                formData: req.body
            });
        }

        // Use default image if not provided
        const finalImageUrl = (image_url && image_url.trim() !== '') 
            ? image_url 
            : '/images/placeholder-item.jpg';

        // Insert the new item
        const result = await pool.query(
            'INSERT INTO items (name, category_id, description, price, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', 
            [name.trim(), category_id, description, price, stock_quantity, finalImageUrl]
        );

        // Redirect to the newly created item
        res.redirect(`/items/${result.rows[0].id}`);
    } catch (err) {
        console.error('Error creating item:', err);
        
        // Fetch categories again for the form
        const categoriesResult = await pool.query('SELECT * FROM categories');
        
        // Handle specific error cases
        if (err.code === '23503') {  // foreign key violation
            return res.render('items/new', {
                title: 'Add New Item',
                categories: categoriesResult.rows,
                error: 'Invalid category selected',
                formData: req.body
            });
        }

        // Generic error handling
        res.status(500).render('error', { 
            message: 'Unexpected error creating item', 
            error: err 
        });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, category_id, description, price, stock_quantity, image_url } = req.body;
        
        // Validate required fields
        if (!name || !category_id || !price || !stock_quantity) {
            // Fetch categories and the current item
            const [categoriesResult, itemResult] = await Promise.all([
                pool.query('SELECT * FROM categories'),
                pool.query('SELECT * FROM items WHERE id = $1', [itemId])
            ]);

            return res.render('items/edit', {
                title: 'Edit Item',
                categories: categoriesResult.rows,
                item: itemResult.rows[0],
                error: 'All fields except image URL are required',
                formData: req.body
            });
        }

        // Use default image if not provided
        const finalImageUrl = (image_url && image_url.trim() !== '') 
            ? image_url 
            : '/images/placeholder-item.jpg';

        // Update the item
        await pool.query(
            'UPDATE items SET name = $1, category_id = $2, description = $3, price = $4, stock_quantity = $5, image_url = $6 WHERE id = $7', 
            [name.trim(), category_id, description, price, stock_quantity, finalImageUrl, itemId]
        );

        // Redirect to the item details page
        res.redirect(`/items/${itemId}`);
    } catch (err) {
        console.error('Error updating item:', err);
        
        // Fetch categories again for the form
        const categoriesResult = await pool.query('SELECT * FROM categories');
        
        // Handle specific error cases
        if (err.code === '23503') {  // foreign key violation
            return res.render('items/edit', {
                title: 'Edit Item',
                categories: categoriesResult.rows,
                error: 'Invalid category selected',
                formData: req.body
            });
        }

        // Generic error handling
        res.status(500).render('error', { 
            message: 'Unexpected error updating item', 
            error: err 
        });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Delete the item
        const result = await pool.query('DELETE FROM items WHERE id = $1', [itemId]);
        
        // Redirect to items list
        res.redirect('/items');
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).render('error', { 
            message: 'Error deleting item', 
            error: err 
        });
    }
};