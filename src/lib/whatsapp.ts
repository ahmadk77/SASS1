export const handleWhatsAppAction = (phoneNumber: string, message: string, orderData?: any) => {
  // Dispatch custom event to be handled by SiteRenderer or TemplateRenderer
  window.dispatchEvent(new CustomEvent('OPEN_ORDER_MODAL', {
    detail: { phoneNumber, message, orderData }
  }));
};
