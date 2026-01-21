import dotenv from "dotenv";
import path from "path";
import { Resend } from "resend";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { RESEND_API_KEY, RESEND_FROM } = process.env;

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY environment variable.");
  process.exit(1);
}

if (!RESEND_FROM) {
  console.error("Missing RESEND_FROM environment variable.");
  process.exit(1);
}

type User = {
  id: string;
  email: string;
};

const USERS: User[] = [    
  // {
  //   id: "e4cf4d44-17a6-4cff-92ba-3fd8429ecf09",
  //   email: "fifyriowill@gmail.com"
  // }
];

const resend = new Resend(RESEND_API_KEY);
const SUBJECT = process.env.RETENTION_SUBJECT ?? "Quick question from Will";
const DRY_RUN = process.argv.includes("--dry-run");
const BASIC_PROMO_CODE = "PRO10OFF";
const MAX_PROMO_CODE = "WELCOME50";

const buildText = () => {
  return [
    "Hiii!",
    "",
    "Will here! manually typing this because I really wanna hear your thoughts on easynanobanana :D",
    "",
    "is it helping with what you're working on? anything missing that would make your life easier??",
    "",
    "don't worry about being too honest - we can take it!! :D",
    "",
    `P.S. if you want to give it another spin, here are two thank-you codes:`,
    `${BASIC_PROMO_CODE} for Basic Plan (10 off)`,
    `${MAX_PROMO_CODE} for Max Plan (50 off)`,
    "",
    "If you want to peek at plans first, here’s the pricing page: https://www.easynanobanana.com/pricing",
    "",
    "lemme know!"
  ].join("\n");
};

const buildHtml = () => {
  return `
    <div style="margin:0;padding:0;background:#FFFBEA;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFBEA;">
        <tr>
          <td align="center" style="padding:36px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #FFE7A1;border-radius:32px;box-shadow:0 25px 70px rgba(247,201,72,0.2);overflow:hidden;">
              <tr>
                <td style="padding:28px 32px;background:linear-gradient(180deg,#FFFFFF 0%,#FFF7DA 100%);">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#FFF3B2;border-radius:999px;">
                    <tr>
                      <td style="padding:8px 16px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width:32px;height:32px;border-radius:16px;background:#FFD84D;color:#111827;font-weight:700;text-align:center;vertical-align:middle;font-size:14px;line-height:32px;">
                              W
                            </td>
                            <td style="padding-left:12px;color:#8C6A00;font-weight:600;font-size:14px;">
                              A quick favor?
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:18px 0 0 0;font-size:26px;line-height:1.3;color:#0f172a;font-weight:600;">
                    Hiii!
                  </h1>
                  <p style="margin:12px 0 0 0;font-size:16px;line-height:1.7;color:#475569;">
                    Will here! manually typing this because I really wanna hear your thoughts on easynanobanana :D
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;">
                  <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;color:#475569;">
                    is it helping with what you're working on? anything missing that would make your life easier??
                  </p>
                  <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#475569;">
                    don't worry about being too honest - we can take it!! :D
                  </p>
                  <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#475569;">
                    If you want to peek at plans first, here’s the pricing page:
                    <a href="https://www.easynanobanana.com/pricing" style="color:#C69312;text-decoration:underline;">https://www.easynanobanana.com/pricing</a>
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFFBF0;border:1px solid #FFE7A1;border-radius:20px;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#C69312;font-weight:600;">
                          thank you code
                        </div>
                        <div style="margin-top:8px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.08em;">
                          ${BASIC_PROMO_CODE}
                        </div>
                        <div style="margin-top:8px;font-size:14px;color:#64748b;">
                          Basic Plan (10 off).
                        </div>
                        <div style="margin-top:14px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.08em;">
                          ${MAX_PROMO_CODE}
                        </div>
                        <div style="margin-top:8px;font-size:14px;color:#64748b;">
                          Max Plan (50 off).
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0 0;font-size:16px;line-height:1.7;color:#475569;">
                    lemme know!
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px 32px 32px;background:#FFF7DA;">
                  <div style="font-size:12px;color:#94a3b8;">Sent by Will at easynanobanana</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const sendEmail = async (user: User) => {
  const payload = {
    from: RESEND_FROM,
    to: user.email,
    subject: SUBJECT,
    html: buildHtml(),
    text: buildText(),
    tags: [{ name: "campaign", value: "retention-feedback" }],
    headers: {
      "X-User-Id": user.id
    }
  };

  if (DRY_RUN) {
    console.log(`[dry-run] Would send to ${user.email}`, payload);
    return;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`Sent to ${user.email} (${user.id})`, data?.id ? `id=${data.id}` : "");
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const run = async () => {
  for (const user of USERS) {
    try {
      await sendEmail(user);
      await delay(1000);
    } catch (error) {
      console.error(`Failed to send to ${user.email}`, error);
    }
  }
};

run().catch((error) => {
  console.error("Unexpected error sending retention emails.", error);
  process.exit(1);
});
