import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  /**
   * Mocks a payment transaction to a 3rd party gateway
   * @param amount The amount to charge
   * @param idempotencyKey Key to prevent double charging
   * @param shouldTimeout For testing: force timeout
   */
  async processPayment(
    amount: number,
    idempotencyKey: string,
    forceTimeout = false,
  ): Promise<{ success: boolean; transactionId: string; status: string }> {
    this.logger.log(
      `Processing payment for ${amount} with key ${idempotencyKey}`,
    );

    // forceTimeout (per-request) takes priority; fall back to global env var
    const shouldTimeout =
      forceTimeout || process.env.SIMULATE_PAYMENT_TIMEOUT === 'true';

    return new Promise((resolve, reject) => {
      if (shouldTimeout) {
        // Simulate a timeout that takes a long time
        setTimeout(() => {
          reject(new Error('Payment gateway timeout'));
        }, 8000);
        return;
      }

      // Simulate normal processing time
      setTimeout(() => {
        // In a real system, we'd check if idempotencyKey already exists
        // Here we just mock success
        resolve({
          success: true,
          transactionId: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'COMPLETED',
        });
      }, 1000);
    });
  }
}
