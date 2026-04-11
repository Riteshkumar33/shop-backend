const cron = require('node-cron');
const Deadline = require('../models/Deadline');
const Form = require('../models/Form');
const AuditLog = require('../models/AuditLog');

const checkDeadlines = async () => {
  try {
    const now = new Date();
    const overdueDeadlines = await Deadline.find({
      dueDate: { $lte: now },
      completed: false,
    }).populate('formId');

    for (const deadline of overdueDeadlines) {
      if (deadline.formId && deadline.formId.status !== 'complete') {
        await Form.findByIdAndUpdate(deadline.formId._id, {
          status: 'overdue',
        });

        await AuditLog.create({
          action: 'deadline_overdue',
          details: {
            formId: deadline.formId._id,
            deadlineId: deadline._id,
            dueDate: deadline.dueDate,
          },
          timestamp: now,
        });

        console.log(`[DEADLINE] Form ${deadline.formId._id} marked overdue`);
      }
    }
  } catch (err) {
    console.error('[DEADLINE] Error checking deadlines:', err.message);
  }
};

const startDeadlineCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    console.log('[DEADLINE] Running deadline check...');
    checkDeadlines();
  });
  console.log('[DEADLINE] Cron job scheduled (every hour)');
};

module.exports = { startDeadlineCron, checkDeadlines };
