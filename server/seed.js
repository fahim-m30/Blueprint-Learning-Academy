const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Course = require('./models/Course');
const SiteSettings = require('./models/SiteSettings');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careerpathacademy';

const coursesData = [
  {
    title: 'Real Estate Job Interview Success',
    slug: 'real-estate-job-interview-success',
    category: 'Career Preparation & Interview',
    shortDescription: 'Master CV preparation, BNBC/RAJUK basics, technical interview questions, and salary negotiation.',
    fullDescription: 'Designed specifically for fresh civil engineering graduates and junior site engineers seeking employment in leading real estate and construction developer companies in Bangladesh. Learn how to craft a high-impact engineering CV, handle technical interviews on concrete, rebar, QA/QC, and negotiate competitive salaries.',
    durationDays: 30,
    totalClasses: 8,
    price: 999,
    regularPrice: 1999,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-interview-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'CV Mistakes and Evaluation', topics: ['Purpose of an engineering CV', 'Common red flags', 'Self-evaluation checklist'] },
      { classNumber: 2, title: 'Live CV Building Workshop', topics: ['Structuring site experience', 'Technical skills section', 'Tailoring CV to job circulars'] },
      { classNumber: 3, title: 'Job Search & HR Communication', topics: ['LinkedIn networking', 'Cover letter drafting', 'Follow-up etiquette with HR'] },
      { classNumber: 4, title: 'Industry, Roles & Developer Business Models', topics: ['How developers operate', 'Landowner-developer joint venture agreements', 'Site engineer responsibilities'] },
      { classNumber: 5, title: 'Building Codes: BNBC, RAJUK & Approval Process', topics: ['BNBC structural requirements', 'RAJUK plan clearances', 'Occupancy certificates'] },
      { classNumber: 6, title: 'General HR Interview Preparation', topics: ['Professional introduction', 'Overcoming zero experience hurdles', 'Behavioral questions'] },
      { classNumber: 7, title: 'Technical Interview Masterclass', topics: ['Concrete mix questions', 'BBS verification', 'Soil report reading', 'Site problem-solving'] },
      { classNumber: 8, title: 'Salary Negotiation & Live Mock Interview', topics: ['Market salary benchmark in BD', 'Negotiation tactics', 'Live mock interview sessions'] },
    ],
    videos: [
      {
        title: 'Class 01: CV Writing for Bangladeshi Real Estate Firms',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '45 mins',
        note: 'Review the sample CV template attached in the course materials before next session.',
      },
      {
        title: 'Class 02: Essential BNBC & RAJUK Compliance Guidelines',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '50 mins',
        note: 'Download the BNBC summary sheet from the resources tab.',
      },
    ],
    liveClasses: [
      {
        title: 'Live Technical Mock Interview & Q&A Session',
        classDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        classTime: '08:30 PM (BST)',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        platform: 'Google Meet',
        note: 'Keep your video on and draft CV ready for live screening.',
      },
    ],
    tasks: [
      {
        title: 'Assignment 1: Draft Your One-Page Civil Engineering CV',
        description: 'Prepare your updated CV in PDF format incorporating the action verbs and project experience guidelines discussed in Class 1 & 2. Paste your Google Drive link here.',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        points: 100,
      },
    ],
  },
  {
    title: 'Essential Software for Construction Engineers',
    slug: 'essential-software-for-construction-engineers',
    category: 'Engineering Software & Tools',
    shortDescription: 'Excel for BOQ and BBS, AutoCAD 2D reading, and MS Project scheduling fundamentals.',
    fullDescription: 'Hands-on training in industry-standard software required on every construction project in Bangladesh: Microsoft Excel for material consumption and subcontractor billing, AutoCAD 2D for verifying site dimensions and structural details, and Microsoft Project for progress scheduling.',
    durationDays: 30,
    totalClasses: 8,
    price: 699,
    regularPrice: 1399,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-software-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'Excel Foundations for Civil Engineering', topics: ['Formulas for site calculations', 'Data validation', 'Conditional formatting'] },
      { classNumber: 2, title: 'Excel for Quantity Takeoff & BBS', topics: ['Formulas for rebar cutting length', 'Material consumption sheets', 'Unit conversions (cft, sft, kg, ton)'] },
      { classNumber: 3, title: 'Excel for Subcontractor Billing & Cost Control', topics: ['BOQ sheets', 'Running account (RA) bills', 'Budget tracking'] },
      { classNumber: 4, title: 'AutoCAD 2D Fundamentals for Site Engineers', topics: ['Interface and layer manipulation', 'Measuring dimensions', 'Checking levels and coordinates'] },
      { classNumber: 5, title: 'Reading Architectural & Structural AutoCAD Files', topics: ['Extracting column/beam coordinates', 'Identifying discipline clashes', 'Exporting to PDF'] },
      { classNumber: 6, title: 'MS Project I: Building a Baseline Schedule', topics: ['Setting up calendars', 'Task dependencies (FS, SS)', 'Critical path analysis'] },
      { classNumber: 7, title: 'MS Project II: Tracking Progress & Delay Analysis', topics: ['Updating actual vs planned', 'Resource allocation', 'Generating S-curves'] },
      { classNumber: 8, title: 'PowerPoint & Site Handover Presentation Pack', topics: ['Weekly site progress reports', 'Snagging presentation', 'Executive dashboard'] },
    ],
    videos: [
      {
        title: 'Class 01: Creating Automated BBS Spreadsheet in Excel',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '52 mins',
        note: 'Make sure to download the exercise spreadsheet.',
      },
    ],
    liveClasses: [
      {
        title: 'AutoCAD Live Drawing Coordination Workshop',
        classDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        classTime: '09:00 PM (BST)',
        meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
        platform: 'Google Meet',
        note: 'Have AutoCAD installed on your computer.',
      },
    ],
    tasks: [
      {
        title: 'Assignment 1: Build a Subcontractor RA Bill Sheet in Excel',
        description: 'Create an automated bill calculation sheet for rebar binding and shuttering work with formulas for deduction and net payable amount.',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        points: 100,
      },
    ],
  },
  {
    title: 'A-Z Knowledge for Project Engineering',
    slug: 'a-z-knowledge-for-project-engineering',
    category: 'Site Engineering & Execution',
    shortDescription: 'From soil testing and foundation to finishing, subcontractors, and site handover.',
    fullDescription: 'Comprehensive 2-month flagship masterclass covering the complete real estate building lifecycle: reading architectural, structural, plumbing, and electrical drawings; deep foundation execution; rebar, concrete, masonry, plaster, finishing QA/QC, and managing subcontractors on site.',
    durationDays: 60,
    totalClasses: 12,
    price: 2499,
    regularPrice: 4999,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-projecteng-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'Project Lifecycle & Drawing Reading Foundations', topics: ['Architectural vs structural drawings', 'Levels and grids', 'General notes reading'] },
      { classNumber: 2, title: 'Soil Investigation, Excavation & Dewatering', topics: ['SPT N-value interpretation', 'Shoring systems', 'Dewatering setups'] },
      { classNumber: 3, title: 'Piling & Deep Foundations Execution', topics: ['Cast-in-situ bored piling', 'Pile load tests', 'Pile cap reinforcement'] },
      { classNumber: 4, title: 'Rebar Detailing & Pre-Pour Checklists', topics: ['Lap lengths, hooks, bar chairs', 'Clear cover compliance', 'Formwork stability'] },
      { classNumber: 5, title: 'Concrete Pouring & Quality Assurance', topics: ['Slump test, cylinder sampling', 'RMC batching', 'Curing techniques'] },
      { classNumber: 6, title: 'Brick Masonry, Blockwork & Plastering', topics: ['Mortar ratio, line, plumb', 'Curing duration', 'Plaster crack prevention'] },
      { classNumber: 7, title: 'Plumbing, Drainage & Sanitary Execution', topics: ['Pipe pressure testing', 'Slope verification', 'Bathroom waterproofing'] },
      { classNumber: 8, title: 'Electrical Conduit & Coordination', topics: ['Conduit laying in slabs', 'Earthing system', 'Switchboard coordinates'] },
      { classNumber: 9, title: 'Finishing Works: Tiles, Marble, Paint & Glass', topics: ['Hollow sound checks', 'Waterproofing flood tests', 'Paint coats'] },
      { classNumber: 10, title: 'Subcontractor Management & Productivity', topics: ['Labour output norms', 'Measurement verification', 'Deductions & penalty clauses'] },
      { classNumber: 11, title: 'Daily Progress Reports (DPR) & Material Requisitions', topics: ['Store management', 'Minimizing site wastage', 'Daily logs'] },
      { classNumber: 12, title: 'Snagging, Handover & Final Client Delivery', topics: ['Snag list compilation', 'Rectification sign-offs', 'Final handover pack'] },
    ],
    videos: [
      {
        title: 'Class 01: Interpreting Structural Foundation & Column Schedules',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '1 hr 10 mins',
        note: 'Examine the sample high-rise structural plan provided.',
      },
    ],
    liveClasses: [
      {
        title: 'Live Site Problem Solving Case Studies',
        classDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        classTime: '08:00 PM (BST)',
        meetingLink: 'https://meet.google.com/prj-mgmt-live',
        platform: 'Google Meet',
        note: 'Bring your real site questions and challenges.',
      },
    ],
    tasks: [
      {
        title: 'Task: Prepare a Pre-Pour Checklist for a Roof Slab Casting',
        description: 'List all mechanical, electrical, and structural inspection points before giving casting clearance to the ready-mix truck.',
        deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        points: 100,
      },
    ],
  },
  {
    title: 'Estimation and BOQ Masterclass',
    slug: 'estimation-and-boq-masterclass',
    category: 'Costing & Quantity Surveying',
    shortDescription: 'Quantity takeoff, rebar BBS, rate analysis, and complete Excel BOQ preparation.',
    fullDescription: 'Comprehensive training on calculating exact quantities from drawings: earthwork, RCC concrete, rebar cutting length and steel weight (BBS), brickwork, plaster, tiles, plumbing, and building a professional commercial BOQ in Excel with current market rates.',
    durationDays: 30,
    totalClasses: 8,
    price: 1299,
    regularPrice: 2599,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-estimation-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'Quantity Takeoff Fundamentals', topics: ['Units of measurement (cft, sft, rft, kg, ton)', 'PWD schedule vs developer norms', 'Deduction rules'] },
      { classNumber: 2, title: 'Substructure Estimation', topics: ['Excavation, sand filling, CC work', 'Footing and mat foundation quantities'] },
      { classNumber: 3, title: 'Superstructure RCC Concrete Takeoff', topics: ['Columns, beams, slabs, shear walls', 'Staircase concrete calculation'] },
      { classNumber: 4, title: 'Bar Bending Schedule (BBS) Mastery', topics: ['Rebar deduction and cutting length', 'Standard hooks and bends', 'Steel weight calculation in Excel'] },
      { classNumber: 5, title: 'Brickwork & Plaster Quantities', topics: ['5" and 10" brick wall calculations', 'Mortar volume and dry volume factor', 'Internal & external plaster'] },
      { classNumber: 6, title: 'Finishing & Services Quantities', topics: ['Flooring, skirting, wall tiles', 'Waterproofing area', 'Plumbing & electrical service estimates'] },
      { classNumber: 7, title: 'Rate Analysis for Core Materials in Bangladesh', topics: ['Current market rates of cement, sand, stone, rebar', 'Labour overheads & contractor profit'] },
      { classNumber: 8, title: 'Final Project: Building an Excel BOQ from Real Plans', topics: ['Creating the master BOQ summary', 'Contingency provision', 'Tender bill preparation'] },
    ],
    videos: [],
    liveClasses: [],
    tasks: [],
  },
  {
    title: 'Real Estate Project Planning and Management',
    slug: 'real-estate-project-planning-and-management',
    category: 'Project Management',
    shortDescription: 'WBS, CPM, resource leveling, MS Project schedule, and risk control.',
    fullDescription: 'Learn how to plan a multi-storied building project from scratch. Create detailed Work Breakdown Structures (WBS), identify Critical Paths (CPM), allocate material and manpower resources, and manage timeline delays in MS Project.',
    durationDays: 30,
    totalClasses: 8,
    price: 2999,
    regularPrice: 5999,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-planning-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'Pre-Construction Planning & WBS', topics: ['Project scope and charter', 'Developing 4-level WBS', 'Stakeholder alignment'] },
      { classNumber: 2, title: 'Sequencing & Network Logic', topics: ['Precedence diagramming', 'Activity dependencies', 'Lead and lag times'] },
      { classNumber: 3, title: 'Critical Path Method (CPM) & PERT', topics: ['Early start, late finish', 'Total float vs free float', 'Fast-tracking vs crashing'] },
      { classNumber: 4, title: 'Resource & Cost Budgeting in MS Project', topics: ['Loading labor and machinery', 'Resource leveling', 'Cash flow forecasts'] },
      { classNumber: 5, title: 'Progress Tracking & Baseline Management', topics: ['Setting project baseline', 'Earned Value Management (EVM)', 'Schedule Variance (SV)'] },
      { classNumber: 6, title: 'Managing Monsoon Delays & Supply Chain Risks', topics: ['Local weather planning', 'Steel & cement supply risk mitigation', 'Subcontractor commitments'] },
      { classNumber: 7, title: 'Quality, Safety & Audit Planning', topics: ['HSE plans on site', 'Safety induction', 'Regulatory inspection audits'] },
      { classNumber: 8, title: 'Project Closeout & Executive Reporting', topics: ['Final accounts settlement', 'As-built documentation', 'Post-project lessons learned'] },
    ],
    videos: [],
    liveClasses: [],
    tasks: [],
  },
  {
    title: 'Quality Control and SOP for Real Estate Sites',
    slug: 'quality-control-and-sop-for-real-estate-sites',
    category: 'Quality Assurance & Inspection',
    shortDescription: 'Standard Operating Procedures (SOP), QA/QC checklists, defect prevention, and testing.',
    fullDescription: 'A systematic course on implementing rigorous quality assurance on building construction sites. Covers material testing standards, step-by-step SOPs for casting and masonry, preparing non-conformance reports (NCR), and snag list management.',
    durationDays: 30,
    totalClasses: 8,
    price: 1499,
    regularPrice: 2999,
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-qc-batch',
    instructor: {
      name: 'Md Abdul Mazid',
      designation: 'Senior Civil Engineer (BUET), 10+ Years Experience',
      bio: 'BUET alumnus with extensive leadership in residential, commercial, and high-rise developer projects in Dhaka.',
    },
    syllabus: [
      { classNumber: 1, title: 'QA/QC Framework in Real Estate', topics: ['Quality assurance vs quality control', 'Inspection & Test Plans (ITP)', 'Quality documentation'] },
      { classNumber: 2, title: 'Raw Material Testing & Acceptance Criteria', topics: ['Cement setting time & consistency', 'Sand FM testing', 'Aggregate gradation', 'Rebar tensile testing'] },
      { classNumber: 3, title: 'SOP for Shuttering & Reinforcement', topics: ['Tolerance limits', 'Cover block density', 'Tie wire tying methods', 'Pre-pour signoff'] },
      { classNumber: 4, title: 'SOP for Ready-Mix Concrete Casting', topics: ['Water-cement ratio control', 'Admixture usage', 'Compaction and vibrator technique', 'Cold joint prevention'] },
      { classNumber: 5, title: 'SOP for Brick Masonry & Plastering Works', topics: ['Brick soaking requirements', 'Raking mortar joints', 'Chicken mesh for conduit joints', 'Plaster plumb checks'] },
      { classNumber: 6, title: 'SOP for Waterproofing & Finishing Works', topics: ['Basement and roof slab membrane waterproofing', 'Water ponding test', 'Tiles adhesion checks'] },
      { classNumber: 7, title: 'Non-Conformance Reports (NCR) & Corrective Actions', topics: ['Documenting defects with photos', 'Root cause analysis', 'Corrective action approval'] },
      { classNumber: 8, title: 'Snagging Protocols & Handover Inspection', topics: ['Room-by-room snag list creation', 'Sign-off protocols with client', 'Preventative maintenance manual'] },
    ],
    videos: [],
    liveClasses: [],
    tasks: [],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // 1. Seed Site Settings
    await SiteSettings.deleteMany({});
    await SiteSettings.create({
      siteName: 'Blueprint Learning Academy',
      tagline: 'Real Estate Career Courses for Civil Engineers',
      heroTitle: 'Build a real estate career as a civil engineer in Bangladesh.',
      heroSubtitle: 'Six practical courses taught by an engineer with 10+ years on Bangladeshi construction and real estate projects. Learn what sites and employers actually ask for.',
      heroBengaliNote: 'সাইটে কাজ করার বাস্তব জ্ঞান, চাকরির প্রস্তুতি ও ক্যারিয়ার গড়ার পথ।',
      contactPhone: '01313893838',
      whatsappNumber: '8801313893838',
      contactEmail: 'info@blueprintlearningacademy.com',
      bkashNumber: '01313893838',
      bkashType: 'Personal (Send Money)',
      nagadNumber: '01313893838',
      nagadType: 'Personal (Send Money)',
      rocketNumber: '01313893838-5',
      paymentInstructions: 'Please use Send Money to our official bKash/Nagad number, write your name as reference, and enter the Transaction ID in the enrollment form.',
    });
    console.log('✅ Site settings seeded.');

    // 2. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@careerpath.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    await User.deleteMany({ email: adminEmail });
    await User.create({
      name: 'Academy Administrator',
      email: adminEmail,
      password: adminPassword,
      plainPasswordForAdmin: adminPassword,
      phone: '01313893838',
      address: 'Dhaka, Bangladesh',
      role: 'admin',
      status: 'active',
    });
    console.log(`✅ Admin account created: ${adminEmail} (password: ${adminPassword})`);

    // 3. Seed Courses
    await Course.deleteMany({});
    const createdCourses = await Course.insertMany(coursesData);
    console.log(`✅ ${createdCourses.length} courses seeded successfully.`);

    // 4. Seed Demo Student User enrolled in the first course
    const demoStudentEmail = 'student@example.com';
    const demoStudentPassword = 'student123';
    await User.deleteMany({ email: demoStudentEmail });

    const firstCourse = createdCourses[0];
    await User.create({
      name: 'Tariqul Islam',
      email: demoStudentEmail,
      password: demoStudentPassword,
      plainPasswordForAdmin: demoStudentPassword,
      phone: '01711000111',
      address: 'Mirpur, Dhaka',
      role: 'student',
      status: 'active',
      enrolledCourses: [
        {
          course: firstCourse._id,
          enrolledAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'active',
        },
      ],
    });
    console.log(`✅ Demo student account created: ${demoStudentEmail} (password: ${demoStudentPassword})`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
