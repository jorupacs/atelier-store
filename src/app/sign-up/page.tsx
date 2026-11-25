import type { Metadata } from "next";

import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = {
  title: "Create account | Atelier",
  robots: { index: false },
};

export default function SignUpPage(props: PageProps<"/sign-up">) {
  return (
    <AuthPage
      mode="sign-up"
      title="Create account"
      description="Create an account with your email address."
      searchParams={props.searchParams}
    />
  );
}
