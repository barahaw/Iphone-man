export const emailService = {
  async sendOrderConfirmation(order: { id: number; customer_email: string; total: string | number }): Promise<void> {
    console.info("Order confirmation email queued", {
      orderId: order.id,
      email: order.customer_email,
      total: order.total
    });
  },

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    console.info("Password reset email queued", {
      email,
      resetToken
    });
  }
};

