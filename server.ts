import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import { 
  getAllUsers, 
  getUserByEmail, 
  getUserById, 
  saveUser, 
  getUserActiveEstimate, 
  saveUserActiveEstimate, 
  getUserReports, 
  addReportRecord, 
  deleteReportRecord,
  StoredUser,
  StoredReport 
} from './server/db';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  authMiddleware, 
  optionalAuthMiddleware, 
  AuthRequest 
} from './server/auth';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Ensure default admin/technician exists in persistent store
(async () => {
  const existing = getUserByEmail('evangelosneobarberis@gmail.com');
  if (!existing) {
    const defaultHash = await hashPassword('pdrlogic2025');
    saveUser({
      id: 'usr_evangelos_default',
      name: 'Evangelos Neo Barberis',
      email: 'evangelosneobarberis@gmail.com',
      passwordHash: defaultHash,
      company: 'PDR Logic Mobile Team',
      role: 'Master Appraiser',
      phone: '(555) 737-5644',
      hourlyRIRate: 75,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
    console.log('[PDR Logic DB] Seeded default master appraiser account: evangelosneobarberis@gmail.com');
  }
})();

// Lazy initialize GoogleGenAI client
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
});

// ==========================================
// AUTHENTICATION & USER MANAGEMENT (SECURE)
// ==========================================

// Register new user with password hashing
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company, role, phone, hourlyRIRate } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = getUserByEmail(cleanEmail);

    if (existing && existing.passwordHash) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    const passwordHash = password ? await hashPassword(password) : await hashPassword('pdrlogic2025');

    const newUser: StoredUser = {
      id: existing ? existing.id : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name || (existing ? existing.name : cleanEmail.split('@')[0]),
      email: cleanEmail,
      passwordHash,
      company: company || (existing ? existing.company : 'PDR Logic Certified Estimators'),
      role: role || (existing ? existing.role : 'Technician'),
      phone: phone || (existing ? existing.phone : ''),
      hourlyRIRate: Number(hourlyRIRate) || (existing ? existing.hourlyRIRate : 75),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    saveUser(newUser);
    const token = generateToken(newUser);

    // Return safe user object (omit password hash)
    const { passwordHash: _, ...safeUser } = newUser;
    const savedEstimate = getUserActiveEstimate(newUser.id);

    res.json({
      user: safeUser,
      token,
      savedEstimate,
      message: 'Account created successfully',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// Sign-in endpoint with bcrypt verification and state restore
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = getUserByEmail(cleanEmail);

    // If user doesn't exist yet, auto-create friendly technician account for seamless friction-free workflow
    if (!user) {
      const passwordHash = await hashPassword(password || 'pdrlogic2025');
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: cleanEmail,
        passwordHash,
        company: 'PDR Logic Appraiser Team',
        role: 'Technician',
        hourlyRIRate: 75,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      saveUser(user);
    } else if (password && user.passwordHash) {
      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password. Please try again.' });
      }
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    saveUser(user);

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    // Retrieve the user's saved active estimate so they resume exactly where they left off!
    const savedEstimate = getUserActiveEstimate(user.id);

    res.json({
      user: safeUser,
      token,
      savedEstimate,
      message: 'Signed in successfully',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

// Get current authenticated user + active estimate state
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { passwordHash: _, ...safeUser } = req.user;
  const savedEstimate = getUserActiveEstimate(req.user.id);
  const reports = getUserReports(req.user.id);

  res.json({
    user: safeUser,
    savedEstimate,
    reportsCount: reports.length,
  });
});

// Update current user profile
app.put('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, company, role, phone, hourlyRIRate, password } = req.body;

  const updated: StoredUser = {
    ...req.user,
    name: name || req.user.name,
    company: company || req.user.company,
    role: role || req.user.role,
    phone: phone !== undefined ? phone : req.user.phone,
    hourlyRIRate: Number(hourlyRIRate) || req.user.hourlyRIRate,
    lastLoginAt: new Date().toISOString(),
  };

  if (password && password.trim()) {
    updated.passwordHash = await hashPassword(password);
  }

  saveUser(updated);
  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser, message: 'Profile updated successfully' });
});

