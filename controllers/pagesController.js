const mailgun = require('mailgun-js')({
  apiKey: require('../config/mailgun').apiKey,
  domain: require('../config/mailgun').domain
});
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});

exports.getWhoWeAre = async (req, res) => {
    try {
      res.render('pages/who_we_are.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };

  exports.getMoreservice = async (req, res) => {
    try {
      res.render('pages/moreservice.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };

  exports.getCancelRefundPolicy = async (req, res) => {
    try {
      res.render('pages/Cancel_Refund_Policy.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };

  exports.getserviceguarantee = async (req, res) => {
    try {
      res.render('pages/service_guarantee.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getaffiliateContact = async (req, res) => {
    try {
      res.render('pages/Affiliate_Contact.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };

exports.getPrivacyPolicy = async (req, res) => {
    try {
      res.render('pages/privacy_policy.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  
exports.getCookiePolicy = async (req, res) => {
    try {
      res.render('pages/cookie_policy.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  }
  
exports.getLegalNotes = async (req, res) => {
    try {
      res.render('pages/legal_notes.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  }

  exports.getcustomerservice = async (req, res) => {
    try {
      res.render('pages/customerservice.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getserviceinfo = async (req, res) => {
    try {
      res.render('pages/serviceinfo.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getcareers = async (req, res) => {
    try {
      res.render('pages/careers.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  exports.getpersonal = async (req, res) => {
    try {
      res.render('pages/personal.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  
  
exports.getContactUs = async (req, res) => {
    try {
      res.render('pages/contact_us.ejs');
    } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };

exports.sendContactEmail = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if(message.trim() === '') {
      req.flash('error', 'Message content cannot be empty');
      return res.redirect('/pages/contact-us');
    }

    const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1E4DEF; text-align: center;">New Contact Form Submission</h2>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
        <p><strong>From:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: white; padding: 15px; border-radius: 5px;">${message}</p>
      </div>
    </div>
    `;

    // const data = {
    //   from: email,
    //   to: 'contact@trip-day.com',
    //   subject: 'New Contact Form Submission',
    //   html: emailContent
    // };

    // 자동 응답 이메일 설정
    const autoReplyData = {
      from: email,
      to: 'divextcorp@gmail.com',
      subject: 'New Contact Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E4DEF; text-align: center;">CONTACT US Submission from TRIP-DAY</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <p><strong>From:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            
            <p>MESSAGE DETAILS:</p>
            <ul>
              <li>${message}</li>
          
            </ul>
          </div>
        </div>
      `
    };

    // 사용자에게 자동 응답 이메일 전송
    await new Promise((resolve, reject) => {
      mailgun.messages().send(autoReplyData, (error, body) => {
        if (error) {
          console.error('Error sending auto-reply:', error);
          reject(error);
        } else {
          console.log('Auto-reply sent successfully:', body);
          resolve(body);
        }
      });
    });
    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${firstName} ${lastName} 님으로 부터 Contact-us 메시지가 도착했습니다.\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`);
    // 성공 메시지와 함께 연락처 페이지로 리다이렉트
    req.flash('success', 'Your message has been sent successfully. We will contact you soon.');
    res.redirect('/pages/contact-us');

  } catch (error) {
    console.error('Error in sendContactEmail:', error);
    req.flash('error', 'There was an error sending your message. Please try again later.');
    res.redirect('/pages/contact-us');
  }
};
