const pool = require('./pool');

const createTables = async () => {
    try {
        // Create categories table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                image_url VARCHAR(255) DEFAULT '/images/placeholder-category.jpg'
            )
        `);

        // Create items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                image_url VARCHAR(255) DEFAULT '/images/placeholder-item.jpg'
            )
        `);

        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

const populateTables = async () => {
    try {
        // Clear existing data
        await pool.query('DELETE FROM items');
        await pool.query('DELETE FROM categories');

        // Populate categories
        const categoriesQuery = `
            INSERT INTO categories (name, description, image_url) VALUES 
            ('Produce', 'Fresh fruits and vegetables', '/images/produce-category.jpg'),
            ('Dairy', 'Milk, cheese, and eggs', '/images/dairy-category.jpg'),
            ('Bakery', 'Bread, pastries, and cakes', '/images/bakery-category.jpg'),
            ('Meat', 'Fresh and frozen meats', '/images/meat-category.jpg'),
            ('Pantry', 'Canned goods and dry goods', '/images/pantry-category.jpg')
        `;
        await pool.query(categoriesQuery);

        // Get category IDs
        const categoriesResult = await pool.query('SELECT id, name FROM categories');
        const categoryMap = categoriesResult.rows.reduce((acc, category) => {
            acc[category.name] = category.id;
            return acc;
        }, {});

        // Populate items
        const itemsQuery = `
            INSERT INTO items (name, category_id, description, price, stock_quantity, image_url) VALUES 
            ('Apples', $1, 'Fresh red apples', 1.99, 100, '/images/apples.jpg'),
            ('Bananas', $1, 'Ripe yellow bananas', 0.99, 150, '/images/bananas.jpg'),
            ('Milk', $2, 'Whole milk, 1 gallon', 3.49, 50, '/images/milk.jpg'),
            ('Cheese', $2, 'Cheddar cheese block', 4.99, 30, '/images/cheese.jpg'),
            ('Bread', $3, 'Whole wheat bread', 2.49, 40, '/images/bread.jpg'),
            ('Croissant', $3, 'Butter croissant', 1.99, 25, '/images/croissant.jpg'),
            ('Chicken Breast', $4, 'Boneless, skinless', 5.99, 75, '/images/chicken.jpg'),
            ('Ground Beef', $4, 'Lean ground beef', 6.49, 60, '/images/ground-beef.jpg'),
            ('Pasta', $5, 'Spaghetti, 1 lb package', 1.49, 100, '/images/pasta.jpg'),
            ('Canned Tomatoes', $5, 'Diced tomatoes', 1.29, 80, '/images/canned-tomatoes.jpg')
        `;
        await pool.query(itemsQuery, [
            categoryMap['Produce'], 
            categoryMap['Dairy'], 
            categoryMap['Bakery'], 
            categoryMap['Meat'], 
            categoryMap['Pantry']
        ]);

        console.log('Tables populated successfully');
    } catch (err) {
        console.error('Error populating tables:', err);
    } finally {
        // Close the pool connection
        await pool.end();
    }
};

// Run the setup
const runSetup = async () => {
    try {
        await createTables();
        await populateTables();
    } catch (err) {
        console.error('Setup failed:', err);
    }
};

runSetup();