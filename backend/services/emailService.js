import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your SMTP provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
};