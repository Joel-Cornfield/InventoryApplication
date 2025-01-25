const pool = require('../db/pool');

exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT categories.*, 
                   COUNT(items.id) AS item_count 
            FROM categories 
            LEFT JOIN items ON categories.id = items.category_id 
            GROUP BY categories.id
        `);
        res.render('categories/index', { 
            categories: result.rows,
            title: 'All Categories' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            message: 'Error fetching categories', 
            error: err 
        });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Validate input
        if (!categoryId || isNaN(categoryId)) {
            return res.status(400).render('error', { 
                message: 'Invalid category ID', 
                error: { status: 400 } 
            });
        }

        // First, check if category exists
        const categoryResult = await pool.query(
            'SELECT * FROM categories WHERE id = $1', 
            [categoryId]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(404).render('error', { 
                message: 'Category not found', 
                error: { status: 404 } 
            });
        }

        // Then get items for this category
        const itemsResult = await pool.query(
            `SELECT 
                items.*, 
                CAST(items.price AS NUMERIC) AS price,
                CAST(items.stock_quantity AS INTEGER) AS stock_quantity
            FROM items 
            WHERE category_id = $1`, 
            [categoryId]
        );
        
        // Ensure price and stock_quantity are numbers
        const processedItems = itemsResult.rows.map(item => ({
            ...item,
            price: parseFloat(item.price),
            stock_quantity: parseInt(item.stock_quantity, 10)
        }));
        
        res.render('categories/view', { 
            category: categoryResult.rows[0], 
            items: processedItems,
            title: categoryResult.rows[0].name 
        });
    } catch (err) {
        console.error('Error in getCategory:', err);
        res.status(500).render('error', { 
            message: 'Error fetching category details', 
            error: err 
        });
    }
};

exports.getNewCategoryForm = (req, res) => {
    try {
        res.render('categories/new', { 
            title: 'Add New Category',
            error: null
        });
    } catch (err) {
        console.error('Error rendering new category form:', err);
        res.status(500).render('error', { 
            message: 'Error loading new category form', 
            error: err 
        });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, image_url } = req.body;
        
        // Validate required fields
        if (!name || name.trim() === '') {
            return res.render('categories/new', {
                title: 'Add New Category',
                error: 'Category name is required',
                formData: req.body
            });
        }

        // Use default image if not provided
        const finalImageUrl = (image_url && image_url.trim() !== '') 
            ? image_url 
            : '/images/placeholder-category.jpg';

        // Insert the new category
        const result = await pool.query(
            'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) RETURNING id', 
            [name.trim(), description, finalImageUrl]
        );

        // Redirect to the newly created category
        res.redirect(`/categories/${result.rows[0].id}`);
    } catch (err) {
        console.error('Error creating category:', err);
        
        // Check for unique constraint violation
        if (err.code === '23505') {
            return res.render('categories/new', {
                title: 'Add New Category',
                error: 'A category with this name already exists',
                formData: req.body
            });
        }

        // Generic error handling
        res.status(500).render('error', { 
            message: 'Unexpected error creating category', 
            error: err 
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description, image_url } = req.body;
        await pool.query(
            'UPDATE categories SET name = $1 , description = $2, image_url = $3 WHERE id = $4', 
            [name, description, image_url, categoryId]
        );
        res.redirect(`/categories/${categoryId}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            message: 'Error updating category', 
            error: err 
        });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
        res.redirect('/categories');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            message: 'Error deleting category', 
            error: err 
        });
    }
};