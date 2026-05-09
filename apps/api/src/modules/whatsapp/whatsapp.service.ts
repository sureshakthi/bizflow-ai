import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Entry Point ──────────────────────────────────────────────────────────
  async handleIncoming(body: any) {
    try {
      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return { status: 'no_message' };
      const phone = message.from;
      let text = '';
      if (message.type === 'text') {
        text = message.text?.body?.trim() || '';
      } else if (message.type === 'interactive') {
        text = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || '';
      } else {
        await this.sendText(phone, 'Sorry, I only understand text messages. Please type your reply.');
        return { status: 'unsupported' };
      }
      await this.route(phone, text);
      return { status: 'ok' };
    } catch (err) {
      this.logger.error('handleIncoming error', err);
      return { status: 'error' };
    }
  }

  // ── Router ───────────────────────────────────────────────────────────────
  private async route(phone: string, text: string) {
    const conv = await this.getOrCreateConv(phone);
    const state = conv.state;
    const data = JSON.parse(conv.data || '{}');

    // Global: CONFIRM / CANCEL for reminder replies
    const registrationStates = ['NEW_LANG', 'NEW_NAME', 'NEW_DOB', 'NEW_GENDER', 'NEW_PURPOSE', 'NEW_DOCTOR', 'NEW_CONFIRM', 'NEW_LOCATION'];
    const confirmingStates = ['BOOK_CONFIRM', 'WALKIN_CONFIRM', 'DIGITAL_CONFIRM'];
    if (text.toUpperCase() === 'CONFIRM' && !confirmingStates.includes(state)) {
      await this.handleQuickConfirm(phone);
      return;
    }
    if (text.toUpperCase() === 'CANCEL' && !confirmingStates.includes(state)) {
      await this.handleQuickCancel(phone);
      return;
    }
    // Global: reset to menu for existing patients
    if (['menu', 'hi', 'hello', 'start', 'help'].includes(text.toLowerCase()) && !registrationStates.includes(state)) {
      const patient = await this.prisma.patient.findUnique({ where: { phone } });
      if (patient) {
        await this.sendExistingMenu(phone, patient.name);
        await this.setState(phone, 'MENU', {});
        return;
      }
    }

    switch (state) {
      case 'IDLE':             return this.handleIdle(phone, text, data);
      case 'NEW_LANG':         return this.handleNewLang(phone, text, data);
      case 'NEW_NAME':         return this.handleNewName(phone, text, data);
      case 'NEW_DOB':          return this.handleNewDob(phone, text, data);
      case 'NEW_GENDER':       return this.handleNewGender(phone, text, data);
      case 'NEW_PURPOSE':      return this.handleNewPurpose(phone, text, data);
      case 'NEW_DOCTOR':       return this.handleNewDoctor(phone, text, data);
      case 'NEW_CONFIRM':      return this.handleNewConfirm(phone, text, data);
      case 'NEW_LOCATION':     return this.handleNewLocation(phone, text, data);
      case 'MENU':             return this.handleMenu(phone, text, data);
      case 'WALKIN_PURPOSE':   return this.handleWalkinPurpose(phone, text, data);
      case 'WALKIN_DOCTOR':    return this.handleWalkinDoctor(phone, text, data);
      case 'WALKIN_CONFIRM':   return this.handleWalkinConfirm(phone, text, data);
      case 'BOOK_PURPOSE':     return this.handleBookPurpose(phone, text, data);
      case 'BOOK_DOCTOR':      return this.handleBookDoctor(phone, text, data);
      case 'BOOK_DATE':        return this.handleBookDate(phone, text, data);
      case 'BOOK_TIME':        return this.handleBookTime(phone, text, data);
      case 'BOOK_CONFIRM':     return this.handleBookConfirm(phone, text, data);
      case 'DIGITAL_PURPOSE':  return this.handleDigitalPurpose(phone, text, data);
      case 'DIGITAL_DOCTOR':   return this.handleDigitalDoctor(phone, text, data);
      case 'DIGITAL_TYPE':     return this.handleDigitalType(phone, text, data);
      case 'DIGITAL_DATE':     return this.handleDigitalDate(phone, text, data);
      case 'DIGITAL_TIME':     return this.handleDigitalTime(phone, text, data);
      case 'DIGITAL_CONFIRM':  return this.handleDigitalConfirm(phone, text, data);
      case 'PRECONSULT_Q1':    return this.handlePreconsultQ1(phone, text, data);
      case 'PRECONSULT_Q2':    return this.handlePreconsultQ2(phone, text, data);
      case 'PRECONSULT_Q3':    return this.handlePreconsultQ3(phone, text, data);
      case 'PRECONSULT_Q4':    return this.handlePreconsultQ4(phone, text, data);
      case 'PRECONSULT_Q5':    return this.handlePreconsultQ5(phone, text, data);
      case 'PRECONSULT_Q6':    return this.handlePreconsultQ6(phone, text, data);
      case 'PRECONSULT_Q7':    return this.handlePreconsultQ7(phone, text, data);
      case 'QA_QUESTION':      return this.handleQaQuestion(phone, text, data);
      case 'FEEDBACK_RATING':  return this.handleFeedbackRating(phone, text, data);
      case 'FEEDBACK_COMMENT': return this.handleFeedbackComment(phone, text, data);
      default:
        await this.setState(phone, 'IDLE', {});
        return this.handleIdle(phone, text, data);
    }
  }

  // ── IDLE ─────────────────────────────────────────────────────────────────
  private async handleIdle(phone: string, text: string, data: any) {
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) {
      await this.sendText(
        phone,
        `🏥 *Sai Ram Fertility & Maternity Centre*\n` +
        `15/6 Vidyodaya, T-Nagar, Chennai\n\n` +
        `வரவேற்கிறோம்! / Welcome!\n\n` +
        `Please select your language:\n\n` +
        `1️⃣ தமிழ் (Tamil)\n` +
        `2️⃣ English\n` +
        `3️⃣ हिंदी (Hindi)\n` +
        `4️⃣ తెలుగు (Telugu)`,
      );
      await this.setState(phone, 'NEW_LANG', {});
    } else {
      await this.sendExistingMenu(phone, patient.name);
      await this.setState(phone, 'MENU', {});
    }
  }

  // ── NEW PATIENT REGISTRATION ──────────────────────────────────────────────
  private async handleNewLang(phone: string, text: string, data: any) {
    const map: Record<string, string> = {
      '1': 'TAMIL', 'tamil': 'TAMIL',
      '2': 'ENGLISH', 'english': 'ENGLISH',
      '3': 'HINDI', 'hindi': 'HINDI',
      '4': 'TELUGU', 'telugu': 'TELUGU',
    };
    const language = map[text.toLowerCase()];
    if (!language) { await this.sendText(phone, 'Please reply *1*, *2*, *3*, or *4* to select your language.'); return; }
    await this.setState(phone, 'NEW_NAME', { language });
    await this.sendText(phone, `👤 Please enter your *full name*:`);
  }

  private async handleNewName(phone: string, text: string, data: any) {
    if (text.length < 2) { await this.sendText(phone, 'Please enter a valid full name.'); return; }
    await this.setState(phone, 'NEW_DOB', { ...data, name: text });
    await this.sendText(phone, `📅 Please enter your *Date of Birth* in DD-MM-YYYY format:\n_Example: 15-06-1990_`);
  }

  private async handleNewDob(phone: string, text: string, data: any) {
    const m = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) { await this.sendText(phone, `Invalid format. Please enter as *DD-MM-YYYY*.\n_Example: 15-06-1990_`); return; }
    const [, dd, mm, yyyy] = m;
    const dob = new Date(`${yyyy}-${mm}-${dd}`);
    if (isNaN(dob.getTime())) { await this.sendText(phone, 'Invalid date. Please try again.'); return; }
    await this.setState(phone, 'NEW_GENDER', { ...data, dob: `${yyyy}-${mm}-${dd}` });
    await this.sendText(phone, `⚕️ Please select your *gender*:\n\n1️⃣ Male\n2️⃣ Female`);
  }

  private async handleNewGender(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'MALE', 'male': 'MALE', '2': 'FEMALE', 'female': 'FEMALE' };
    const gender = map[text.toLowerCase()];
    if (!gender) { await this.sendText(phone, 'Please reply *1* for Male or *2* for Female.'); return; }
    await this.setState(phone, 'NEW_PURPOSE', { ...data, gender });
    await this.sendText(
      phone,
      `🏥 Please select your *purpose of visit*:\n\n` +
      `1️⃣ Consultation\n2️⃣ Fertility Check\n3️⃣ Scan / Test\n4️⃣ Follow-up Visit`,
    );
  }

  private async handleNewPurpose(phone: string, text: string, data: any) {
    const map: Record<string, string> = {
      '1': 'CONSULTATION', '2': 'FERTILITY_CHECK', '3': 'SCAN_TEST', '4': 'FOLLOW_UP',
    };
    const purpose = map[text];
    if (!purpose) { await this.sendText(phone, 'Please reply *1*, *2*, *3*, or *4*.'); return; }
    const doctors = await this.prisma.doctor.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
    let msg = `👨‍⚕️ Please select a *doctor*:\n\n`;
    doctors.forEach((d, i) => { msg += `${i + 1}️⃣ Dr. ${d.name} — ${d.specialization} — ₹${d.fees}\n`; });
    await this.setState(phone, 'NEW_DOCTOR', { ...data, purpose, doctorList: doctors.map(d => ({ id: d.id, name: d.name, deptCode: d.deptCode, fees: d.fees })) });
    await this.sendText(phone, msg);
  }

  private async handleNewDoctor(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const doctors: any[] = data.doctorList || [];
    if (isNaN(idx) || idx < 0 || idx >= doctors.length) { await this.sendText(phone, `Please reply with a number 1–${doctors.length}.`); return; }
    const doctor = doctors[idx];
    await this.setState(phone, 'NEW_CONFIRM', { ...data, doctorId: doctor.id, doctorName: doctor.name, doctorFees: doctor.fees });
    await this.sendText(
      phone,
      `📋 *Registration Summary*\n\n` +
      `👤 Name: ${data.name}\n📅 DOB: ${this.fmtDob(data.dob)}\n⚕️ Gender: ${data.gender}\n` +
      `🏥 Purpose: ${data.purpose.replace(/_/g, ' ')}\n👨‍⚕️ Doctor: Dr. ${doctor.name}\n💰 Fees: ₹${doctor.fees}\n\n` +
      `Reply *1* to Confirm ✅  |  *2* to Edit ✏️`,
    );
  }

  private async handleNewConfirm(phone: string, text: string, data: any) {
    if (text === '2' || text.toLowerCase() === 'edit') {
      await this.setState(phone, 'NEW_LANG', {});
      await this.sendText(phone, `Let's start over.\n\nPlease select your language:\n1️⃣ Tamil\n2️⃣ English\n3️⃣ Hindi\n4️⃣ Telugu`);
      return;
    }
    if (text !== '1' && text.toLowerCase() !== 'confirm') { await this.sendText(phone, 'Please reply *1* to confirm or *2* to edit.'); return; }
    await this.setState(phone, 'NEW_LOCATION', data);
    await this.sendText(phone, `📍 *Where are you right now?*\n\n1️⃣ At the Clinic (get token now)\n2️⃣ Pre-Booking (future appointment)`);
  }

  private async handleNewLocation(phone: string, text: string, data: any) {
    const atClinic = text === '1' || text.toLowerCase().includes('clinic');
    const prebook = text === '2' || text.toLowerCase().includes('book');
    if (atClinic) {
      await this.createPatientAndIssueToken(phone, data);
    } else if (prebook) {
      await this.ensurePatientExists(phone, data);
      await this.setState(phone, 'BOOK_DATE', { ...data, bookDoctorId: data.doctorId, bookDoctorName: data.doctorName, bookFees: data.doctorFees });
      await this.sendText(phone, `📅 Please enter your preferred *appointment date* in DD-MM-YYYY format:\n_Example: 15-06-2026_`);
    } else {
      await this.sendText(phone, 'Please reply *1* if you are at the clinic or *2* for pre-booking.');
    }
  }

  // ── EXISTING PATIENT MENU ────────────────────────────────────────────────
  private async sendExistingMenu(phone: string, name: string) {
    await this.sendText(
      phone,
      `👋 Welcome back${name ? `, *${name}*` : ''}!\n\n` +
      `How can I help you today?\n\n` +
      `1️⃣ Book Appointment (In-Person)\n` +
      `2️⃣ Digital Appointment (Video / Phone)\n` +
      `3️⃣ Walk-in Token (At clinic now)\n` +
      `4️⃣ My Records\n` +
      `5️⃣ Ask a Question\n\n` +
      `Reply with a number 1–5.`,
    );
  }

  private async handleMenu(phone: string, text: string, data: any) {
    switch (text.trim()) {
      case '1':
        await this.setState(phone, 'BOOK_PURPOSE', {});
        await this.sendText(phone, `🏥 Purpose of visit:\n\n1️⃣ Consultation\n2️⃣ Fertility Check\n3️⃣ Scan / Test\n4️⃣ Follow-up Visit`);
        break;
      case '2':
        await this.setState(phone, 'DIGITAL_PURPOSE', {});
        await this.sendText(phone, `📱 Purpose of consultation:\n\n1️⃣ Consultation\n2️⃣ Fertility Check\n3️⃣ Follow-up / Doubt about Rx`);
        break;
      case '3':
        await this.setState(phone, 'WALKIN_PURPOSE', {});
        await this.sendText(phone, `🏥 Purpose of visit:\n\n1️⃣ Consultation\n2️⃣ Fertility Check\n3️⃣ Scan / Test\n4️⃣ Follow-up Visit`);
        break;
      case '4':
        await this.sendRecords(phone);
        break;
      case '5':
        await this.setState(phone, 'QA_QUESTION', {});
        await this.sendText(phone, `🤔 Please type your *question* and I'll do my best to help:`);
        break;
      default:
        await this.sendText(phone, `Please reply with a number *1–5*.\n\n1️⃣ Book Appointment\n2️⃣ Digital Appointment\n3️⃣ Walk-in Token\n4️⃣ My Records\n5️⃣ Ask a Question`);
    }
  }

  // ── WALK-IN TOKEN ────────────────────────────────────────────────────────
  private async handleWalkinPurpose(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'CONSULTATION', '2': 'FERTILITY_CHECK', '3': 'SCAN_TEST', '4': 'FOLLOW_UP' };
    const purpose = map[text];
    if (!purpose) { await this.sendText(phone, 'Please reply 1, 2, 3, or 4.'); return; }
    const doctors = await this.prisma.doctor.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
    let msg = `👨‍⚕️ Select a *doctor*:\n\n`;
    doctors.forEach((d, i) => { msg += `${i + 1}️⃣ Dr. ${d.name} — ${d.specialization} — ₹${d.fees}\n`; });
    await this.setState(phone, 'WALKIN_DOCTOR', { purpose, doctorList: doctors.map(d => ({ id: d.id, name: d.name, deptCode: d.deptCode, fees: d.fees })) });
    await this.sendText(phone, msg);
  }

  private async handleWalkinDoctor(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const doctors: any[] = data.doctorList || [];
    if (isNaN(idx) || idx < 0 || idx >= doctors.length) { await this.sendText(phone, `Reply with a number 1–${doctors.length}.`); return; }
    const doctor = doctors[idx];
    await this.setState(phone, 'WALKIN_CONFIRM', { ...data, doctorId: doctor.id, doctorName: doctor.name, doctorFees: doctor.fees });
    await this.sendText(
      phone,
      `📋 *Confirm Walk-in Token*\n\n` +
      `🏥 Purpose: ${data.purpose.replace(/_/g, ' ')}\n` +
      `👨‍⚕️ Doctor: Dr. ${doctor.name}\n` +
      `💰 Fees: ₹${doctor.fees}\n\n` +
      `Reply *1* to Confirm ✅  |  *2* to Cancel ❌`,
    );
  }

  private async handleWalkinConfirm(phone: string, text: string, data: any) {
    if (text === '2' || text.toLowerCase() === 'cancel') { await this.goToMenu(phone); return; }
    if (text !== '1' && text.toLowerCase() !== 'confirm') { await this.sendText(phone, 'Reply *1* to confirm or *2* to cancel.'); return; }
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.sendText(phone, 'Patient record not found. Please contact reception.'); await this.setState(phone, 'IDLE', {}); return; }
    await this.issueToken(phone, patient.id, data.doctorId, data.doctorName, data.purpose, data.doctorFees || 0);
  }

  // ── IN-PERSON BOOKING ────────────────────────────────────────────────────
  private async handleBookPurpose(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'CONSULTATION', '2': 'FERTILITY_CHECK', '3': 'SCAN_TEST', '4': 'FOLLOW_UP' };
    const purpose = map[text];
    if (!purpose) { await this.sendText(phone, 'Please reply 1, 2, 3, or 4.'); return; }
    const doctors = await this.prisma.doctor.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
    let msg = `👨‍⚕️ Select a *doctor*:\n\n`;
    doctors.forEach((d, i) => { msg += `${i + 1}️⃣ Dr. ${d.name} — ${d.specialization} — ₹${d.fees}\n`; });
    await this.setState(phone, 'BOOK_DOCTOR', { purpose, doctorList: doctors.map(d => ({ id: d.id, name: d.name, fees: d.fees })) });
    await this.sendText(phone, msg);
  }

  private async handleBookDoctor(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const doctors: any[] = data.doctorList || [];
    if (isNaN(idx) || idx < 0 || idx >= doctors.length) { await this.sendText(phone, `Reply with a number 1–${doctors.length}.`); return; }
    const doctor = doctors[idx];
    await this.setState(phone, 'BOOK_DATE', { ...data, bookDoctorId: doctor.id, bookDoctorName: doctor.name, bookFees: doctor.fees });
    await this.sendText(phone, `📅 Enter the *appointment date* in DD-MM-YYYY format:\n_Example: 15-06-2026_`);
  }

  private async handleBookDate(phone: string, text: string, data: any) {
    const m = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) { await this.sendText(phone, 'Please enter date as *DD-MM-YYYY*. Example: 15-06-2026'); return; }
    const [, dd, mm, yyyy] = m;
    const date = new Date(`${yyyy}-${mm}-${dd}`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(date.getTime()) || date <= today) { await this.sendText(phone, 'Please enter a *future* date.'); return; }
    const slots = await this.getTimeSlots(data.bookDoctorId, `${yyyy}-${mm}-${dd}`);
    if (!slots.length) { await this.sendText(phone, `No slots on ${text}. Please try another date (DD-MM-YYYY):`); return; }
    let msg = `⏰ *Available slots on ${text}*:\n\n`;
    slots.forEach((s, i) => { msg += `${i + 1}️⃣ ${s}\n`; });
    await this.setState(phone, 'BOOK_TIME', { ...data, bookDate: `${yyyy}-${mm}-${dd}`, timeSlots: slots });
    await this.sendText(phone, msg + `\nReply with the slot number.`);
  }

  private async handleBookTime(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const slots: string[] = data.timeSlots || [];
    if (isNaN(idx) || idx < 0 || idx >= slots.length) { await this.sendText(phone, `Reply with a number 1–${slots.length}.`); return; }
    const timeSlot = slots[idx];
    await this.setState(phone, 'BOOK_CONFIRM', { ...data, bookTime: timeSlot });
    await this.sendText(
      phone,
      `📋 *Appointment Summary*\n\n` +
      `👨‍⚕️ Dr. ${data.bookDoctorName}\n` +
      `🏥 ${data.purpose.replace(/_/g, ' ')}\n` +
      `📅 ${this.fmtDateDisplay(data.bookDate)} at ${timeSlot}\n` +
      `💰 Fees: ₹${data.bookFees || 0}\n\n` +
      `Reply *1* to Confirm ✅  |  *2* to Cancel ❌`,
    );
  }

  private async handleBookConfirm(phone: string, text: string, data: any) {
    if (text === '2' || text.toLowerCase() === 'cancel') { await this.goToMenu(phone); return; }
    if (text !== '1' && text.toLowerCase() !== 'confirm') { await this.sendText(phone, 'Reply *1* to confirm or *2* to cancel.'); return; }
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.setState(phone, 'IDLE', {}); return; }
    const appt = await this.prisma.appointment.create({
      data: { patientId: patient.id, doctorId: data.bookDoctorId, purpose: data.purpose || 'CONSULTATION', type: 'IN_PERSON', date: new Date(data.bookDate), timeSlot: data.bookTime, status: 'CONFIRMED', fees: data.bookFees || 0, isFree: false },
    });
    await this.goToMenu(phone);
    await this.sendText(
      phone,
      `✅ *Appointment Confirmed!*\n\n` +
      `🎫 Ref: APT-${appt.id.slice(-6).toUpperCase()}\n` +
      `👨‍⚕️ Dr. ${data.bookDoctorName}\n` +
      `📅 ${this.fmtDateDisplay(data.bookDate)} at ${data.bookTime}\n` +
      `💰 Fees: ₹${data.bookFees || 0}\n\n` +
      `_Please arrive 15 minutes early._\n\nReply *menu* anytime for help.`,
    );
  }

  // ── DIGITAL APPOINTMENT ──────────────────────────────────────────────────
  private async handleDigitalPurpose(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'CONSULTATION', '2': 'FERTILITY_CHECK', '3': 'FOLLOW_UP' };
    const purpose = map[text];
    if (!purpose) { await this.sendText(phone, 'Please reply 1, 2, or 3.'); return; }
    const doctors = await this.prisma.doctor.findMany({ where: { isAvailable: true }, orderBy: { name: 'asc' } });
    let msg = `👨‍⚕️ Select a *doctor*:\n\n`;
    doctors.forEach((d, i) => { msg += `${i + 1}️⃣ Dr. ${d.name} — ${d.specialization}\n`; });
    await this.setState(phone, 'DIGITAL_DOCTOR', { purpose, doctorList: doctors.map(d => ({ id: d.id, name: d.name, digitalFees: d.digitalFees || 300 })) });
    await this.sendText(phone, msg);
  }

  private async handleDigitalDoctor(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const doctors: any[] = data.doctorList || [];
    if (isNaN(idx) || idx < 0 || idx >= doctors.length) { await this.sendText(phone, `Reply with a number 1–${doctors.length}.`); return; }
    const doctor = doctors[idx];
    await this.setState(phone, 'DIGITAL_TYPE', { ...data, bookDoctorId: doctor.id, bookDoctorName: doctor.name, bookFees: doctor.digitalFees });
    await this.sendText(phone, `📱 How would you like to consult?\n\n1️⃣ 📹 Video Call\n2️⃣ 📞 Phone Call`);
  }

  private async handleDigitalType(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'VIDEO_CALL', 'video': 'VIDEO_CALL', '2': 'PHONE_CALL', 'phone': 'PHONE_CALL' };
    const apptType = map[text.toLowerCase()];
    if (!apptType) { await this.sendText(phone, 'Reply *1* for Video Call or *2* for Phone Call.'); return; }
    await this.setState(phone, 'DIGITAL_DATE', { ...data, apptType });
    await this.sendText(phone, `📅 Enter the *appointment date* in DD-MM-YYYY format:\n_Example: 15-06-2026_`);
  }

  private async handleDigitalDate(phone: string, text: string, data: any) {
    const m = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) { await this.sendText(phone, 'Please enter date as *DD-MM-YYYY*. Example: 15-06-2026'); return; }
    const [, dd, mm, yyyy] = m;
    const date = new Date(`${yyyy}-${mm}-${dd}`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(date.getTime()) || date <= today) { await this.sendText(phone, 'Please enter a *future* date.'); return; }
    const slots = await this.getTimeSlots(data.bookDoctorId, `${yyyy}-${mm}-${dd}`);
    if (!slots.length) { await this.sendText(phone, `No slots on ${text}. Try another date (DD-MM-YYYY):`); return; }
    let msg = `⏰ *Available slots on ${text}*:\n\n`;
    slots.forEach((s, i) => { msg += `${i + 1}️⃣ ${s}\n`; });
    await this.setState(phone, 'DIGITAL_TIME', { ...data, bookDate: `${yyyy}-${mm}-${dd}`, timeSlots: slots });
    await this.sendText(phone, msg + `\nReply with the slot number.`);
  }

  private async handleDigitalTime(phone: string, text: string, data: any) {
    const idx = parseInt(text) - 1;
    const slots: string[] = data.timeSlots || [];
    if (isNaN(idx) || idx < 0 || idx >= slots.length) { await this.sendText(phone, `Reply with a number 1–${slots.length}.`); return; }
    const timeSlot = slots[idx];
    const typeLabel = data.apptType === 'VIDEO_CALL' ? '📹 Video Call' : '📞 Phone Call';
    await this.setState(phone, 'DIGITAL_CONFIRM', { ...data, bookTime: timeSlot });
    await this.sendText(
      phone,
      `📋 *Digital Appointment Summary*\n\n` +
      `👨‍⚕️ Dr. ${data.bookDoctorName} — ${typeLabel}\n` +
      `🏥 ${data.purpose.replace(/_/g, ' ')}\n` +
      `📅 ${this.fmtDateDisplay(data.bookDate)} at ${timeSlot}\n` +
      `💰 Fees: ₹${data.bookFees || 300}\n\n` +
      `Reply *1* to Confirm ✅  |  *2* to Cancel ❌`,
    );
  }

  private async handleDigitalConfirm(phone: string, text: string, data: any) {
    if (text === '2' || text.toLowerCase() === 'cancel') { await this.goToMenu(phone); return; }
    if (text !== '1' && text.toLowerCase() !== 'confirm') { await this.sendText(phone, 'Reply *1* to confirm or *2* to cancel.'); return; }
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.setState(phone, 'IDLE', {}); return; }
    const appt = await this.prisma.appointment.create({
      data: { patientId: patient.id, doctorId: data.bookDoctorId, purpose: data.purpose || 'CONSULTATION', type: data.apptType, date: new Date(data.bookDate), timeSlot: data.bookTime, status: 'CONFIRMED', fees: data.bookFees || 300, isFree: data.purpose === 'FOLLOW_UP' },
    });
    const typeLabel = data.apptType === 'VIDEO_CALL' ? '📹 Video Call' : '📞 Phone Call';
    const hint = data.apptType === 'VIDEO_CALL' ? '_Meeting link will be sent 15 min before._' : '_Doctor will call you at the scheduled time._';
    await this.goToMenu(phone);
    await this.sendText(
      phone,
      `✅ *Digital Appointment Confirmed!*\n\n` +
      `🎫 Ref: APT-${appt.id.slice(-6).toUpperCase()}\n` +
      `👨‍⚕️ Dr. ${data.bookDoctorName} — ${typeLabel}\n` +
      `📅 ${this.fmtDateDisplay(data.bookDate)} at ${data.bookTime}\n` +
      `💰 Fees: ₹${data.bookFees || 300}\n\n${hint}\n\nReply *menu* anytime for help.`,
    );
  }

  // ── PRE-CONSULT FORM (WhatsApp inline 7-question flow) ───────────────────
  async startPreconsult(phone: string, tokenId: string, patientId: string, gender: string, purpose: string) {
    await this.setState(phone, 'PRECONSULT_Q1', { tokenId, patientId, gender, purpose, answers: {} });
    await this.sendText(
      phone,
      `📋 *Pre-Consultation Form* (1 of 7)\n\n` +
      `What type of visit is this?\n\n` +
      `1️⃣ First Visit\n2️⃣ Follow-up\n3️⃣ Test / Scan Only`,
    );
  }

  private async handlePreconsultQ1(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'FIRST_VISIT', '2': 'FOLLOW_UP', '3': 'TEST_SCAN_ONLY' };
    const val = map[text];
    if (!val) { await this.sendText(phone, 'Please reply *1*, *2*, or *3*.'); return; }
    const answers = { ...data.answers, visitType: val };
    await this.setState(phone, 'PRECONSULT_Q2', { ...data, answers });
    await this.sendText(phone, `📋 *Pre-Consultation Form* (2 of 7)\n\nMarital status?\n\n1️⃣ Single\n2️⃣ Married`);
  }

  private async handlePreconsultQ2(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'SINGLE', '2': 'MARRIED' };
    const val = map[text];
    if (!val) { await this.sendText(phone, 'Please reply *1* or *2*.'); return; }
    const answers = { ...data.answers, maritalStatus: val };
    if (val === 'MARRIED') {
      await this.setState(phone, 'PRECONSULT_Q3', { ...data, answers });
      await this.sendText(phone, `📋 *Pre-Consultation Form* (3 of 7)\n\n👫 Please enter your *spouse's name*:`);
    } else {
      answers.spouseName = null;
      await this.setState(phone, 'PRECONSULT_Q4', { ...data, answers });
      await this.sendPreconsultQ4(phone, data.gender);
    }
  }

  private async handlePreconsultQ3(phone: string, text: string, data: any) {
    const answers = { ...data.answers, spouseName: text };
    await this.setState(phone, 'PRECONSULT_Q4', { ...data, answers });
    await this.sendPreconsultQ4(phone, data.gender);
  }

  private async sendPreconsultQ4(phone: string, gender: string) {
    if (gender === 'FEMALE') {
      await this.sendText(phone, `📋 *Pre-Consultation Form* (4 of 7)\n\n📅 Last Menstrual Period (LMP) date in DD-MM-YYYY:\n_Reply *skip* if unknown_`);
    } else {
      await this.sendText(phone, `📋 *Pre-Consultation Form* (4 of 7)\n\n💊 Any *allergies*?\n\n1️⃣ No allergies\n2️⃣ Yes — type them after selecting 2`);
    }
  }

  private async handlePreconsultQ4(phone: string, text: string, data: any) {
    const answers = { ...data.answers };
    if (data.gender === 'FEMALE') {
      if (text.toLowerCase() !== 'skip') {
        const m = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (!m) { await this.sendText(phone, 'Please enter as *DD-MM-YYYY* or reply *skip*.'); return; }
        const [, dd, mm, yyyy] = m;
        answers.lmpDate = `${yyyy}-${mm}-${dd}`;
      } else {
        answers.lmpDate = null;
      }
      if (['FERTILITY_CHECK', 'CONSULTATION'].includes(data.purpose)) {
        await this.setState(phone, 'PRECONSULT_Q5', { ...data, answers });
        await this.sendText(
          phone,
          `📋 *Pre-Consultation Form* (5 of 7)\n\n🤰 Pregnancy history:\n\n` +
          `1️⃣ Never pregnant\n2️⃣ 1 child\n3️⃣ 2+ children\n4️⃣ Miscarriage\n5️⃣ IVF/IUI attempted\n6️⃣ Skip`,
        );
      } else {
        answers.pregnancyHistory = null;
        await this.setState(phone, 'PRECONSULT_Q6', { ...data, answers });
        await this.sendPreconsultQ6(phone);
      }
    } else {
      answers.lmpDate = null;
      answers.pregnancyHistory = null;
      answers.allergies = text === '1' || text.toLowerCase().startsWith('no') ? 'None' : text.replace(/^2\s*/, '');
      await this.setState(phone, 'PRECONSULT_Q7', { ...data, answers });
      await this.sendPreconsultQ7(phone);
    }
  }

  private async handlePreconsultQ5(phone: string, text: string, data: any) {
    const map: Record<string, string> = { '1': 'Never pregnant', '2': '1 child', '3': '2+ children', '4': 'Miscarriage', '5': 'IVF/IUI attempted', '6': 'Skipped' };
    const answers = { ...data.answers, pregnancyHistory: map[text] || text };
    await this.setState(phone, 'PRECONSULT_Q6', { ...data, answers });
    await this.sendPreconsultQ6(phone);
  }

  private async sendPreconsultQ6(phone: string) {
    await this.sendText(phone, `📋 *Pre-Consultation Form* (6 of 7)\n\n💊 Any *allergies*?\n\n1️⃣ No allergies\n2️⃣ Yes — type them after selecting 2`);
  }

  private async handlePreconsultQ6(phone: string, text: string, data: any) {
    const allergies = text === '1' || text.toLowerCase().startsWith('no') ? 'None' : text.replace(/^2\s*/, '') || text;
    const answers = { ...data.answers, allergies };
    await this.setState(phone, 'PRECONSULT_Q7', { ...data, answers });
    await this.sendPreconsultQ7(phone);
  }

  private async sendPreconsultQ7(phone: string) {
    await this.sendText(phone, `📋 *Pre-Consultation Form* (7 of 7)\n\n💉 Any *current medications*?\n\n1️⃣ No medications\n2️⃣ Yes — type them after selecting 2`);
  }

  private async handlePreconsultQ7(phone: string, text: string, data: any) {
    const meds = text === '1' || text.toLowerCase().startsWith('no') ? 'None' : text.replace(/^2\s*/, '') || text;
    const answers = { ...data.answers, currentMedications: meds };
    try {
      await this.prisma.preConsultForm.upsert({
        where: { tokenId: data.tokenId },
        create: {
          tokenId: data.tokenId, patientId: data.patientId, status: 'COMPLETED', questionsAnswered: 7, source: 'PATIENT',
          visitType: answers.visitType, maritalStatus: answers.maritalStatus, spouseName: answers.spouseName,
          lmpDate: answers.lmpDate ? new Date(answers.lmpDate) : null, pregnancyHistory: answers.pregnancyHistory,
          allergies: answers.allergies, currentMedications: answers.currentMedications, completedAt: new Date(),
        },
        update: {
          status: 'COMPLETED', questionsAnswered: 7, visitType: answers.visitType, maritalStatus: answers.maritalStatus,
          spouseName: answers.spouseName, lmpDate: answers.lmpDate ? new Date(answers.lmpDate) : null,
          pregnancyHistory: answers.pregnancyHistory, allergies: answers.allergies,
          currentMedications: answers.currentMedications, completedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Error saving pre-consult form', err);
    }
    await this.setState(phone, 'IDLE', {});
    await this.sendText(phone, `✅ *Pre-Consultation Form Complete!*\n\nThank you! The doctor will review your information before your visit.\n\nReply *menu* for more options.`);
  }

  // ── MY RECORDS ───────────────────────────────────────────────────────────
  private async sendRecords(phone: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
      include: {
        prescriptions: { include: { medicines: true }, take: 3, orderBy: { createdAt: 'desc' } },
        labReports: { take: 3, orderBy: { orderedAt: 'desc' } },
        appointments: { take: 3, orderBy: { date: 'desc' }, include: { doctor: true } },
      },
    });
    if (!patient) { await this.setState(phone, 'IDLE', {}); return; }
    let msg = `📁 *Your Records — ${patient.name}*\n\n`;
    if ((patient as any).prescriptions?.length) {
      msg += `💊 *Recent Prescriptions:*\n`;
      (patient as any).prescriptions.forEach((p: any) => {
        msg += `• ${this.fmtDate(p.createdAt)} — ${p.medicines.map((m: any) => m.name).join(', ')}\n`;
      });
      msg += '\n';
    }
    if ((patient as any).labReports?.length) {
      msg += `🧪 *Lab Reports:*\n`;
      (patient as any).labReports.forEach((r: any) => {
        msg += `• ${this.fmtDate(r.orderedAt)} — ${r.testName} (${r.status === 'READY' ? '✅ Ready' : '⏳ Pending'})\n`;
      });
      msg += '\n';
    }
    if ((patient as any).appointments?.length) {
      msg += `📅 *Appointments:*\n`;
      (patient as any).appointments.forEach((a: any) => {
        msg += `• ${this.fmtDate(a.date)} — Dr. ${a.doctor?.name || ''} — ${a.status}\n`;
      });
      msg += '\n';
    }
    if (!(patient as any).prescriptions?.length && !(patient as any).labReports?.length && !(patient as any).appointments?.length) {
      msg += `No records found yet.\n`;
    }
    msg += `\nReply *menu* to go back.`;
    await this.setState(phone, 'MENU', {});
    await this.sendText(phone, msg);
  }

  // ── Q&A (AI) ─────────────────────────────────────────────────────────────
  private async handleQaQuestion(phone: string, text: string, data: any) {
    await this.sendText(phone, '🤔 Finding an answer for you...');
    try {
      const patient = await this.prisma.patient.findUnique({ where: { phone } });
      const resp = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a helpful medical assistant for Sai Ram Fertility & Maternity Centre, Chennai. Answer patient questions clearly and compassionately. For serious concerns, advise seeing a doctor. Keep responses under 200 words. Patient: ${patient?.name || 'Patient'}.`,
            },
            { role: 'user', content: text },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`, 'Content-Type': 'application/json' } },
      );
      const answer = resp.data.choices[0]?.message?.content || "I'm unable to answer that right now.";
      await this.sendText(
        phone,
        `🤖 *AI Assistant:*\n\n${answer}\n\n` +
        `_⚠️ For medical advice, always consult your doctor._\n\nType another question or reply *menu* to go back.`,
      );
    } catch (err) {
      this.logger.error('Groq error', (err as any).message);
      await this.sendText(phone, 'Sorry, I could not get an answer right now. Please contact the clinic directly.\n\nReply *menu* to go back.');
    }
    await this.setState(phone, 'MENU', {});
  }

  // ── FEEDBACK ─────────────────────────────────────────────────────────────
  async sendFeedbackRequest(phone: string, tokenId: string, doctorName: string) {
    await this.setState(phone, 'FEEDBACK_RATING', { tokenId, doctorName });
    await this.sendText(
      phone,
      `🙏 *Thank you for visiting Sai Ram Fertility & Maternity Centre!*\n\n` +
      `How would you rate your experience with *Dr. ${doctorName}* today?\n\n` +
      `⭐ 1 — Very Poor\n⭐⭐ 2 — Poor\n⭐⭐⭐ 3 — Average\n⭐⭐⭐⭐ 4 — Good\n⭐⭐⭐⭐⭐ 5 — Excellent`,
    );
  }

  private async handleFeedbackRating(phone: string, text: string, data: any) {
    const rating = parseInt(text);
    if (isNaN(rating) || rating < 1 || rating > 5) { await this.sendText(phone, 'Please reply with a number *1–5*.'); return; }
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.setState(phone, 'IDLE', {}); return; }
    if (rating <= 3) {
      await this.setState(phone, 'FEEDBACK_COMMENT', { ...data, rating });
      await this.sendText(phone, `We're sorry to hear that. 😔\n\nCould you tell us what we can improve? Your feedback helps us serve you better.`);
    } else {
      await this.prisma.feedback.create({ data: { patientId: patient.id, rating, category: 'GENERAL', comment: '', sharedOnGoogle: false } });
      const settings = await this.prisma.clinicSettings.findFirst();
      let msg = `🎉 *Thank you for your ${rating}⭐ rating!*\n\nWe're glad you had a great experience.`;
      if (settings?.googleReviewLink) msg += `\n\n🌟 Please share on Google Reviews:\n${settings.googleReviewLink}`;
      msg += `\n\nReply *menu* anytime for help.`;
      await this.setState(phone, 'MENU', {});
      await this.sendText(phone, msg);
    }
  }

  private async handleFeedbackComment(phone: string, text: string, data: any) {
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.setState(phone, 'IDLE', {}); return; }
    await this.prisma.feedback.create({ data: { patientId: patient.id, rating: data.rating, category: 'GENERAL', comment: text, sharedOnGoogle: false } });
    await this.setState(phone, 'MENU', {});
    await this.sendText(phone, `Thank you for your feedback! 🙏\n\nWe will use it to improve our service.\n\nReply *menu* for assistance.`);
  }

  // ── CONFIRM / CANCEL from reminder reply ─────────────────────────────────
  private async handleQuickConfirm(phone: string) {
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.sendText(phone, 'No patient record found.'); return; }
    const appt = await this.prisma.appointment.findFirst({
      where: { patientId: patient.id, status: 'CONFIRMED', date: { gte: new Date() } },
      include: { doctor: true },
      orderBy: { date: 'asc' },
    });
    if (!appt) { await this.sendText(phone, 'No upcoming appointment found.\n\nReply *menu* for options.'); return; }
    await this.sendText(phone, `✅ Your appointment with *Dr. ${(appt as any).doctor?.name}* on *${this.fmtDate(appt.date)}* at *${appt.timeSlot}* is confirmed!\n\nReply *menu* for more options.`);
  }

  private async handleQuickCancel(phone: string) {
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) { await this.sendText(phone, 'No patient record found.'); return; }
    const appt = await this.prisma.appointment.findFirst({
      where: { patientId: patient.id, status: 'CONFIRMED', date: { gte: new Date() } },
      include: { doctor: true },
      orderBy: { date: 'asc' },
    });
    if (!appt) { await this.sendText(phone, 'No upcoming appointment found to cancel.'); return; }
    await this.prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    await this.sendText(phone, `❌ Your appointment with *Dr. ${(appt as any).doctor?.name}* on *${this.fmtDate(appt.date)}* has been cancelled.\n\nReply *1* to book a new appointment or *menu* for options.`);
  }

  // ── APPOINTMENT REMINDERS (Cron — every 5 min) ───────────────────────────
  @Cron('*/5 * * * *')
  async sendAppointmentReminders() {
    try {
      const now = new Date();

      // 24-hour reminder
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowAppts = await this.prisma.appointment.findMany({
        where: { status: 'CONFIRMED', date: { gte: tomorrow, lte: tomorrowEnd } },
        include: { patient: true, doctor: true },
      });

      for (const appt of tomorrowAppts) {
        const already = await this.prisma.reminder.findFirst({
          where: { patientId: appt.patientId, type: 'APPOINTMENT', status: 'SENT', metadata: { contains: appt.id } },
        });
        const phone = (appt as any).patient?.phone;
        if (already || !phone) continue;
        const locMsg = appt.type === 'IN_PERSON' ? 'Sai Ram Fertility & Maternity Centre, T-Nagar, Chennai' : appt.type === 'VIDEO_CALL' ? 'Video Call (link will be sent 15 min before)' : 'Phone Call (doctor will call you)';
        const msg =
          `📅 *Appointment Reminder*\n\n` +
          `You have an appointment *tomorrow* with *Dr. ${(appt as any).doctor?.name}*\n` +
          `⏰ Time: ${appt.timeSlot}\n📍 ${locMsg}\n\n` +
          `Reply *CONFIRM* to confirm or *CANCEL* to cancel.`;
        await this.sendText(phone, msg);
        await this.prisma.reminder.create({
          data: { patientId: appt.patientId, type: 'APPOINTMENT', status: 'SENT', message: msg, scheduledAt: appt.date, sentAt: new Date(), metadata: JSON.stringify({ appointmentId: appt.id, type: '24h' }) },
        });
      }

      // 1-hour reminder
      const in60 = new Date(now.getTime() + 60 * 60 * 1000);
      const in65 = new Date(now.getTime() + 65 * 60 * 1000);
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

      const todayAppts = await this.prisma.appointment.findMany({
        where: { status: 'CONFIRMED', date: { gte: todayStart, lte: todayEnd } },
        include: { patient: true, doctor: true },
      });

      for (const appt of todayAppts) {
        const [hh, mm] = appt.timeSlot.split(':').map(Number);
        const apptTime = new Date(appt.date);
        apptTime.setHours(hh, mm, 0, 0);
        if (apptTime < in60 || apptTime > in65) continue;
        const already = await this.prisma.reminder.findFirst({
          where: { patientId: appt.patientId, type: 'APPOINTMENT', status: 'SENT', metadata: { contains: '"type":"1h"' } },
        });
        const phone = (appt as any).patient?.phone;
        if (already || !phone) continue;
        const msg =
          `⏰ *Appointment in 1 Hour!*\n\n` +
          `👨‍⚕️ Dr. ${(appt as any).doctor?.name}\n🕐 Time: ${appt.timeSlot}\n` +
          `📍 ${appt.type === 'IN_PERSON' ? 'Sai Ram Fertility & Maternity Centre, T-Nagar' : 'Be ready for your digital appointment'}\n\n` +
          `_Please be on time._`;
        await this.sendText(phone, msg);
        await this.prisma.reminder.create({
          data: { patientId: appt.patientId, type: 'APPOINTMENT', status: 'SENT', message: msg, scheduledAt: apptTime, sentAt: new Date(), metadata: JSON.stringify({ appointmentId: appt.id, type: '1h' }) },
        });
      }
    } catch (err) {
      this.logger.error('Reminder cron error', err);
    }
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────
  private async createPatientAndIssueToken(phone: string, data: any) {
    let patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (!patient) {
      patient = await this.prisma.patient.create({
        data: { name: data.name, phone, dob: new Date(data.dob), gender: data.gender, language: data.language || 'ENGLISH', registrationSource: 'WHATSAPP' },
      });
    }
    await this.issueToken(phone, patient.id, data.doctorId, data.doctorName, data.purpose, data.doctorFees || 0);
  }

  private async ensurePatientExists(phone: string, data: any) {
    const existing = await this.prisma.patient.findUnique({ where: { phone } });
    if (!existing) {
      await this.prisma.patient.create({
        data: { name: data.name, phone, dob: new Date(data.dob), gender: data.gender, language: data.language || 'ENGLISH', registrationSource: 'WHATSAPP' },
      });
    }
  }

  private async issueToken(phone: string, patientId: string, doctorId: string, doctorName: string, purpose: string, fees: number) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    const deptCode = doctor?.deptCode || 'GEN';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const last = await this.prisma.token.findFirst({ where: { deptCode, date: { gte: today, lt: tomorrow } }, orderBy: { dailyNumber: 'desc' } });
    const dailyNumber = (last?.dailyNumber || 0) + 1;
    const tokenNumber = `${deptCode}-${String(dailyNumber).padStart(3, '0')}`;
    const waitingCount = await this.prisma.token.count({ where: { doctorId, status: 'WAITING', date: { gte: today, lt: tomorrow } } });
    const token = await this.prisma.token.create({
      data: { tokenNumber, deptCode, dailyNumber, patientId, doctorId, purpose, status: 'WAITING', priority: 0, queuePosition: waitingCount + 1, estimatedWait: waitingCount * 15, date: new Date() },
    });
    const webUrl = this.config.get('NEXT_PUBLIC_WEB_URL') || 'http://localhost:3000';
    await this.setState(phone, 'IDLE', {});
    await this.sendText(
      phone,
      `✅ *Token Generated!*\n\n` +
      `🎫 Token: *${tokenNumber}*\n👨‍⚕️ Doctor: Dr. ${doctorName}\n` +
      `👥 Patients ahead: ${waitingCount}\n⏰ Est. wait: ~${waitingCount * 15} min\n\n` +
      `📋 Fill pre-consultation form:\n${webUrl}/preconsult?token=${tokenNumber}\n\n` +
      `_You will receive queue updates automatically._`,
    );
    // Start pre-consult form via WhatsApp after a short delay
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    setTimeout(() => {
      this.startPreconsult(phone, token.id, patientId, patient?.gender || 'MALE', purpose).catch(() => {});
    }, 5000);
  }

  private async goToMenu(phone: string) {
    await this.setState(phone, 'MENU', {});
    const patient = await this.prisma.patient.findUnique({ where: { phone } });
    if (patient) await this.sendExistingMenu(phone, patient.name);
  }

  private async getTimeSlots(doctorId: string, dateStr: string): Promise<string[]> {
    const d = new Date(dateStr);
    const schedule = await this.prisma.scheduleSlot.findFirst({ where: { doctorId, dayOfWeek: d.getDay(), isActive: true } });
    let start = 9 * 60, end = 13 * 60;
    if (schedule) {
      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      start = sh * 60 + sm; end = eh * 60 + em;
    }
    const slots: string[] = [];
    for (let t = start; t < end; t += 15) {
      slots.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
    }
    const booked = await this.prisma.appointment.findMany({
      where: { doctorId, date: new Date(dateStr), status: { in: ['CONFIRMED', 'UNCONFIRMED'] } },
      select: { timeSlot: true },
    });
    const bookedSet = new Set(booked.map(b => b.timeSlot));
    return slots.filter(s => !bookedSet.has(s));
  }

  private getDeptCode(purpose: string, gender: string): string {
    if (purpose === 'SCAN_TEST') return 'SCN';
    if (purpose === 'FERTILITY_CHECK') return 'FER';
    if (purpose === 'CONSULTATION' && gender === 'FEMALE') return 'GYN';
    return 'GEN';
  }

  private async getOrCreateConv(phone: string) {
    return this.prisma.conversationState.upsert({
      where: { phone },
      update: {},
      create: { phone, state: 'IDLE', data: '{}' },
    });
  }

  private async setState(phone: string, state: string, data: any) {
    await this.prisma.conversationState.upsert({
      where: { phone },
      update: { state, data: JSON.stringify(data) },
      create: { phone, state, data: JSON.stringify(data) },
    });
  }

  private fmtDob(dob: string) {
    if (!dob) return '';
    const [yyyy, mm, dd] = dob.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  private fmtDate(date: Date | string) {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private fmtDateDisplay(dateStr: string) {
    if (!dateStr) return '';
    const [yyyy, mm, dd] = dateStr.split('-');
    return new Date(`${yyyy}-${mm}-${dd}`).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ── SEND ─────────────────────────────────────────────────────────────────
  async sendText(phone: string, message: string) {
    const token = this.config.get('WHATSAPP_ACCESS_TOKEN');
    const phoneId = this.config.get('WHATSAPP_PHONE_ID');
    if (!token || !phoneId) {
      this.logger.warn(`[WA MOCK] → ${phone}: ${message.substring(0, 100)}...`);
      return;
    }
    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: message, preview_url: false } },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error(`WA send failed to ${phone}`, (err as any).message);
    }
  }

  // Keep legacy method name for controller compatibility
  async sendMessage(phone: string, message: string, templateName?: string) {
    return this.sendText(phone, message);
  }

  async resetConversation(phone: string) {
    await this.prisma.conversationState.deleteMany({ where: { phone } });
    await this.prisma.patient.deleteMany({ where: { phone } });
  }

  async sendTokenUpdate(phone: string, tokenNumber: string, position: number) {
    await this.sendText(phone, `🔄 *Queue Update*\n\nToken: *${tokenNumber}*\nPatients ahead: ${position}\nEst. wait: ~${position * 15} min\n\nReply *menu* for options.`);
  }

  async sendAppointmentReminder(phone: string, doctorName: string, date: string, time: string) {
    await this.sendText(phone, `📅 *Appointment Reminder*\n\nDr. ${doctorName}\n📅 ${date} at ${time}\n\nReply *CONFIRM* or *CANCEL*.`);
  }
}
