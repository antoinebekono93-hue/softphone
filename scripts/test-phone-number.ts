import {
  canonicalizePhoneNumber,
  phoneNumberLookupCandidates,
} from "../lib/phone-number";

let failures = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures++;
    console.error(`✗ ${name}`);
  }
}

const cameroon = "+237612345678";

check("E.164 Cameroon stays canonical", canonicalizePhoneNumber(cameroon) === cameroon);
check("bare Cameroon uses +237", canonicalizePhoneNumber("237612345678") === cameroon);
check("00 Cameroon uses +237", canonicalizePhoneNumber("00237612345678") === cameroon);
check("human separators are accepted", canonicalizePhoneNumber("+237 612-345-678") === cameroon);
check("legacy ten-digit NANP uses +1", canonicalizePhoneNumber("4155552671") === "+14155552671");
check("unknown bare international input is rejected", canonicalizePhoneNumber("33142536470") === null);
check("extensions are rejected", canonicalizePhoneNumber("+237612345678x42") === null);
check(
  "lookup recognizes canonical and legacy Cameroon values",
  JSON.stringify(phoneNumberLookupCandidates("00237612345678")) ===
    JSON.stringify([cameroon, "237612345678", "00237612345678"]),
);

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log("Phone number canonicalization checks passed.");
}
