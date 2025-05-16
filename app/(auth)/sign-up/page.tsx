import AuthForm from "@/components/AuthForm";

/* Full-page flexbox keeps the form perfectly centred */
const Page = () => (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <AuthForm type="sign-up" />
    </main>
);

export default Page;
