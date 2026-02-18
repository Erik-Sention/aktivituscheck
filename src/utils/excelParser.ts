import * as XLSX from 'xlsx';
import { HealthData } from '@/types/health';

function parsePersonnummer(pnr: string): { gender?: 'male' | 'female'; age?: number } {
  if (!pnr) return {};
  // Remove whitespace and hyphens: "19820415-5578" → "198204155578"
  const digits = pnr.replace(/[\s-]/g, '');
  if (digits.length < 10) return {};

  // Extract birth year
  let birthYear: number;
  let suffixStart: number;
  if (digits.length >= 12) {
    // YYYYMMDDXXXX
    birthYear = parseInt(digits.substring(0, 4));
    suffixStart = 8;
  } else {
    // YYMMDDXXXX — assume 1900s for 30+, 2000s for <30
    const yy = parseInt(digits.substring(0, 2));
    birthYear = yy >= 30 ? 1900 + yy : 2000 + yy;
    suffixStart = 6;
  }

  const birthMonth = parseInt(digits.substring(suffixStart - 4, suffixStart - 2)) - 1;
  const birthDay = parseInt(digits.substring(suffixStart - 2, suffixStart));

  // Gender: 3rd-to-last digit of the full number — odd = male, even = female
  const genderDigit = parseInt(digits.charAt(digits.length - 2));
  const gender: 'male' | 'female' = genderDigit % 2 === 1 ? 'male' : 'female';

  // Age from birth date
  const birth = new Date(birthYear, birthMonth, birthDay);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }

  return { gender, age: age > 0 ? age : undefined };
}

