const validName = ["Name", "fullName"].map((str) => str.toLowerCase());
const validEmail = ["email"].map((str) => str.toLowerCase());
const validFirstName = ["First Name", "firstName"].map((str) =>
  str.toLowerCase()
);
const validLastName = ["Last Name", "lastName"].map((str) => str.toLowerCase());
const validContact = [
  "Contact",
  "mobile No",
  "mobileNo",
  "mobile",
  "phone",
  "phone No",
  "phoneNo",
].map((str) => str.toLowerCase());
const validMessage = ["message", "text", "content", "description"].map((str) =>
  str.toLowerCase()
);

module.exports.validateField = (mail) => {
  const emailArray = [
    {
      email: "",
      name: "",
      firstName: "",
      lastName: "",
      contact: "",
      message: "",
    },
  ];

  const obj = Object.entries(mail);
  obj.forEach(([key, value]) => {
    const keyToLower = key.toLowerCase();
    const validateEmail = validEmail?.includes(keyToLower);
    const validateName = validName?.includes(keyToLower);
    const validateFirst = validFirstName?.includes(keyToLower);
    const validateLast = validLastName?.includes(keyToLower);
    const validateContact = validContact?.includes(keyToLower);
    const validateMessage = validMessage?.includes(keyToLower);

    if (validateName) {
      emailArray.push({ ...emailArray[0], name: mail[key] });
    }

    if (validateFirst) {
      emailArray.push({ ...emailArray[0], firstName: mail[key] });
    }
    if (validateLast) {
      emailArray.push({ ...emailArray[0], lastName: mail[key] });
    }

    if (validateEmail) {
      emailArray.push({ ...emailArray[0], email: mail[key] });
    }

    if (validateContact) {
      emailArray.push({ ...emailArray[0], contact: mail[key] });
    }

    if (validateMessage) {
      emailArray.push({ ...emailArray[0], message: mail[key] });
    }
  });

  return emailArray;
};
