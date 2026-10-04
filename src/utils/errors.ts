// هذا الكلاس مخصص فقط للأخطاء التي نريد أن يقرأها العميل
export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}
