const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const generateReference = require('../utils/generateReference');
const allocationService = require('./allocation.service');

/**
 * PAYMENT GATEWAY NOTE
 * ---------------------------------------------------------------------------
 * This service simulates an online payment gateway (e.g. Paystack/Flutterwave)
 * so the system is fully runnable without third-party merchant credentials.
 *
 * To go live with a real gateway:
 *   1. Replace `initiate()` with a call to the provider's "initialize transaction" API.
 *   2. Replace `verify()` with a call to the provider's "verify transaction" API,
 *      using the reference returned at initiation.
 *   3. Keep everything else (the Prisma transaction + allocation trigger) unchanged.
 * The rest of the application (routes, controllers, frontend) does not need to
 * change since they only depend on this service's function signatures.
 */

async function initiate(studentId, applicationId, amount) {
  const application = await prisma.application.findFirst({
    where: { id: applicationId, studentId },
  });
  if (!application) {
    throw new AppError('Application not found for this student.', 404);
  }
  if (!['PENDING', 'PAYMENT_PENDING'].includes(application.status)) {
    throw new AppError('Payment is not required for this application at its current stage.', 400);
  }

  const reference = generateReference();

  const payment = await prisma.payment.create({
    data: {
      studentId,
      applicationId,
      sessionId: application.sessionId,
      amount,
      reference,
      method: 'CARD',
      status: 'PENDING',
    },
  });

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: 'PAYMENT_PENDING' },
  });

  // In a real integration this would be the checkout authorization_url
  // returned by the payment provider.
  const checkoutUrl = `/student/payments/checkout/${reference}`;

  return { payment, reference, checkoutUrl };
}

/**
 * Simulates the gateway callback / verification step. In production this
 * would call the provider's verify endpoint using `reference`. Here it
 * marks the (mock) transaction as successful, then automatically triggers
 * the room allocation algorithm.
 */
async function verify(reference) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) throw new AppError('Payment reference not found.', 404);

  if (payment.status === 'SUCCESS') {
    return { payment, alreadyProcessed: true };
  }

  const updatedPayment = await prisma.payment.update({
    where: { reference },
    data: { status: 'SUCCESS', paidAt: new Date() },
  });

  if (updatedPayment.applicationId) {
    await prisma.application.update({
      where: { id: updatedPayment.applicationId },
      data: { status: 'APPROVED' },
    });

    await prisma.notification.create({
      data: {
        userId: updatedPayment.studentId,
        title: 'Payment Successful',
        message: `Your payment of ₦${updatedPayment.amount} was confirmed. Your application is now approved and pending room allocation.`,
      },
    });

    // Attempt automatic allocation immediately after successful payment.
    try {
      await allocationService.autoAllocate(updatedPayment.applicationId);
    } catch (err) {
      // If no bed is available right now, leave the application APPROVED;
      // an admin can trigger allocation later once space frees up.
    }
  }

  return { payment: updatedPayment, alreadyProcessed: false };
}

module.exports = { initiate, verify };
