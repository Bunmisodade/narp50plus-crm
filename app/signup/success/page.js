export default function SignupSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="bg-white p-8 rounded-md w-full max-w-sm border border-line-strong text-center">
        <h1 className="text-xl mt-0">Payment received</h1>
        <p className="text-sm text-ink-soft leading-relaxed mt-3">
          We&rsquo;re setting up your cooperative now. Check your email in the next couple of minutes
          for your sign-in link and invite code.
        </p>
        <p className="text-xs text-ink-soft/80 mt-4">
          Didn&rsquo;t get anything after a few minutes? Check spam, or reach out and we&rsquo;ll sort it out.
        </p>
      </div>
    </div>
  );
}
