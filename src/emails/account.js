const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'jesquivelnavas@gmail.com',
    subject: 'Thanks for joining in',
    text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
  })
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'jesquivelnavas@gmail.com',
    subject: 'Sorry to see you go!',
    text: `We fell sorry that your are leaving us ${name} Was there something we could do to make you stay?.`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
}
