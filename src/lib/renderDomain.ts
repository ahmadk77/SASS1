export function isValidDomainFormat(domain: string): boolean {
  if (!domain) return false;
  // Regex matching standard domain names (e.g. example.com, sub.domain.co.uk, my-store.sa)
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

export async function registerRenderCustomDomain(domainName: string): Promise<{ success: boolean; message: string; details?: any }> {
  const serviceId = process.env.RENDER_SERVICE_ID || 'srv-d9ehf3l7vvec7396pbtg';
  const apiKey = process.env.RENDER_API_KEY || 'rnd_uGa4UfKtX2s4YoVIcAhd4go1XjSC';

  if (!serviceId || !apiKey) {
    console.warn('Render API Key or Service ID is missing');
    return { success: false, message: 'مفاتيح RENDER_API_KEY أو RENDER_SERVICE_ID غير مضافة في الإعدادات.' };
  }

  // Clean domain name from http://, https://, www., and trailing slashes
  const cleanDomain = domainName
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
    .split('/')[0]
    .trim()
    .toLowerCase();

  // 1. Validate domain syntax
  if (!cleanDomain || !isValidDomainFormat(cleanDomain)) {
    return {
      success: false,
      message: 'صيغة الدومين غير صحيحة. يرجى إدخال اسم دومين صالح (مثال: example.com أو myclinic.sa) بدون رموز خاصة.'
    };
  }

  try {
    const response = await fetch(`https://api.render.com/v1/services/${serviceId}/custom-domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: cleanDomain })
    });

    const resData: any = await response.json();

    if (!response.ok) {
      console.warn('Render API domain response:', response.status, resData);
      
      const errMsg = resData?.message || resData?.error || '';

      if (response.status === 409 || errMsg.includes('already') || errMsg.includes('taken')) {
        return { success: true, message: 'الدومين مضاف مسبقاً في الخادم وربطه نشط.', details: resData };
      }

      if (response.status === 400 || errMsg.includes('invalid') || errMsg.includes('format')) {
        return { success: false, message: 'اسم الدومين غير صحيح أو غير مدعوم من الخادم.', details: resData };
      }

      if (response.status === 404 || errMsg.includes('service not found')) {
        return { success: false, message: 'معرّف الخدمة (Render Service ID) غير صحيح أو لم يتم العثور على السيرفر المطلوب.', details: resData };
      }

      return { success: false, message: resData?.message || 'تعذر ربط الدومين في خوادم Render.', details: resData };
    }

    console.log('Successfully registered custom domain on Render:', cleanDomain, resData);
    return { success: true, message: 'تم ربط الدومين بنجاح في خوادم Render وسيتم إصدار شهادة الأمان (SSL) تلقائياً!', details: resData };
  } catch (error: any) {
    console.error('Error connecting to Render API:', error);
    return { success: false, message: error.message || 'خطأ أثناء الاتصال بخوادم Render' };
  }
}
