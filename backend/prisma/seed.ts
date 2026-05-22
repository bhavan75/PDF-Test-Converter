import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const student = await prisma.user.upsert({
    where: { email: 'student@pdftest.com' },
    update: {},
    create: {
      email: 'student@pdftest.com',
      name: 'Bhavan',
      passwordHash,
      role: 'user',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pdftest.com' },
    update: {},
    create: {
      email: 'admin@pdftest.com',
      name: 'System Admin',
      passwordHash,
      role: 'admin',
    },
  });

  console.log('Users created:', { student: student.email, admin: admin.email });

  // 2. Create PDF 1: Electronics Basics
  const pdf1 = await prisma.pdfUpload.create({
    data: {
      filename: 'electronics_basics_quiz.pdf',
      filepath: 'uploads/electronics_basics_quiz.pdf',
      status: 'completed',
      totalQuestions: 8,
      topics: 'Electronics,Digital Logic,Circuits',
    },
  });

  const questions1 = [
    {
      questionNumber: 1,
      text: "What is Ohm’s Law?",
      optionA: "V = IR",
      optionB: "P = IV",
      optionC: "R = V/P",
      optionD: "I = P/V",
      correctAnswer: "A",
      explanation: "Ohm's Law states that the current through a conductor between two points is directly proportional to the voltage across the two points. The mathematical formula is V = IR, where V is voltage, I is current, and R is resistance.",
      topic: "Electronics",
      difficulty: "Easy"
    },
    {
      questionNumber: 2,
      text: "Which logic gate outputs a HIGH (1) signal only when all of its input signals are LOW (0)?",
      optionA: "AND Gate",
      optionB: "OR Gate",
      optionC: "NOR Gate",
      optionD: "NAND Gate",
      correctAnswer: "C",
      explanation: "A NOR gate outputs 1 only when all inputs are 0. It acts as an OR gate followed by an inverter. Thus, if any input is 1, the OR gate outputs 1, and the NOR gate outputs 0.",
      topic: "Digital Logic",
      difficulty: "Medium"
    },
    {
      questionNumber: 3,
      text: "What is the primary function of a diode in an electrical circuit?",
      optionA: "To amplify signal power",
      optionB: "To allow current to flow in one direction only",
      optionC: "To store electrical charge",
      optionD: "To regulate voltage levels",
      correctAnswer: "B",
      explanation: "A diode is a semiconductor device that essentially acts as a one-way switch for current. It allows current to flow easily in one direction (forward bias) but severely restricts current from flowing in the opposite direction (reverse bias).",
      topic: "Circuits",
      difficulty: "Easy"
    },
    {
      questionNumber: 4,
      text: "What is the equivalent resistance of two 10-ohm resistors connected in parallel?",
      optionA: "20 Ohms",
      optionB: "5 Ohms",
      optionC: "10 Ohms",
      optionD: "2.5 Ohms",
      correctAnswer: "B",
      explanation: "For parallel resistors, the formula is 1/Req = 1/R1 + 1/R2. Here, 1/Req = 1/10 + 1/10 = 2/10 = 1/5. Thus, Req = 5 ohms. Alternatively, identical parallel resistors have an equivalent resistance equal to the value divided by the number of resistors (10 / 2 = 5).",
      topic: "Circuits",
      difficulty: "Medium"
    },
    {
      questionNumber: 5,
      text: "Which element is commonly used as a semiconductor in electronic devices?",
      optionA: "Copper",
      optionB: "Iron",
      optionC: "Silicon",
      optionD: "Silver",
      correctAnswer: "C",
      explanation: "Silicon is the most widely used semiconductor element in electronics due to its abundance, thermal properties, and stability. While Germanium is also a semiconductor, Silicon dominates modern integrated circuits.",
      topic: "Electronics",
      difficulty: "Easy"
    },
    {
      questionNumber: 6,
      text: "In digital electronics, how many binary bits are there in a single Byte?",
      optionA: "4 bits",
      optionB: "8 bits",
      optionC: "16 bits",
      optionD: "32 bits",
      correctAnswer: "B",
      explanation: "A single byte consists of 8 binary bits (binary digits). A grouping of 4 bits is historically referred to as a 'nibble'.",
      topic: "Digital Logic",
      difficulty: "Easy"
    },
    {
      questionNumber: 7,
      text: "What is the purpose of a capacitor in a power supply filter circuit?",
      optionA: "To increase the AC voltage level",
      optionB: "To smooth out pulsating DC ripples after rectification",
      optionC: "To step down DC voltage",
      optionD: "To switch currents rapidly",
      correctAnswer: "B",
      explanation: "A capacitor stores charge and opposes sudden voltage changes. When placed in parallel in a rectifier circuit, it charges during the peak and discharges when the rectified voltage falls, thereby smoothing out the ripples to produce a steady DC voltage.",
      topic: "Circuits",
      difficulty: "Hard"
    },
    {
      questionNumber: 8,
      text: "Which of the following describes a 'Flip-Flop' circuit?",
      optionA: "An analog oscillator",
      optionB: "A bistable multivibrator that stores 1 bit of state",
      optionC: "A voltage step-down converter",
      optionD: "A passive temperature sensor",
      correctAnswer: "B",
      explanation: "A flip-flop is a bistable multivibrator, a sequential logic circuit that has two stable states and can be used to store state information. It acts as a basic 1-bit memory cell in digital electronics.",
      topic: "Digital Logic",
      difficulty: "Hard"
    }
  ];

  for (const q of questions1) {
    await prisma.question.create({
      data: {
        pdfId: pdf1.id,
        ...q
      }
    });
  }

  // 3. Create PDF 2: Aptitude and Logic
  const pdf2 = await prisma.pdfUpload.create({
    data: {
      filename: 'aptitude_logic_prep.pdf',
      filepath: 'uploads/aptitude_logic_prep.pdf',
      status: 'completed',
      totalQuestions: 6,
      topics: 'Probability,Aptitude,Word Problems',
    },
  });

  const questions2 = [
    {
      questionNumber: 1,
      text: "If a card is drawn at random from a standard deck of 52 playing cards, what is the probability of drawing a Spade?",
      optionA: "1/4",
      optionB: "1/13",
      optionC: "1/2",
      optionD: "3/13",
      correctAnswer: "A",
      explanation: "A standard deck contains 4 suits (Spades, Hearts, Diamonds, Clubs), each with 13 cards. The probability of drawing a card from a specific suit is 13/52 = 1/4 (or 25%).",
      topic: "Probability",
      difficulty: "Easy"
    },
    {
      questionNumber: 2,
      text: "A train running at a speed of 60 km/h crosses a pole in 9 seconds. What is the length of the train in meters?",
      optionA: "120 meters",
      optionB: "150 meters",
      optionC: "180 meters",
      optionD: "324 meters",
      correctAnswer: "B",
      explanation: "First, convert the speed from km/h to m/s: Speed = 60 * (5/18) = 50/3 m/s. The distance covered to cross the pole is equal to the length of the train: Distance = Speed * Time = (50/3) * 9 = 150 meters.",
      topic: "Aptitude",
      difficulty: "Medium"
    },
    {
      questionNumber: 3,
      text: "Find the next number in the sequence: 3, 5, 9, 17, 33, ...",
      optionA: "50",
      optionB: "65",
      optionC: "49",
      optionD: "53",
      correctAnswer: "B",
      explanation: "The difference between consecutive terms doubles each time: 5-3 = 2; 9-5 = 4; 17-9 = 8; 33-17 = 16. The next difference must be 16 * 2 = 32. Thus, the next number is 33 + 32 = 65. Alternatively, the formula for the nth term is 2^n + 1: 3, 5, 9, 17, 33, 65.",
      topic: "Aptitude",
      difficulty: "Easy"
    },
    {
      questionNumber: 4,
      text: "A sum of money doubles itself at simple interest in 8 years. What is the rate of interest per annum?",
      optionA: "10%",
      optionB: "12.5%",
      optionC: "15%",
      optionD: "8%",
      correctAnswer: "B",
      explanation: "Let the principal be P. Under simple interest, for the sum to double, the Interest (I) must equal P. Since I = P * R * T / 100, we have P = P * R * 8 / 100. Simplifying gives 1 = 8R / 100, which yields R = 100 / 8 = 12.5%.",
      topic: "Aptitude",
      difficulty: "Medium"
    },
    {
      questionNumber: 5,
      text: "In a box, there are 8 red, 7 blue, and 6 green balls. One ball is picked at random. What is the probability that it is neither red nor green?",
      optionA: "1/3",
      optionB: "7/21",
      optionC: "8/21",
      optionD: "1/7",
      correctAnswer: "B",
      explanation: "The total number of balls is 8 + 7 + 6 = 21. A ball that is neither red nor green must be blue. There are 7 blue balls. Thus, the probability is 7/21 (which simplifies to 1/3).",
      topic: "Probability",
      difficulty: "Medium"
    },
    {
      questionNumber: 6,
      text: "A work can be completed by 12 men in 8 days. How many days will it take for 16 men to complete the same work?",
      optionA: "4 days",
      optionB: "5 days",
      optionC: "6 days",
      optionD: "10 days",
      correctAnswer: "C",
      explanation: "Using the man-days formula: M1 * D1 = M2 * D2. Here, 12 men * 8 days = 16 men * D2 days. 96 = 16 * D2, which gives D2 = 96 / 16 = 6 days.",
      topic: "Word Problems",
      difficulty: "Easy"
    }
  ];

  for (const q of questions2) {
    await prisma.question.create({
      data: {
        pdfId: pdf2.id,
        ...q
      }
    });
  }

  console.log('PDFs and Questions seeded.');

  // 4. Create Historical Test Attempts for Dashboard
  // Fetch question IDs to map answers
  const dbQs1 = await prisma.question.findMany({ where: { pdfId: pdf1.id } });
  const dbQs2 = await prisma.question.findMany({ where: { pdfId: pdf2.id } });

  // Attempt 1: 10 days ago (Electronics) - score 5/8 (62.5%), took 12 mins (720s) in Exam Mode
  const answers1 = JSON.stringify({
    [dbQs1[0].id]: { selected: "A", timeSpent: 45 },  // Correct
    [dbQs1[1].id]: { selected: "D", timeSpent: 90 },  // Wrong (Correct: C)
    [dbQs1[2].id]: { selected: "B", timeSpent: 30 },  // Correct
    [dbQs1[3].id]: { selected: "B", timeSpent: 120 }, // Correct
    [dbQs1[4].id]: { selected: "C", timeSpent: 40 },  // Correct
    [dbQs1[5].id]: { selected: "B", timeSpent: 30 },  // Correct
    [dbQs1[6].id]: { selected: "A", timeSpent: 200 }, // Wrong (Correct: B)
    [dbQs1[7].id]: { selected: "C", timeSpent: 165 }  // Wrong (Correct: B)
  });

  await prisma.testAttempt.create({
    data: {
      userId: student.id,
      pdfId: pdf1.id,
      totalQuestions: 8,
      timeLimit: 15,
      timeSpent: 720,
      score: 5,
      accuracy: 62.5,
      mode: 'exam',
      answers: answers1,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    }
  });

  // Attempt 2: 7 days ago (Aptitude) - score 4/6 (66.6%), took 8 mins (480s) in Practice Mode
  const answers2 = JSON.stringify({
    [dbQs2[0].id]: { selected: "A", timeSpent: 40 },  // Correct
    [dbQs2[1].id]: { selected: "B", timeSpent: 110 }, // Correct
    [dbQs2[2].id]: { selected: "B", timeSpent: 50 },  // Correct
    [dbQs2[3].id]: { selected: "A", timeSpent: 140 }, // Wrong (Correct: B)
    [dbQs2[4].id]: { selected: "C", timeSpent: 80 },  // Wrong (Correct: B)
    [dbQs2[5].id]: { selected: "C", timeSpent: 60 }   // Correct
  });

  await prisma.testAttempt.create({
    data: {
      userId: student.id,
      pdfId: pdf2.id,
      totalQuestions: 6,
      timeLimit: 10,
      timeSpent: 480,
      score: 4,
      accuracy: 66.67,
      mode: 'practice',
      answers: answers2,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    }
  });

  // Attempt 3: 4 days ago (Electronics Retake) - score 7/8 (87.5%), took 9 mins (540s) in Practice Mode
  const answers3 = JSON.stringify({
    [dbQs1[0].id]: { selected: "A", timeSpent: 30 },  // Correct
    [dbQs1[1].id]: { selected: "C", timeSpent: 60 },  // Correct
    [dbQs1[2].id]: { selected: "B", timeSpent: 20 },  // Correct
    [dbQs1[3].id]: { selected: "B", timeSpent: 80 },  // Correct
    [dbQs1[4].id]: { selected: "C", timeSpent: 25 },  // Correct
    [dbQs1[5].id]: { selected: "B", timeSpent: 20 },  // Correct
    [dbQs1[6].id]: { selected: "B", timeSpent: 180 }, // Correct
    [dbQs1[7].id]: { selected: "A", timeSpent: 125 }  // Wrong (Correct: B)
  });

  await prisma.testAttempt.create({
    data: {
      userId: student.id,
      pdfId: pdf1.id,
      totalQuestions: 8,
      timeLimit: 15,
      timeSpent: 540,
      score: 7,
      accuracy: 87.5,
      mode: 'practice',
      answers: answers3,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    }
  });

  // Attempt 4: 2 days ago (Aptitude Retake) - score 6/6 (100%), took 5 mins (300s) in Exam Mode
  const answers4 = JSON.stringify({
    [dbQs2[0].id]: { selected: "A", timeSpent: 30 },  // Correct
    [dbQs2[1].id]: { selected: "B", timeSpent: 70 },  // Correct
    [dbQs2[2].id]: { selected: "B", timeSpent: 30 },  // Correct
    [dbQs2[3].id]: { selected: "B", timeSpent: 90 },  // Correct
    [dbQs2[4].id]: { selected: "B", timeSpent: 50 },  // Correct
    [dbQs2[5].id]: { selected: "C", timeSpent: 30 }   // Correct
  });

  await prisma.testAttempt.create({
    data: {
      userId: student.id,
      pdfId: pdf2.id,
      totalQuestions: 6,
      timeLimit: 10,
      timeSpent: 300,
      score: 6,
      accuracy: 100.0,
      mode: 'exam',
      answers: answers4,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }
  });

  // 5. Add a few Bookmarks
  await prisma.bookmark.create({
    data: {
      userId: student.id,
      questionId: dbQs1[1].id // Logic gates (marked hard/wrong in past)
    }
  });

  await prisma.bookmark.create({
    data: {
      userId: student.id,
      questionId: dbQs2[4].id // Blue ball probability
    }
  });

  console.log('Mock attempts and bookmarks seeded successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
