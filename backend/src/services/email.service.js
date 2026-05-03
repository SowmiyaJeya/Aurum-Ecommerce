const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendAdminOrderMail = async ({
  order_id,
  username,
  phone,
  total_amount,
  admin_email,
  itemsHtml
}) => {
  try {
    await transporter.sendMail({
      from: `"Aurum Order Details" <${process.env.SMTP_USER}>`,
      to: admin_email,
      subject: `🧾 New Order Invoice - #${order_id}`,
      html: `
        <div style="font-family: Arial; max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 20px;">
          
          <h2 style="text-align:center;">🧾 ORDER INVOICE</h2>
          <hr/>

          <h3>Order Details</h3>
          <p><b>Order ID:</b> ${order_id}</p>
          <p><b>Customer Name:</b> ${username}</p>
          <p><b>Phone:</b> ${phone}</p>

          <hr/>

          <h3>Items Purchased</h3>

          <table width="100%" border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse;">
            <tr style="background-color: #f2f2f2;">
  <th>S.No</th>
  <th>Product</th>
  <th>Category</th>
  <th>Qty</th>
  <th>Price</th>
  <th>Total</th>
</tr>
            ${itemsHtml}
          </table>

          <br/>

          <h3 style="text-align:right;">
            Grand Total: ₹${total_amount}
          </h3>

          <hr/>

          <p style="text-align:center; color: gray;">
            This is an automated order notification.
          </p>

        </div>
      `
    });

    console.log("✅ Invoice email sent to admin");
  } catch (error) {
    console.error("❌ Email Error:", error);
  }
};