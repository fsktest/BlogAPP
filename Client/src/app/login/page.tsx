"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push("/"); // Redirect if already logged in
    }
  }, [user, router]);

  const handleLogin = async (values: LoginFormValues) => {
    try {
      console.log("Attempting to log in with email:", values.email);

      // Try the login function
      const success = await login(values.email, values.password);

      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
          variant: "success",
        });
        router.push("/"); // Redirect to home after successful login
      } else {
        toast({
          title: "Login failed",
          description: "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      // More specific error handling
      let errorMessage =
        "An unexpected error occurred. Please try again later.";

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage =
          "Unable to connect to the server. Please check if the server is running and try again.";
      } else if (
        error instanceof SyntaxError &&
        error.message.includes("Unexpected token")
      ) {
        // Handle JSON parse error
        errorMessage =
          "The server returned an invalid response. This could be due to server issues or incorrect API configuration.";
        console.error(
          "Invalid response format. The server might be returning HTML instead of JSON."
        );
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (user) return null; // Avoid rendering form if redirecting

  return <AuthForm mode="login" onSubmit={handleLogin} loading={authLoading} />;
}
