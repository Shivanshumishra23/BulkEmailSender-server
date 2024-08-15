const htmlTemplate = (firstName, lastName, position, email, phoneNumber) => `
<div>
<p>Thanks, and regards,</p>
<p>${firstName + " " + lastName}</p>
<table role="presentation" style="width:100%;border-collapse:collapse;border-spacing:0;text-align:left;font-family: Arial, sans-serif;color:rgb(54,55,56)">
   <tr>
      <td style="padding:0;width:100px">
         
            <img src="https://nodemailer.com/nm_logo_200x136.png" alt="SEF" style="max-width:85px;max-height:85px;" height="85" width="85">
       
      </td>
      <td style="padding:0;font-size:14px">
         <div style="font-weight:bold;display:inline">
            <span style="background-color:rgb(54,55,56);padding:2px 5px;color:rgb(255,255,255);">
               <span style="color:rgb(244,40,76)">${firstName}</span> ${lastName}
            </span>
         </div>
         <div style="padding:0;font-size:12px;font-weight:bold;margin:4px 0 10px 0">
            ${position} <span style="color:rgb(165,166,169)"> - [company name]</span>
         </div>
         <div style="font-family:Courier New,Courier,monospace;font-size:11px;line-height:15px;color:rgb(165,166,169)">
            <div>// <a href="mailto:${email}" style="text-decoration-line:none;text-decoration:none;color:rgb(165,166,169)" target="_blank">${email}</a></div>
            <div>// <a href="tel:${phoneNumber}" style="text-decoration-line:none;text-decoration:none;color:rgb(165,166,169)" target="_blank">${phoneNumber}</a></div>
         </div>
      </td>
   </tr>
</table>

    <p>If you need any assistance or have questions, feel free to reply to this email.</p>
</div>
`;

const newSignature = () => `

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
    }

    .email-signature {
      max-width: 600px;
      margin: 20px auto;
      padding: 15px;
      font-size: 14px;
      color: #333;
      border: 2px solid #007BFF;
      border-radius: 10px;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .name {
      font-size: 18px;
      font-weight: bold;
      color: #007BFF;
      margin-bottom: 5px;
    }

    .title {
      color: #555;
      margin-bottom: 5px;
    }

    .contact-info {
      margin-bottom: -5px;
    }

    .contact-info p {
      margin: 5px 0;
    }

    .contact-info a {
      text-decoration: none;
      color: #007BFF;
    }

    .address {
      margin-top: 10px;
    }

    .address p {
      margin: 5px 0;
    }

    .image-container {
      margin-top: 10px;
    }

    .image-container img {
      max-width: 100px;
      border-radius: 50%;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>

  <div class="email-signature">
    <div class="image-container">
      <img src="https://nodemailer.com/nm_logo_200x136.png" alt="Your Image" width="100px" height="100px">
    </div>

    <p class="name">Harmeet Kaur Sahdev</p>
    <p class="title">ShivanshuMishra Techonologies</p>

    <div class="contact-info">
      <p>Mobile: +919038943020</p>
      <p>Web: <a href="https://shivanshumishra-portfolio.netlify.app/" target="_blank">www.shivsbghfh.com</a></p>
      <p>Email: <a href="mailto:mishrashivanshu2004@gmail.com">mishrashivanshu2004@gmail.com</a></p>
    </div>

    <div class="address">
      <p>College More, Sector V Salt Lake, Kolkata</p>
    </div>
  </div>

</body>
</html>




`;

module.exports = htmlTemplate;
module.exports = newSignature;
