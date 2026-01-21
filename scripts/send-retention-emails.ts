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
  {
    "id": "aca47d94-a420-4d43-944d-65eadba202a8",
    "email": "zil.egor2005@gmail.com"
  },
  {
    "id": "0794b002-4600-4c7e-b2a4-f53678c14627",
    "email": "yu.and.gus@gmail.com"
  },
  {
    "id": "69d1a0a7-d1e4-46eb-b9a9-55a6fe4f3259",
    "email": "maiklggg.ggg@gmail.com"
  },
  {
    "id": "852b5118-cde9-4126-9bfc-a5904f49413a",
    "email": "shmsckov.t@gmail.com"
  },
  {
    "id": "c646cdbd-3af7-4cf8-b3e2-c8d03f2e4f8c",
    "email": "igorgoracev766@gmail.com"
  },
  {
    "id": "01e2ba5f-f394-4208-b9a1-ffd6a3dfda4b",
    "email": "maksimkezik55@gmail.com"
  },
  {
    "id": "16cb7d6d-aa35-4abc-bf19-94f762e896f4",
    "email": "very1386@gmail.com"
  },
  {
    "id": "5aacc241-8776-41f8-8bc8-ff99f7294774",
    "email": "nattozetive@gmail.com"
  },
  {
    "id": "bd3d55bc-b516-489f-92e3-2bbbc8a3d4e5",
    "email": "lrkbolrkbo@gmail.com"
  },
  {
    "id": "3bf44913-70ad-464d-8c6c-871a149bdae5",
    "email": "arampetrosyan800@gmail.com"
  },
  {
    "id": "a4bb7579-e7c0-4db6-9d64-f5336ff6f881",
    "email": "daria.ponomareva.bb@gmail.com"
  },
  {
    "id": "4a5e6867-72df-487a-96c6-49c20535a507",
    "email": "kristinacackova1@gmail.com"
  },
  {
    "id": "606be859-1b5c-44cf-a446-acb10e633afa",
    "email": "xacanxocon@gmail.com"
  },
  {
    "id": "af257773-4d07-42d5-a2aa-65f3c28bfc14",
    "email": "varlashinatori@gmail.com"
  },
  {
    "id": "23b3e90b-495f-40f4-af1e-81665239206c",
    "email": "den479725@gmail.com"
  },
  {
    "id": "73f02789-c485-4f6c-85c9-13fcaebd0944",
    "email": "photo.dudaeva.mafiarooms@gmail.com"
  },
  {
    "id": "62dfc54b-48ac-4fe9-a1e4-b20cb29d0397",
    "email": "nourxnour003@gmail.com"
  },
  {
    "id": "a3e6304b-4107-4a23-bbb6-72b7d37b5bec",
    "email": "martinact@seznam.cz"
  },
  {
    "id": "54272a33-dbc2-4539-b320-303b53dfbc7d",
    "email": "nora.sneg@gmail.com"
  },
  {
    "id": "28f19969-9f4b-47b1-a142-05503c41db27",
    "email": "muhammadmurtuzov332@gmail.com"
  },
  {
    "id": "ea4456d5-9c52-4f18-b4b3-6642f6e119db",
    "email": "octamarketplace@gmail.com"
  },
  {
    "id": "e7aa8d50-75f3-45f7-8899-e3fe5e91ea8b",
    "email": "kingtuner768@gmail.com"
  },
  {
    "id": "509cf0c9-1277-4f55-896f-1d8fff2e2118",
    "email": "yamakinmike@gmail.com"
  },
  {
    "id": "8bc1f12c-4347-4cb7-a725-68b5b99993f8",
    "email": "eggplantblack04@gmail.com"
  },
  {
    "id": "c6c1b76a-14e0-420b-85f5-236e6638b362",
    "email": "queuyennguyenhuu@gmail.com"
  },
  {
    "id": "2487d2d3-07ab-4c2f-87cd-90d245191085",
    "email": "ardasovsergej60@gmail.com"
  },
  {
    "id": "b94faad3-9d93-45c8-8274-856d3c13129b",
    "email": "lmayzer2008@gmail.com"
  },
  {
    "id": "a7334f43-4ba9-4813-9b25-12ef1c65a5ad",
    "email": "thirteenthdesiple@gmail.com"
  },
  {
    "id": "fa68db33-f90e-4bff-8c4a-a521e9b370af",
    "email": "glthrowaway6@gmail.com"
  },
  {
    "id": "e502a652-d6b0-4427-a337-2c20f7d8d3ed",
    "email": "goatw132@gmail.com"
  },
  {
    "id": "55032f7e-d428-4696-9b0e-3c94d56fe869",
    "email": "sasha.scherban11@gmail.com"
  },
  {
    "id": "6880b5d7-c845-4e46-a718-b957933ffb9e",
    "email": "anastasialessna@gmail.com"
  },
  {
    "id": "0999d6f2-11f7-4e55-9e79-b9d5ba1e03a5",
    "email": "makarmakarov507@gmail.com"
  },
  {
    "id": "213f714f-7d16-4cb3-9d75-60f3d693dbba",
    "email": "irina.rud.21.08@gmail.com"
  },
  {
    "id": "54bd5b66-6c55-4cef-ac22-9901cdc82f81",
    "email": "svistunovs450@gmail.com"
  },
  {
    "id": "01a4610b-4b98-492b-851b-475a8ca07892",
    "email": "frencio65@gmail.com"
  },
  {
    "id": "361e2ad9-955a-4b09-86f7-0c00dce0cb03",
    "email": "ruizrob29@gmail.com"
  }
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
      await delay(600);
    } catch (error) {
      console.error(`Failed to send to ${user.email}`, error);
    }
  }
};

run().catch((error) => {
  console.error("Unexpected error sending retention emails.", error);
  process.exit(1);
});
