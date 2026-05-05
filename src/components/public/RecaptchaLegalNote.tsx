export function RecaptchaLegalNote() {
  return (
    <p className="mt-3 font-sans text-xs text-[#888]">
      Protected by reCAPTCHA —{" "}
      <a
        href="https://policies.google.com/privacy"
        className="underline hover:text-[#555]"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy
      </a>{" "}
      &{" "}
      <a
        href="https://policies.google.com/terms"
        className="underline hover:text-[#555]"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms
      </a>
    </p>
  );
}
