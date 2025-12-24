import { EmailBuilder } from "@/components/EmailBuilder";
import { PopupBridge } from "@/components/auth/popup-bridge";

export default function BuilderPage() {
  return (
    <>
      <PopupBridge />
      <EmailBuilder />
    </>
  );
}

