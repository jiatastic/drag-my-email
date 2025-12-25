import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Back to login
          </Link>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This is a placeholder Privacy Policy page. Replace this content with your official policy.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">What we collect</h2>
            <p className="text-muted-foreground">
              We may collect account information (like email) and usage data necessary to provide the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">How we use data</h2>
            <p className="text-muted-foreground">
              We use data to authenticate users, operate the product, improve reliability, and support customer requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">Your choices</h2>
            <p className="text-muted-foreground">
              You can request access, correction, or deletion of your data subject to applicable laws and product constraints.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}


