const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, ProfessionalProfile, CaseStudy } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nyaya-setu';

const lawyersData = [
  {
    email: 'adv.rajeshwar.sen@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Rajeshwar Sen',
    title: 'Senior Counsel & Labour Law Specialist',
    bio: '18+ years of dedicated practice across the Supreme Court of India and Delhi High Court specializing in industrial disputes, unpaid wage recovery under Section 15 of Payment of Wages Act, and executive contract breaches.',
    practiceAreas: ['Employment & Labour Law', 'Civil Litigation', 'Constitutional Law'],
    location: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      primaryCourts: ['Supreme Court of India', 'Delhi High Court', 'Central Government Industrial Tribunal (CGIT)'],
    },
    languages: ['English', 'Hindi', 'Bengali'],
    experienceYears: 18,
    barCouncilRegistration: {
      registrationNumber: 'D/1428/2006',
      stateBarCouncil: 'Bar Council of Delhi',
      yearOfEnrollment: 2006,
      isVerified: true,
    },
    education: [
      { degree: 'LL.M in Constitutional & Labour Law', institution: 'Faculty of Law, Delhi University', year: 2008 },
      { degree: 'B.A. LL.B (Hons)', institution: 'National Law University, Jodhpur', year: 2006 },
    ],
    feeRange: { min: 2500, max: 8000, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.9, count: 84 },
    caseStudies: [
      {
        title: 'Recovery of Withheld Wages for 42 Tech Employees post Sudden Layoff',
        practiceArea: 'Employment & Labour Law',
        forum: 'Delhi State Labour Court',
        summary: 'Represented a group of 42 software engineers whose salaries and severance packages were unilaterally frozen by an enterprise employer without statutory 30-day notice.',
        challenge: 'The employer argued economic distress and forced resignation clauses.',
        strategy: 'Invoked Section 25F and 33C(2) of Industrial Disputes Act alongside Section 15 of Payment of Wages Act, demonstrating non-compliance with statutory notice.',
        outcome: 'Full recovery of ₹68 Lakhs in back wages plus statutory 12% interest and compensation awarded.',
        year: 2025,
      },
    ],
  },
  {
    email: 'adv.priya.nambiar@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Priya Nambiar',
    title: 'Advocate on Record & Cyber Law Strategist',
    bio: 'Specialist in cyber fraud recovery, IT Act Section 66C/66D litigation, unauthorized banking transaction disputes, and data protection advisory. Regularly appears before Karnataka High Court and Cyber Appellate Tribunal.',
    practiceAreas: ['Cyber Law & Data Privacy', 'Banking & Financial Dispute', 'Consumer Dispute'],
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      primaryCourts: ['Karnataka High Court', 'City Civil Court Bengaluru', 'Cyber Crime Police Station CID'],
    },
    languages: ['English', 'Kannada', 'Hindi', 'Malayalam'],
    experienceYears: 11,
    barCouncilRegistration: {
      registrationNumber: 'KAR/2891/2013',
      stateBarCouncil: 'Karnataka State Bar Council',
      yearOfEnrollment: 2013,
      isVerified: true,
    },
    education: [
      { degree: 'B.A. LL.B (Hons)', institution: 'NLSIU Bengaluru', year: 2013 },
      { degree: 'PG Diploma in Cyber Law', institution: 'Cyber Law College', year: 2015 },
    ],
    feeRange: { min: 2000, max: 6500, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.85, count: 62 },
    caseStudies: [
      {
        title: 'Reverse Lien & Recovery of ₹24 Lakhs Lost in Sophisticated Banking Phishing',
        practiceArea: 'Cyber Law & Data Privacy',
        forum: 'High Court of Karnataka & Cyber Cell',
        summary: 'A citizen was defrauded via SIM swap phishing and biometric clone scam, resulting in ₹24 Lakhs unauthorized transfer across 6 mule accounts.',
        challenge: 'Bank refused liability citing OTP sharing.',
        strategy: 'Utilized RBI Circular on Zero Liability for Customer in Unauthorized Electronic Banking Transactions within 3 days and secured immediate Section 91 CrPC freeze orders.',
        outcome: 'Bank ordered to credit ₹24 Lakhs along with ₹50,000 litigation cost to the citizen.',
        year: 2024,
      },
    ],
  },
  {
    email: 'adv.vikram.rathore@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Vikramaditya Rathore',
    title: 'Senior Associate & Commercial Arbitrator',
    bio: 'Focusing on commercial contract disputes, non-compete clause challenges under Section 27 Indian Contract Act, residential builder-buyer delays under RERA, and institutional arbitration.',
    practiceAreas: ['Corporate & Commercial', 'Property & Real Estate', 'Civil Litigation'],
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      primaryCourts: ['Bombay High Court', 'MahaRERA', 'NCLT Mumbai Bench'],
    },
    languages: ['English', 'Hindi', 'Marathi', 'Gujarati'],
    experienceYears: 14,
    barCouncilRegistration: {
      registrationNumber: 'MAH/5120/2010',
      stateBarCouncil: 'Bar Council of Maharashtra & Goa',
      yearOfEnrollment: 2010,
      isVerified: true,
    },
    education: [
      { degree: 'LL.B', institution: 'Government Law College (GLC), Mumbai', year: 2010 },
      { degree: 'B.Com', institution: 'HR College of Commerce, Mumbai', year: 2007 },
    ],
    feeRange: { min: 3000, max: 10000, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.92, count: 110 },
    caseStudies: [
      {
        title: 'Striking Down Unenforceable 2-Year Blanket Non-Compete Injunction',
        practiceArea: 'Corporate & Commercial',
        forum: 'Bombay High Court (Commercial Division)',
        summary: 'Defended a Senior Software Architect sued for ₹50 Lakhs liquidated damages by former employer for joining a technology venture.',
        challenge: 'Agreement contained severe post-termination restrictive covenants and unilateral arbitrator appointment.',
        strategy: 'Proved restraint of trade void ab initio under Section 27 of Indian Contract Act, 1872 and void arbitration clause under Perkins Eastman precedent.',
        outcome: 'Injunction application dismissed with costs; employee permitted to continue employment without restriction.',
        year: 2025,
      },
    ],
  },
  {
    email: 'adv.sunita.deshmukh@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Sunita Deshmukh',
    title: 'Consumer Rights Advocate & Mediator',
    bio: 'Dedicated consumer protection lawyer with 9+ years fighting against defective e-commerce goods, misleading advertisements, unfair trade practices, and insurance claim rejections before District, State, and National Consumer Commissions.',
    practiceAreas: ['Consumer Dispute', 'Civil Litigation', 'Banking & Financial Dispute'],
    location: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110019',
      primaryCourts: ['National Consumer Disputes Redressal Commission (NCDRC)', 'Delhi State Consumer Commission', 'District Consumer Forums'],
    },
    languages: ['English', 'Hindi', 'Punjabi'],
    experienceYears: 9,
    barCouncilRegistration: {
      registrationNumber: 'D/3104/2015',
      stateBarCouncil: 'Bar Council of Delhi',
      yearOfEnrollment: 2015,
      isVerified: true,
    },
    education: [
      { degree: 'LL.B', institution: 'Campus Law Centre, Delhi University', year: 2015 },
    ],
    feeRange: { min: 1500, max: 4500, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.88, count: 53 },
    caseStudies: [
      {
        title: 'Full Compensation & Penalty for Defective EV Battery Fire',
        practiceArea: 'Consumer Dispute',
        forum: 'State Consumer Disputes Redressal Commission, Delhi',
        summary: 'Filed e-Daakhil complaint on behalf of a consumer whose electric scooter battery exploded due to manufacturing defect, causing property damage.',
        challenge: 'Manufacturer claimed consumer tampering and third-party charger use.',
        strategy: 'Procured government-approved lab forensic report under Section 38(2)(c) of Consumer Protection Act, 2019 proving inherent thermal runaway defect.',
        outcome: 'Manufacturer directed to refund ₹1.4 Lakhs vehicle cost + ₹3.5 Lakhs compensation + ₹25,000 litigation costs.',
        year: 2024,
      },
    ],
  },
  {
    email: 'adv.harpreet.gill@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Harpreet Singh Gill',
    title: 'Tenancy & Property Dispute Specialist',
    bio: 'Specialist in Model Tenancy Act, security deposit withholding disputes, wrongful eviction notices, and commercial lease drafting across Punjab, Haryana, and Chandigarh.',
    practiceAreas: ['Property & Real Estate', 'Civil Litigation'],
    location: {
      city: 'Chandigarh',
      state: 'Punjab',
      pincode: '160001',
      primaryCourts: ['Punjab & Haryana High Court', 'District & Sessions Court Chandigarh', 'Rent Controller Tribunal'],
    },
    languages: ['English', 'Punjabi', 'Hindi'],
    experienceYears: 12,
    barCouncilRegistration: {
      registrationNumber: 'PH/1908/2012',
      stateBarCouncil: 'Bar Council of Punjab & Haryana',
      yearOfEnrollment: 2012,
      isVerified: true,
    },
    education: [
      { degree: 'B.A. LL.B', institution: 'Panjab University, Chandigarh', year: 2012 },
    ],
    feeRange: { min: 1800, max: 5000, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.79, count: 48 },
    caseStudies: [
      {
        title: 'Recovery of ₹1.8 Lakhs Security Deposit Withheld with Malafide Repairs Claim',
        practiceArea: 'Property & Real Estate',
        forum: 'Rent Authority / Small Causes Court',
        summary: 'Landlord wrongfully deducted 100% of security deposit after tenant vacated premises, citing routine wear and tear as property damage.',
        challenge: 'Absence of joint move-out inspection document.',
        strategy: 'Submitted dated timestamped video walkthrough and move-in inventory report, establishing normal wear and tear under Model Tenancy Act principles.',
        outcome: 'Landlord ordered to refund ₹1.8 Lakhs with 9% interest and ₹20,000 cost for mental harassment.',
        year: 2025,
      },
    ],
  },
  {
    email: 'adv.meenakshi.sundaram@legalnexus.in',
    password: 'Password123!',
    role: 'LAWYER',
    fullName: 'Adv. Meenakshi Sundaram',
    title: 'Civil & Matrimonial Dispute Mediator',
    bio: 'Accredited mediator and senior counsel handling matrimonial maintenance under Section 125 CrPC / Section 144 BNSS, domestic violence protection, child custody, and civil settlements.',
    practiceAreas: ['Family & Matrimonial', 'Civil Litigation'],
    location: {
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001',
      primaryCourts: ['Madras High Court', 'Family Courts at Chennai', 'Tamil Nadu State Legal Services Authority (TNSLSA)'],
    },
    languages: ['English', 'Tamil', 'Telugu', 'Hindi'],
    experienceYears: 15,
    barCouncilRegistration: {
      registrationNumber: 'MS/2045/2009',
      stateBarCouncil: 'Bar Council of Tamil Nadu & Puducherry',
      yearOfEnrollment: 2009,
      isVerified: true,
    },
    education: [
      { degree: 'LL.B', institution: 'Dr. Ambedkar Government Law College, Chennai', year: 2009 },
    ],
    feeRange: { min: 2000, max: 6000, currency: 'INR', model: 'FIXED_PER_CONSULTATION' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.95, count: 91 },
    caseStudies: [],
  },
  {
    email: 'student.rohan.malhotra@legalnexus.in',
    password: 'Password123!',
    role: 'LAW_STUDENT',
    fullName: 'Rohan Malhotra',
    title: 'Final Year Law Student & Pro-Bono Legal Clinic Associate',
    bio: 'Final year law student at Faculty of Law, University of Delhi, passionate about access to justice, tenant rights, consumer grievance drafting, and RTI applications.',
    practiceAreas: ['Consumer Dispute', 'Property & Real Estate', 'Public Records & RTI'],
    location: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110007',
      primaryCourts: ['Delhi Legal Services Authority (DLSA) Clinic', 'Faculty of Law Legal Aid'],
    },
    languages: ['English', 'Hindi'],
    experienceYears: 1,
    lawStudentDetails: {
      institutionName: 'Faculty of Law, University of Delhi',
      degree: 'LL.B (3-Year)',
      graduationYear: 2026,
      currentYear: 3,
      studentIdNumber: 'DU-FOL-2023-8841',
    },
    feeRange: { min: 0, max: 500, currency: 'INR', model: 'PRO_BONO' },
    availabilityStatus: 'AVAILABLE',
    verificationStatus: 'VERIFIED',
    rating: { average: 4.7, count: 18 },
    caseStudies: [],
  },
];