export function parseExcelFile(file: File): Promise<HealthData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });

        // Assume first sheet contains health data
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON with header row
        const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // Parse all rows
        const healthDataArray: HealthData[] = rows.map((row) => {
          // Parse personnummer for gender and age if present
          const pnr = row['Personnummer'] || row['personnummer'] || '';
          const pnrParsed = parsePersonnummer(pnr);

          // Gender: explicit column > personnummer
          let gender: 'male' | 'female' | undefined;
          const genderRaw = (row['Gender'] || row['gender'] || row['Kön'] || '').toLowerCase();
          if (['male', 'female'].includes(genderRaw)) {
            gender = genderRaw as 'male' | 'female';
          } else if (pnrParsed.gender) {
            gender = pnrParsed.gender;
          }

          // Age: explicit column > personnummer
          const ageRaw = parseInt(row['Age'] || row['age'] || row['Ålder'] || '0');
          const age = ageRaw > 0 ? ageRaw : pnrParsed.age || undefined;

          const healthData: HealthData = {
            name: row['Name'] || row['name'] || row['Namn'] || 'Anonymous',
            personnummer: pnr || undefined,
            date: row['Date'] || row['date'] || row['Datum'] || new Date().toISOString().split('T')[0],
            bloodWork: {
              hb: parseFloat(row['Hemoglobin'] || row['Hb'] || row['hb'] || 14),
              glucose: parseFloat(row['Glucose'] || row['glucose'] || row['Glukos'] || 5),
              hdl: parseFloat(row['HDL'] || row['hdl'] || 1.3),
              ldl: parseFloat(row['LDL'] || row['ldl'] || 3.0),
              triglycerides: parseFloat(row['Triglycerides'] || row['Trig'] || row['triglycerides'] || row['Triglycerider'] || 1.5),
            },
            lifestyle: {
              sleep: parseInt(row['Sleep'] || row['sleep'] || row['Sömn'] || 7),
              diet: parseInt(row['Diet'] || row['diet'] || row['Kost'] || 7),
              stress: parseInt(row['Stress'] || row['stress'] || 5),
              relationships: parseInt(row['Relationships'] || row['relationships'] || row['Relationer'] || 7),
              smoking: parseInt(row['Smoking'] || row['smoking'] || row['Rökning'] || 10),
              balance: parseInt(row['Balance'] || row['balance'] || row['Balans'] || 6),
              exercise: parseInt(row['Exercise'] || row['exercise'] || row['Träning'] || 6),
              alcohol: parseInt(row['Alcohol'] || row['alcohol'] || row['Alkohol'] || 8),
            },
            fitness: {
              vo2Max: parseFloat(row['VO2 Max'] || row['VO2Max'] || row['vo2max'] || 30),
              gripStrength: parseFloat(row['Grip Strength'] || row['GripStrength'] || row['grip'] || row['Greppstyrka'] || 25),
            },
            bodyComposition: {
              bodyFat: parseFloat(row['Body Fat'] || row['BodyFat'] || row['bodyfat'] || row['Kroppsfett'] || 20),
              muscleMass: parseFloat(row['Muscle Mass'] || row['MuscleMass'] || row['muscle'] || row['Muskelmassa'] || 40),
              weight: parseFloat(row['Weight'] || row['weight'] || row['Vikt'] || 75),
              height: parseFloat(row['Height'] || row['height'] || row['Längd'] || 175),
            },
            bloodPressure: {
              systolic: parseFloat(row['Systolic'] || row['BP Systolic'] || row['systolic'] || row['Systoliskt'] || 120),
              diastolic: parseFloat(row['Diastolic'] || row['BP Diastolic'] || row['diastolic'] || row['Diastoliskt'] || 80),
            },
            age,
            gender,
          };

          // Validate critical fields
          if (!healthData.bloodWork.hb) reject(new Error('Missing: Hemoglobin'));
          if (!healthData.bloodWork.glucose) reject(new Error('Missing: Glucose'));

          return healthData;
        });

        // Sort by date (oldest first)
        healthDataArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        resolve(healthDataArray);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function generateSampleExcel(): Blob {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  // Swedish sample data — personnummer 3rd-to-last digit odd = man
  // Erik Johansson, born 1982-04-15, male (7 is odd)
  // Blood values in Swedish units: g/L (Hb), mmol/L (glucose, LDL, HDL, triglycerides)
  // Progression: some warning values → mixed → mostly optimal
  const data = [
    {
      Name: 'Erik Johansson',
      Personnummer: '19820415-5578',
      Date: sixMonthsAgo.toISOString().split('T')[0],
      Hemoglobin: 131,
      Glucose: 6.4,
      HDL: 0.9,
      LDL: 4.9,
      Triglycerides: 2.8,
      Sömn: 5,
      Kost: 6,
      Stress: 7,
      Relationer: 6,
      Rökning: 1,
      Balans: 4,
      Träning: 3,
      Alkohol: 2,
      'VO2 Max': 34,
      'Grip Strength': 38,
      'Body Fat': 26,
      'Muscle Mass': 40,
      Weight: 88,
      Height: 180,
      Systolic: 135,
      Diastolic: 85,
    },
    {
      Name: 'Erik Johansson',
      Personnummer: '19820415-5578',
      Date: threeMonthsAgo.toISOString().split('T')[0],
      Hemoglobin: 142,
      Glucose: 5.6,
      HDL: 1.1,
      LDL: 3.8,
      Triglycerides: 2.1,
      Sömn: 6,
      Kost: 7,
      Stress: 6,
      Relationer: 7,
      Rökning: 1,
      Balans: 5,
      Träning: 5,
      Alkohol: 2,
      'VO2 Max': 38,
      'Grip Strength': 40,
      'Body Fat': 22,
      'Muscle Mass': 43,
      Weight: 83,
      Height: 180,
      Systolic: 126,
      Diastolic: 80,
    },
    {
      Name: 'Erik Johansson',
      Personnummer: '19820415-5578',
      Date: today.toISOString().split('T')[0],
      Hemoglobin: 152,
      Glucose: 5.1,
      HDL: 1.4,
      LDL: 3.1,
      Triglycerides: 1.4,
      Sömn: 7,
      Kost: 8,
      Stress: 5,
      Relationer: 8,
      Rökning: 1,
      Balans: 6,
      Träning: 7,
      Alkohol: 2,
      'VO2 Max': 42,
      'Grip Strength': 43,
      'Body Fat': 18,
      'Muscle Mass': 46,
      Weight: 79,
      Height: 180,
      Systolic: 118,
      Diastolic: 74,
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Data');

  return new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
