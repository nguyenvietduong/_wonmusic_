import emailjs from "@emailjs/browser";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { companyConfig } from "@/config/company.config";

interface SendMailParams {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const sendMail = async (data: SendMailParams) => {
    const store = useSettingsStore.getState();
    if (!store.loaded && !store.loading) {
        try { await store.fetch(); }
        catch { throw new Error("Không thể tải cấu hình email. Vui lòng thử lại."); }
    }
    if (useSettingsStore.getState().loading) {
        await new Promise<void>((resolve) => {
            let done = false;
            let timeoutId: ReturnType<typeof setTimeout>;
            const unsubscribe = useSettingsStore.subscribe((s) => {
                if (!s.loading && !done) {
                    done = true;
                    clearTimeout(timeoutId);
                    unsubscribe();
                    resolve();
                }
            });
            timeoutId = setTimeout(() => {
                if (!done) { done = true; unsubscribe(); resolve(); }
            }, 5000);
        });
    }

    const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, emailjsToEmail, contactEmail } =
        useSettingsStore.getState();

    if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
        throw new Error("EmailJS chưa được cấu hình trong Admin → Cài đặt → Email.");
    }

    return emailjs.send(
        emailjsServiceId,
        emailjsTemplateId,
        {
            from_name:  data.name,
            from_email: data.email,
            to_email:   emailjsToEmail || contactEmail || companyConfig.email.contact,
            subject:    data.subject,
            message:    data.message,
            time:       new Date().toLocaleString("vi-VN"),
            year:       new Date().getFullYear(),
        },
        emailjsPublicKey
    );
};
