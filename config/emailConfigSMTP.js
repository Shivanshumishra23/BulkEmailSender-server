// password
const hrPassword = process.env.hrPassword;
const ceoPassword = process.env.ceoPassword;
const marketingPassword = process.env.marketingPassword;

const hrEmail = process.env.hrEmail;
const ceoEmail = process.env.ceoEmail;
const marketingEmail = process.env.marketingEmail;

// Map:  Email->password
const office365SMTPPasswordList = new Map();

office365SMTPPasswordList.set(hrEmail, hrPassword);
office365SMTPPasswordList.set(ceoEmail, ceoPassword);
office365SMTPPasswordList.set(marketingEmail, marketingPassword);

module.exports = office365SMTPPasswordList;
