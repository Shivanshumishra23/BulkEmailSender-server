export const htmlTemplate = (
  firstName,
  lastName,
  position,
  email,
  phoneNumber
) => `
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
