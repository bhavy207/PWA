const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    price: 199.99,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    stock: 50,
    rating: 4.5,
    tags: ["wireless", "bluetooth", "headphones", "music"],
    featured: true
  },
  {
    name: "Smart Fitness Watch",
    description: "Track your fitness goals with this smart watch featuring heart rate monitor, GPS, and waterproof design.",
    price: 249.99,
    category: "Wearables",
    images: ["https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=400&fit=crop"],
    stock: 35,
    rating: 4.3,
    tags: ["fitness", "smartwatch", "health", "GPS"],
    featured: true
  },
  {
    name: "Laptop Stand - Ergonomic",
    description: "Adjustable aluminum laptop stand for better ergonomics. Compatible with all laptop sizes from 10-17 inches.",
    price: 59.99,
    category: "Accessories",
    images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop"],
    stock: 100,
    rating: 4.7,
    tags: ["laptop", "stand", "ergonomic", "office"],
    featured: false
  },
  {
    name: "Wireless Charging Pad",
    description: "Fast wireless charging pad compatible with iPhone, Samsung, and other Qi-enabled devices.",
    price: 29.99,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop"],
    stock: 75,
    rating: 4.2,
    tags: ["wireless", "charging", "phone", "fast"],
    featured: false
  },
  {
    name: "Coffee Maker - Premium",
    description: "Professional-grade coffee maker with programmable timer and thermal carafe. Makes perfect coffee every time.",
    price: 149.99,
    category: "Home & Kitchen",
    images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop"],
    stock: 25,
    rating: 4.6,
    tags: ["coffee", "maker", "kitchen", "premium"],
    featured: true
  },
  {
    name: "Gaming Mouse - RGB",
    description: "High-precision gaming mouse with customizable RGB lighting and programmable buttons for competitive gaming.",
    price: 79.99,
    category: "Gaming",
    images: ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop"],
    stock: 60,
    rating: 4.4,
    tags: ["gaming", "mouse", "RGB", "precision"],
    featured: false
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Waterproof portable speaker with 20-hour battery life and crystal clear sound quality.",
    price: 89.99,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop"],
    stock: 45,
    rating: 4.3,
    tags: ["bluetooth", "speaker", "portable", "waterproof"],
    featured: true
  },
  {
    name: "Desk Organizer Set",
    description: "Bamboo desk organizer set with multiple compartments for pens, papers, and office supplies.",
    price: 39.99,
    category: "Office",
    images: ["https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop"],
    stock: 80,
    rating: 4.1,
    tags: ["desk", "organizer", "bamboo", "office"],
    featured: false
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa-ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    console.log('Sample products added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