async function seedDatabase(skipDisconnect = false) {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Connecting to MongoDB at:', MONGODB_URI);
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB Connected successfully.');
    }

    // 1. Create or Update Default Citizen User
    const citizenEmail = 'citizen@example.com';
    let citizen = await User.findOne({ email: citizenEmail });
    const passwordHash = await User.hashPassword('Password123!');

    if (!citizen) {
      citizen = await User.create({
        email: citizenEmail,
        passwordHash,
        role: 'CITIZEN',
        phone: '+91 9876543210',
        isActive: true,
        isVerified: true,
      });
      console.log(`[✓] Created default citizen account: ${citizenEmail} (Password: Password123!)`);
    } else {
      citizen.passwordHash = passwordHash;
      await citizen.save();
      console.log(`[✓] Updated default citizen account: ${citizenEmail}`);
    }

    // 2. Seed Advocates & Law Students
    console.log(`\nSeeding ${lawyersData.length} Verified Advocates & Legal Scholars...`);

    for (const law of lawyersData) {
      let user = await User.findOne({ email: law.email });
      const pwHash = await User.hashPassword(law.password);

      if (!user) {
        user = await User.create({
          email: law.email,
          passwordHash: pwHash,
          role: law.role,
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          isActive: true,
          isVerified: true,
        });
      } else {
        user.passwordHash = pwHash;
        user.role = law.role;
        await user.save();
      }

      // Upsert Professional Profile
      const profileData = {
        user: user._id,
        professionalRole: law.role,
        fullName: law.fullName,
        title: law.title,
        bio: law.bio,
        practiceAreas: law.practiceAreas,
        location: law.location,
        languages: law.languages,
        experienceYears: law.experienceYears,
        barCouncilRegistration: law.barCouncilRegistration,
        lawStudentDetails: law.lawStudentDetails,
        education: law.education || [],
        feeRange: law.feeRange,
        availabilityStatus: law.availabilityStatus,
        verificationStatus: law.verificationStatus,
        rating: law.rating,
      };

      const prof = await ProfessionalProfile.findOneAndUpdate(
        { user: user._id },
        { $set: profileData },
        { upsert: true, new: true }
      );

      console.log(` [✓] Seeded: ${law.fullName} (${law.role}) - ${law.location.city}`);

      // Seed Case Studies if any
      if (law.caseStudies && law.caseStudies.length > 0) {
        for (const cs of law.caseStudies) {
          await CaseStudy.findOneAndUpdate(
            { professional: user._id, title: cs.title },
            {
              $set: {
                professional: user._id,
                title: cs.title,
                practiceArea: cs.practiceArea,
                forum: cs.forum,
                summary: cs.summary,
                challenge: cs.challenge,
                strategy: cs.strategy,
                outcome: cs.outcome,
                anonymizedDetails: true,
                year: cs.year,
              },
            },
            { upsert: true, new: true }
          );
          console.log(`     ↳ Precedent Case Study: "${cs.title.substring(0, 45)}..."`);
        }
      }
    }

    // Seed Default Admin Account
    const adminEmail = 'admin@legalnexus.in';
    const adminPasswordHash = await User.hashPassword('Password123!');
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: 'ADMIN',
          phone: '9999999999',
          isVerified: true,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log(` [✓] Seeded Admin: ${adminEmail} (Role: ADMIN)`);

    // Seed Default Test Citizen
    const testCitizenEmail = 'testcitizen@nyayanexus.in';
    const testCitizenPasswordHash = await User.hashPassword('Password123!');
    await User.findOneAndUpdate(
      { email: testCitizenEmail },
      {
        $set: {
          email: testCitizenEmail,
          passwordHash: testCitizenPasswordHash,
          role: 'CITIZEN',
          phone: '9876543210',
          isVerified: true,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log(` [✓] Seeded Citizen: ${testCitizenEmail} (Role: CITIZEN)`);

    console.log('\n======================================================');
    console.log('  LEGAL NEXUS — SEED DATA INITIALIZATION COMPLETE   ');
    console.log('======================================================');

    if (!skipDisconnect) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('Seed Error:', error);
    if (!skipDisconnect) {
      process.exit(1);
    }
  }
}

module.exports = { seedDatabase, lawyersData };

if (require.main === module) {
  seedDatabase(false);
}
