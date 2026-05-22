import emailjs from "@emailjs/browser";
import { companyConfig } from "@/config/company.config";

interface SendMailParams {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const sendMail = (data: SendMailParams) => {
    
    emailjs.send(
        "service_xeisr8b",
        "template_vi40ajb",
        {
            from_name: data.name,
            from_email: data.email,
            to_email: companyConfig.email.contact,
            subject: data.subject,
            message: data.message,
            time: new Date().toLocaleString("vi-VN"),
            year: new Date().getFullYear(),
        },
        "rJsz7qQIEqosVcSYU"
    );
};