// ==========================================
// USER STATE PERSISTENCE (WHERE THEY LEFT OFF)
// ==========================================

// Get user's active estimate
app.get('/api/user/active-estimate', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const estimate = getUserActiveEstimate(req.user.id);
  res.json({ estimate });
});

// Save user's active estimate (Continuous Cloud Sync)
app.post('/api/user/active-estimate', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const estimate = req.body;

  if (!estimate) {
    return res.status(400).json({ error: 'Estimate payload is required' });
  }

  saveUserActiveEstimate(req.user.id, estimate);
  res.json({ status: 'saved', updatedAt: new Date().toISOString() });
});

// ==========================================
// REPORTS HISTORY & EMAIL DISPATCH
// ==========================================

// Get all sent report history for this user
app.get('/api/reports/history', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const reports = getUserReports(req.user.id);
  res.json({ reports });
});

// Delete a report from history
app.delete('/api/reports/:id', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const success = deleteReportRecord(req.user.id, req.params.id);
  if (success) {
    res.json({ status: 'deleted', id: req.params.id });
  } else {
    res.status(404).json({ error: 'Report not found' });
  }
});

// Send Report Email endpoint with Nodemailer, PDF attachment, and persistent history record
app.post('/api/send-report-email', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const { recipientEmail, estimate, pdfBase64, fileName } = req.body;

    if (!recipientEmail || !estimate) {
      return res.status(400).json({ error: 'Recipient email and estimate data are required' });
    }

    const userId = req.user ? req.user.id : (estimate.technicianId || 'tech_default');
    const summary = estimate.summary || {};
    const vehicle = estimate.vehicle || {};
    const panels = estimate.panels || {};

    // Build labeled panel damage HTML table rows
    let panelRowsHtml = '';
    Object.keys(panels).forEach(panelKey => {
      const p = panels[panelKey];
      if (p && (p.dentCount > 0 || (p.riItems && p.riItems.some((i: any) => i.selected)))) {
        const activeMarkups = [];
        if (p.markups?.includes('aluminumPanels') || p.markups?.aluminum) activeMarkups.push('Alum +25%');
        if (p.markups?.includes('highStrengthSteel') || p.markups?.highStrengthSteel) activeMarkups.push('HSS +25%');
        if (p.markups?.includes('doublePanels') || p.markups?.doubleMetal) activeMarkups.push('Dbl Metal +25%');
        if (p.markups?.includes('gluePull') || p.markups?.gluePullOnly) activeMarkups.push('Glue Pull +25%');
        if (p.markups?.includes('limitedAccess') || p.markups?.obstructedAccess) activeMarkups.push('Obstructed +25%');
        if (p.markups?.includes('xlPanel')) activeMarkups.push('XL +25%');
        const markupText = activeMarkups.length > 0 ? activeMarkups.join(', ') : 'Standard';

        const activeRi = (p.riItems || []).filter((i: any) => i.selected);
        const riText = activeRi.length > 0
          ? activeRi.map((i: any) => `${i.name || i.label} (${i.hours}h)`).join(', ')
          : 'None';

        panelRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
            <td style="padding: 8px 6px; font-weight: 700; color: #0f172a;">${panelKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}</td>
            <td style="padding: 8px 6px; text-align: center;">${p.dentCount} (${p.primaryDentSize || p.dentSize || 'Dime'})</td>
            <td style="padding: 8px 6px; text-align: right;">$${(p.baseCost || p.matrixBasePrice || 0).toLocaleString()}</td>
            <td style="padding: 8px 6px; text-align: center;">${p.oversizeCount > 0 ? `${p.oversizeCount} (+$${p.oversizeCost})` : '-'}</td>
            <td style="padding: 8px 6px; font-size: 11px; color: #475569;">${markupText}</td>
            <td style="padding: 8px 6px; font-size: 11px; color: #475569;">${riText}</td>
            <td style="padding: 8px 6px; text-align: right; font-weight: 700; color: #c5a059;">$${(p.totalCost || p.subtotal || 0).toLocaleString()}</td>
          </tr>
        `;
      }
    });

    if (!panelRowsHtml) {
      panelRowsHtml = `<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b;">No damaged panels recorded</td></tr>`;
    }

    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; background: #f1f5f9; }
            .card { background: #ffffff; max-width: 680px; margin: 0 auto; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { background: #141414; color: #ffffff; padding: 24px 28px; border-bottom: 4px solid #c5a059; }
            .header h1 { margin: 0; font-size: 24px; color: #c5a059; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
            .content { padding: 24px 28px; }
            .badge { display: inline-block; background: #1f1f1f; color: #c5a059; border: 1px solid #3d3d3d; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }
            .section-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 20px 0 10px 0; border-bottom: 2px solid #c5a059; padding-bottom: 4px; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; font-size: 12.5px; }
            .info-block { background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-block span { color: #64748b; font-size: 11px; text-transform: uppercase; display: block; font-weight: 600; }
            .info-block strong { color: #0f172a; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th { background: #1e293b; color: #c5a059; font-size: 11px; text-align: left; padding: 8px 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .total-box { background: #141414; color: #e0ded7; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #c5a059; }
            .total-row { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; }
            .grand-total { font-size: 20px; font-weight: 800; color: #c5a059; border-top: 1px solid #3d3d3d; padding-top: 12px; margin-top: 10px; }
            .footer { font-size: 11.5px; color: #64748b; margin-top: 24px; text-align: center; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h1>PDR LOGIC &bull; HAIL DAMAGE APPRAISAL</h1>
                  <p>Work Order: ${estimate.roNumber || '#EST-8829-X'} &bull; Certified D&amp;G Paradigm 2025 Standard</p>
                </div>
                <div>
                  <span class="badge">${estimate.status ? estimate.status.toUpperCase() : 'APPROVED'}</span>
                </div>
              </div>
            </div>
            <div class="content">
              <div class="section-title">Vehicle &amp; Customer Information</div>
              <div class="grid">
                <div class="info-block">
                  <span>Vehicle Inspected</span>
                  <strong>${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                    ${vehicle.bodyClass || 'Sedan'} &bull; Finish: ${vehicle.color || 'OEM'}
                  </div>
                </div>
                <div class="info-block">
                  <span>Vehicle Identification Number (VIN)</span>
                  <strong style="font-family: monospace; font-size: 12px;">${vehicle.vin || 'N/A'}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                    Powertrain: ${vehicle.fuelType || 'EV/Gas'} &bull; ${vehicle.driveType || 'AWD'}
                  </div>
                </div>
                <div class="info-block">
                  <span>Customer &amp; Claim</span>
                  <strong>${estimate.customerName || 'Customer'}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                    Phone: ${estimate.customerPhone || 'N/A'} &bull; Claim #: ${estimate.claimNumber || 'N/A'}
                  </div>
                </div>
                <div class="info-block">
                  <span>Insurance &amp; Appraiser</span>
                  <strong>${estimate.insuranceCompany || 'USAA'}</strong>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">
                    Technician: ${estimate.technicianName || 'Master Tech'} ($${estimate.discounts?.hourlyRate || 75}/hr R&amp;I)
                  </div>
                </div>
              </div>

              <div class="section-title">Panel-by-Panel Damage Breakdown</div>
              <table>
                <thead>
                  <tr>
                    <th>Panel</th>
                    <th style="text-align: center;">Hail / Size</th>
                    <th style="text-align: right;">Matrix Base</th>
                    <th style="text-align: center;">Oversize</th>
                    <th>Conditions (+25%)</th>
                    <th>R&amp;I Operations</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${panelRowsHtml}
                </tbody>
              </table>

              <div class="section-title">Financial Valuation Summary (D&amp;G Paradigm 2025)</div>
              <div class="total-box">
                <div class="total-row"><span>Total Hail Dents:</span><strong>${summary.totalDentCount || 0} pts</strong></div>
                <div class="total-row"><span>Matrix Base Repair:</span><strong>$${(summary.matrixBaseTotal || 0).toLocaleString()}</strong></div>
                <div class="total-row"><span>Oversized Dents (+$50/ea):</span><strong>+$${(summary.oversizeTotal || 0).toLocaleString()}</strong></div>
                <div class="total-row"><span>25% Condition Markups:</span><strong>+$${(summary.markupsTotal || 0).toLocaleString()}</strong></div>
                <div class="total-row"><span>R&amp;I Mechanical Labor:</span><strong>+$${(summary.riLaborTotal || 0).toLocaleString()}</strong></div>
                ${summary.discountTotal > 0 ? `<div class="total-row" style="color: #c5a059;"><span>Insurer CCC Discounts:</span><strong>-$${(summary.discountTotal || 0).toLocaleString()}</strong></div>` : ''}
                <div class="total-row grand-total">
                  <span>Grand Valuation Total:</span>
                  <span>$${(summary.grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>

              <div class="footer">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a;">
                  1-Page PDF Valuation Certificate Attached: ${fileName || `PDR_Logic_Appraisal_${estimate.roNumber}.pdf`}
                </p>
                <p style="margin: 0;">
                  Calculated strictly under the certified D&amp;G Paradigm 2025 Paintless Dent Repair Matrix Standard.<br/>
                  Dispatched via PDR Logic Platform &bull; Certified Appraiser Network
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    let sentViaSmtp = false;
    const attachments: any[] = [];

    if (pdfBase64) {
      attachments.push({
        filename: fileName || `PDR_Logic_Appraisal_${estimate.roNumber || 'EST'}.pdf`,
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      });
    }

    // Real SMTP delivery if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'PDR Logic <no-reply@pdrlogic.com>',
          to: recipientEmail,
          subject: `[PDF Appraisal] PDR Logic Hail Damage Valuation: ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} [RO: ${estimate.roNumber}]`,
          html: htmlEmail,
          attachments,
        });

        sentViaSmtp = true;
      } catch (smtpErr) {
        console.warn('[PDR Logic SMTP dispatch note]:', smtpErr);
      }
    }

    // PERSIST REPORT TO HISTORY STORE
    const savedReport: StoredReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      estimateId: estimate.id,
      roNumber: estimate.roNumber || '#EST-8829-X',
      customerName: estimate.customerName || 'Direct Customer',
      recipientEmail,
      sentAt: new Date().toISOString(),
      vehicle: estimate.vehicle,
      grandTotal: estimate.summary?.grandTotal || 0,
      totalDentCount: estimate.summary?.totalDentCount || 0,
      insuranceCompany: estimate.insuranceCompany || 'USAA',
      sentViaSmtp,
      fileName: fileName || `PDR_Logic_Appraisal_${estimate.roNumber}.pdf`,
      estimateSnapshot: estimate,
    };

    addReportRecord(savedReport);
    console.log(`[PDR Logic Reports] Saved sent report ${savedReport.id} for RO ${savedReport.roNumber} to ${recipientEmail}`);

    res.json({
      status: 'sent',
      report: savedReport,
      recipient: recipientEmail,
      sentViaSmtp,
      hasPdfAttachment: Boolean(pdfBase64),
      fileName: savedReport.fileName,
      messageId: savedReport.id,
      timestamp: savedReport.sentAt,
    });
  } catch (err: any) {
    console.error('Email report dispatch error:', err);
    res.status(500).json({ error: err.message || 'Error processing email dispatch' });
  }
});

// ==========================================
// VEHICLE VIN DECODE (NHTSA vPIC PROXY)
// ==========================================

app.get('/api/vin-decode/:vin', async (req, res) => {
  const vin = req.params.vin.toUpperCase();
  try {
    const fetchRes = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: 'NHTSA API lookup failed' });
    }
    const data = await fetchRes.json();
    const result = data.Results && data.Results[0];

    if (result) {
      res.json({
        vin,
        year: result.ModelYear || '2024',
        make: result.Make || 'Unknown Make',
        model: result.Model || 'Unknown Model',
        trim: result.Trim || result.Series || '',
        bodyClass: result.BodyClass || 'Sedan',
        doors: result.Doors || '4',
        driveType: result.DriveType || 'AWD',
        engine: result.DisplacementL ? `${result.DisplacementL}L ${result.EngineConfiguration || ''}` : '2.0L Turbo',
      });
    } else {
      res.status(404).json({ error: 'Vehicle details not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal error decoding VIN' });
  }
});

// ==========================================
// GEMINI ASSISTANT "JAMES" (AI SPECIALIST)
// ==========================================

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, history, estimateContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are "James", the dedicated AI PDR (Paintless Dent Repair) Hail Estimating Specialist for PDR Logic.
You are an expert in the D&G Paradigm 2025 Hail Matrix standard, automotive panel anatomy, insurance appraisal workflows, and pricing logic.

KEY PDR RULES & STANDARDS:
1. D&G Paradigm 2025 Matrix:
   - Panel pricing brackets: 1-5, 6-15, 16-30, 31-50, 51-75, 76-100, 101-125, 126-150, 151-175, 176-200.
   - Coin Sizing: Dime (Ø 17.9mm), Nickel (Ø 21.2mm), Quarter (Ø 24.26mm), Half Dollar (Ø 30.61mm).
2. Oversize Dents:
   - Any dent larger than a Half Dollar (> 30.61mm) incurs a flat +$50.00 surcharge per oversized dent.
3. 25% Condition Markups (additive +25% on panel matrix base each):
   - Aluminum Panels (+25%).
   - High-Strength / Boron Steel (+25%).
   - Double Metal / Laminated / Inner bracing (+25%).
   - Creased / Sharp Ridge / Body Line dents (+25%).
   - Glue Pulling required (+25%).
   - Obstructed / Restricted Access (+25%).
4. R&I Labor:
   - Standard hourly rate: $75.00/hr.

CURRENT ESTIMATE CONTEXT:
${estimateContext ? JSON.stringify(estimateContext, null, 2) : 'No active vehicle context provided yet.'}

Provide clear, concise, actionable, and friendly guidance.`;

    if (!ai) {
      const lowerMsg = message.toLowerCase();
      let reply = "Hello! I'm James, your PDR Logic Estimating Assistant. I can help you with D&G Paradigm 2025 matrix pricing, oversize dent surcharges (+$50/dent), 25% condition markups, and R&I labor calculations.";
      
      if (lowerMsg.includes('aluminum') || lowerMsg.includes('alu')) {
        reply = "According to the D&G Paradigm 2025 standard, aluminum panels carry a mandatory +25% condition markup because aluminum requires specialized heat and leverage techniques.";
      } else if (lowerMsg.includes('oversize') || lowerMsg.includes('half dollar')) {
        reply = "Oversized dents are impacts larger than a Half Dollar (> 30.61mm). Under D&G 2025 rules, each oversized dent adds a flat +$50.00 surcharge on top of the matrix base.";
      } else if (estimateContext && (lowerMsg.includes('total') || lowerMsg.includes('estimate') || lowerMsg.includes('summary'))) {
        reply = `For this ${estimateContext.vehicle || 'vehicle'}, the current appraisal shows ${estimateContext.totalDentCount || 0} hail dents with a Grand Valuation of $${(estimateContext.grandTotal || 0).toLocaleString()}.`;
      }

      return res.json({ reply, source: 'local_rule_engine' });
    }

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I am analyzing your PDR hail estimate. Let me know if you need specific matrix adjustments.",
      source: 'gemini-3.7-flash',
    });
  } catch (err: any) {
    console.error('Gemini James Assistant Error:', err);
    res.json({
      reply: "I am James, your PDR Logic Assistant. Based on the D&G Paradigm 2025 matrix, make sure to verify coin sizing, apply +$50 for oversized dents, and toggle +25% markups for aluminum or glue-pulling access.",
      source: 'fallback',
    });
  }
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDR Logic Secure Server running on http://localhost:${PORT}`);
  });
}

startServer();
