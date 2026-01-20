import dotenv from "dotenv";
import path from "path";

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
  //   id: "fa7e20b2-be96-450c-ab3e-10cbf4b18c58",
  //   email: "angelivanova0606@gmail.com"
  // },
  // {
  //   id: "f021a1cf-09bd-4ec8-bb8d-3117523dde59",
  //   email: "marinaprontiseva@gmail.com"
  // },
  // {
  //   id: "97b38f60-2894-400b-a9f7-86d05e7a4884",
  //   email: "natasha.shnitkovskaya1991@gmail.com"
  // },
  // {
  //   id: "e4cf4d44-17a6-4cff-92ba-3fd8429ecf09",
  //   email: "lakkiluk12@gmail.com"
  // }
  {
    id: "e4cf4d44-17a6-4cff-92ba-3fd8429ecf09",
    email: "fifyriowill@gmail.com"
  }
];

const SUBJECT = process.env.RETENTION_SUBJECT ?? "Quick question from Will";
const DRY_RUN = process.argv.includes("--dry-run");

const PROMO_CODE = "WELCOME50";

const buildText = () => {
  return [
    "Hiii!",
    "",
    "Will here! manually typing this because I really wanna hear your thoughts on screensdesign :D",
    "",
    "is it helping with what you're working on? anything missing that would make your life easier??",
    "",
    "don't worry about being too honest - we can take it!! :D",
    "",
    `P.S. here's a thank-you code if you want to give it another spin: ${PROMO_CODE}`,
    "",
    "lemme know!"
  ].join("\n");
};

const sendEmail = async (user: User) => {
  const payload = {
    from: RESEND_FROM,
    to: [user.email],
    subject: SUBJECT,
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { id?: string };
  console.log(`Sent to ${user.email} (${user.id})`, data.id ? `id=${data.id}` : "");
};

const run = async () => {
  for (const user of USERS) {
    try {
      await sendEmail(user);
    } catch (error) {
      console.error(`Failed to send to ${user.email}`, error);
    }
  }
};

run().catch((error) => {
  console.error("Unexpected error sending retention emails.", error);
  process.exit(1);
});
