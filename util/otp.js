const OTP = (len = 6) => {
  const string = "0123456789";

  let randDigit = "";
  for (let i = 0; i < len; i++) {
    randDigit += string.charAt(Math.floor(Math.random() * string.length));
  }

  return randDigit;
};

module.exports = OTP;
