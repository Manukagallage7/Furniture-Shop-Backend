import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export async function sendReplyEmail(customerEmail, customerName, subject, replyText) {
    const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Re: ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #92400e 0%, #b45309 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">We've Replied to Your Inquiry</h2>
                </div>
                <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
                    <p style="color: #374151;">Hello <strong>${customerName}</strong>,</p>
                    <p style="color: #374151;">Thank you for contacting us. We have reviewed your inquiry regarding <strong>"${subject}"</strong> and would like to share our response:</p>

                    <div style="background-color: white; padding: 15px; border-left: 4px solid #b45309; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #374151; margin: 0; white-space: pre-wrap;">${replyText}</p>
                    </div>

                    <p style="color: #374151;">If you have any further questions, please feel free to reply to this email or contact us through our website.</p>

                    <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
                        Best regards,<br/>
                        <strong>${process.env.EMAIL_FROM_NAME} Team</strong>
                    </p>
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280;">
                    <p style="margin: 5px 0;">This is an automated response. Please do not reply directly to this email.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reply email sent successfully to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error("Error sending reply email:", error);
        return false;
    }
}
