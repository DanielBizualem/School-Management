import nodemailer from 'nodemailer';

export const sendTemporaryPasswordEmail = async (email, tempPassword) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASS // Use the APP PASSWORD, not your real login password
        }
    });

    const mailOptions = {
        from: '"School Management" <danielbizualem4@gmail.com>',
        to: email,
        subject: 'Your Temporary Student Password',
        text: `Welcome! Your temporary password is: ${tempPassword}. Please change it upon first login.`
    };

    await transporter.sendMail(mailOptions);
};