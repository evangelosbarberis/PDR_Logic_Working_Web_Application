import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data_storage');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ESTIMATES_FILE = path.join(DATA_DIR, 'estimates.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  company: string;
  role: string;
  phone?: string;
  licenseNumber?: string;
  hourlyRIRate: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface StoredReport {
  id: string;
  userId: string;
  estimateId: string;
  roNumber: string;
  customerName: string;
  recipientEmail: string;
  sentAt: string;
  vehicle: any;
  grandTotal: number;
  totalDentCount: number;
  insuranceCompany: string;
  sentViaSmtp: boolean;
  fileName: string;
  estimateSnapshot: any;
}

// User DB Operations
export function getAllUsers(): StoredUser[] {
  return readJsonFile<StoredUser[]>(USERS_FILE, []);
}

export function getUserByEmail(email: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function getUserById(id: string): StoredUser | undefined {
  const users = getAllUsers();
  return users.find(u => u.id === id);
}

export function saveUser(user: StoredUser): StoredUser {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  writeJsonFile(USERS_FILE, users);
  return user;
}

// Active Estimates DB Operations (User State Persistence)
export function getUserActiveEstimate(userId: string): any | null {
  const estimates = readJsonFile<Record<string, any>>(ESTIMATES_FILE, {});
  return estimates[userId] || null;
}

export function saveUserActiveEstimate(userId: string, estimate: any): void {
  const estimates = readJsonFile<Record<string, any>>(ESTIMATES_FILE, {});
  estimates[userId] = {
    ...estimate,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(ESTIMATES_FILE, estimates);
}

// Report History Operations
export function getUserReports(userId: string): StoredReport[] {
  const reports = readJsonFile<StoredReport[]>(REPORTS_FILE, []);
  return reports
    .filter(r => r.userId === userId || !r.userId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export function addReportRecord(report: StoredReport): StoredReport {
  const reports = readJsonFile<StoredReport[]>(REPORTS_FILE, []);
  reports.unshift(report);
  writeJsonFile(REPORTS_FILE, reports);
  return report;
}

export function deleteReportRecord(userId: string, reportId: string): boolean {
  const reports = readJsonFile<StoredReport[]>(REPORTS_FILE, []);
  const filtered = reports.filter(r => !(r.id === reportId && (r.userId === userId || !r.userId)));
  if (filtered.length !== reports.length) {
    writeJsonFile(REPORTS_FILE, filtered);
    return true;
  }
  return false;
}
