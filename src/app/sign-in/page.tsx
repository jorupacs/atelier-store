import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Sign in | Atelier",
  robots: { index: false },
};

export default function SignInPage(props: PageProps<"/sign-in">) {
  return (
    <AuthPage
      mode="sign-in"
      title="Sign in"
      description="Welcome back. Sign in to view your account."
      searchParams={props.searchParams}
    />
  );
}
