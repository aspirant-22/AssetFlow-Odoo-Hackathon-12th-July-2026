require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const AssetCategory = require('./models/AssetCategory');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Department.deleteMany({});
  await AssetCategory.deleteMany({});

  // Create Department
  const dept = await Department.create({
    name: 'Engineering',
    description: 'Software Engineering Department',
    status: 'active'
  });

  // Create Users (passwords are hashed by the User model's pre-save hook)
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@assetflow.com',
    password: 'password123',
    role: 'admin',
    department: dept._id,
    status: 'active'
  });

  const assetManager = await User.create({
    name: 'Asset Manager',
    email: 'manager@assetflow.com',
    password: 'password123',
    role: 'asset_manager',
    department: dept._id,
    status: 'active'
  });

  const deptHead = await User.create({
    name: 'Department Head',
    email: 'head@assetflow.com',
    password: 'password123',
    role: 'department_head',
    department: dept._id,
    status: 'active'
  });

  const employee = await User.create({
    name: 'Employee User',
    email: 'employee@assetflow.com',
    password: 'password123',
    role: 'employee',
    department: dept._id,
    status: 'active'
  });

  // Set department head
  dept.head = deptHead._id;
  await dept.save();

  // Create sample asset categories
  await AssetCategory.create({ name: 'Electronics', description: 'Electronic devices and equipment', customFields: { warrantyPeriod: 'months' }, status: 'active' });
  await AssetCategory.create({ name: 'Furniture', description: 'Office furniture', status: 'active' });
  await AssetCategory.create({ name: 'Vehicles', description: 'Company vehicles', status: 'active' });

  console.log('\n=== Seed Complete ===\n');
  console.log('Admin:           admin@assetflow.com / password123');
  console.log('Asset Manager:   manager@assetflow.com / password123');
  console.log('Department Head: head@assetflow.com / password123');
  console.log('Employee:        employee@assetflow.com / password123');
  console.log(`\nDepartment: "${dept.name}" created with "${deptHead.name}" as head`);
  console.log('Categories: Electronics, Furniture, Vehicles\n');

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
