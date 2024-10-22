import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
      }
    })
  }

  async sendMail({name, phone, email, message}: EmailDto) {
    const mailOptions = {
      from: email,
      to: process.env.USER_EMAIL,
      subject: 'Nuevo mensaje desde la pagina Cruz Patagonia',
      text: `
        Nombre: ${name},
        Telefono: ${phone},
        Email: ${email},
        Mensaje: ${message}
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return mailOptions;
    } catch (error) {
      console.log(error)
    }
  }
}
