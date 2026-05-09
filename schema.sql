CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    bulk_discount_percent INT DEFAULT 0,
    gift_amount DECIMAL(10, 2) DEFAULT 0.00,
    recruitment_contact VARCHAR(255) DEFAULT '@YourID',
    recruitment_file_path VARCHAR(255) DEFAULT '/downloads/test-file.zip'
);

INSERT INTO settings (base_price, bulk_discount_percent, gift_amount, recruitment_contact, recruitment_file_path) VALUES (5000.00, 10, 0.00, '@YourID', '/downloads/test-file.zip');

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mangas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manga_id INT NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255),
    price DECIMAL(10, 2) NULL, -- If null or 0, uses settings.base_price
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);

CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE KEY user_chapter_unique (user_id, chapter_id)
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    manga_id INT NOT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);
