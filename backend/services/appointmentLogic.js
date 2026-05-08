const Appointment = require('../models/Appointment');

const normalizeDateRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const parseTime = (value) => {
  const [h, m] = value.split(':').map((v) => parseInt(v, 10));
  return { h, m };
};

const formatTime = (h, m) => {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
};

const generateTimeSlots = (availableSlots, date) => {
  const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const slot = availableSlots.find((s) => s.day === day);
  if (!slot || !slot.startTime || !slot.endTime) return [];

  const { h: startH, m: startM } = parseTime(slot.startTime);
  const { h: endH, m: endM } = parseTime(slot.endTime);

  const slots = [];
  let currentH = startH;
  let currentM = startM;

  while (currentH < endH || (currentH === endH && currentM < endM)) {
    slots.push(formatTime(currentH, currentM));
    currentM += 30;
    if (currentM >= 60) {
      currentH += 1;
      currentM -= 60;
    }
  }

  return slots;
};

const checkSlotAvailability = async (doctorId, date, timeSlot) => {
  const { start, end } = normalizeDateRange(date);
  const existing = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: start, $lte: end },
    timeSlot,
    status: { $ne: 'cancelled' },
  });
  return !existing;
};

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { total, page, totalPages, limit };
};

module.exports = {
  checkSlotAvailability,
  generateTimeSlots,
  getPaginationMeta,
};
