import Link from "next/link";

export default function TermsPage() {
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

        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This is a placeholder Terms page. Replace this content with your official terms.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Use of the service</h2>
            <p className="text-muted-foreground">
              By using this service, you agree to comply with applicable laws and not misuse the product.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your credentials and for activity under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Contact</h2>
            <p className="text-muted-foreground">
              If you have questions, contact support with your account email and a description of the issue.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}


