require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const AssetCategory = require('./models/AssetCategory');
const Asset = require('./models/Asset');
const Allocation = require('./models/Allocation');

const seed = async () => {
  await connectDB();

  // Clear existing data (drop collections to reset indexes)
  await mongoose.connection.dropDatabase();

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
  const electronics = await AssetCategory.create({ name: 'Electronics', description: 'Electronic devices and equipment', customFields: { warrantyPeriod: 'months' }, status: 'active' });
  const furniture = await AssetCategory.create({ name: 'Furniture', description: 'Office furniture', status: 'active' });
  const vehicles = await AssetCategory.create({ name: 'Vehicles', description: 'Company vehicles', status: 'active' });

  // Create sample assets (some bookable)
  const macbook = await Asset.create({ name: 'MacBook Pro 16"', category: electronics._id, serialNumber: 'SN-MBP-001', acquisitionDate: '2025-01-15', acquisitionCost: 3499, condition: 'new', location: 'Building A - Floor 3', isBookable: false, status: 'available', department: dept._id });
  const dellMonitor = await Asset.create({ name: 'Dell Monitor 27"', category: electronics._id, serialNumber: 'SN-DM-002', acquisitionDate: '2025-02-10', acquisitionCost: 599, condition: 'good', location: 'Building A - Floor 3', isBookable: false, status: 'available', department: dept._id });
  const confRoom = await Asset.create({ name: 'Conference Room B2', category: furniture._id, serialNumber: 'CR-B2-001', acquisitionDate: '2024-06-01', acquisitionCost: 5000, condition: 'good', location: 'Building B - Room 2', isBookable: true, status: 'available', department: dept._id });
  const projector = await Asset.create({ name: 'Projector Epson', category: electronics._id, serialNumber: 'SN-PROJ-003', acquisitionDate: '2024-08-20', acquisitionCost: 1200, condition: 'good', location: 'Building B - AV Room', isBookable: true, status: 'available' });
  const desk = await Asset.create({ name: 'Standing Desk', category: furniture._id, serialNumber: 'SN-SD-004', acquisitionDate: '2025-03-01', acquisitionCost: 850, condition: 'new', location: 'Building A - Floor 2', isBookable: false, status: 'available', department: dept._id });
  const camry = await Asset.create({ name: 'Toyota Camry (Fleet)', category: vehicles._id, serialNumber: 'SN-TOY-005', acquisitionDate: '2024-01-10', acquisitionCost: 28000, condition: 'good', location: 'Parking Garage', isBookable: true, status: 'available' });

  // Allocate MacBook to employee so they have an asset to transfer
  macbook.status = 'allocated';
  macbook.currentHolder = employee._id;
  macbook.department = dept._id;
  await macbook.save();
  await Allocation.create({
    asset: macbook._id, employee: employee._id, department: dept._id,
    allocatedBy: assetManager._id, allocatedDate: new Date(),
    expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'active', notes: 'Initial seed allocation'
  });

  console.log('\n=== Seed Complete ===\n');
  console.log('Admin:           admin@assetflow.com / password123');
  console.log('Asset Manager:   manager@assetflow.com / password123');
  console.log('Department Head: head@assetflow.com / password123');
  console.log('Employee:        employee@assetflow.com / password123');
  console.log(`\nDepartment: "${dept.name}" created with "${deptHead.name}" as head`);
  console.log('Categories: Electronics, Furniture, Vehicles');
  console.log(`MacBook Pro allocated to "${employee.name}" for transfer testing\n`);

  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
