import emailjs from "@emailjs/browser";

type WelcomeEmailPayload = {
  email: string;
  name: string;
  password: string;
};

function getEmailJsConfig() {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS is not configured.");
  }

  return { publicKey, serviceId, templateId };
}

export async function sendWelcomeEmail({
  email,
  name,
  password,
}: WelcomeEmailPayload) {
  try {
    const { publicKey, serviceId, templateId } = getEmailJsConfig();
    console.info("Sending EmailJS welcome email:", { email, templateId });
    console.log("emailjs.send executing", {
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
      hasPublicKey: Boolean(publicKey),
      serviceId,
      templateId,
    });

    const result = await emailjs.send(
      serviceId,
      templateId,
      {
        email,
        password,
        to_name: name,
      },
      {
        publicKey,
      },
    );

    console.info("EmailJS welcome email sent:", result.status, result.text);
    return result;
  } catch (error) {
    console.error("EmailJS welcome email failed:", error);
    throw error;
  }
}

export const sendYouthWelcomeEmail = sendWelcomeEmail;
