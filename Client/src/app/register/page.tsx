"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push("/"); // Redirect if already logged in
    }
  }, [user, router]);

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      // Log the registration data for debugging
      console.log("Registration form values:", values);

      // Pass all fields to register function
      const success = await register(
        values.name,
        values.email,
        values.password,
        values.role
      );

      if (success) {
        toast({
          title: "Registration successful",
          description: "Welcome to Midnight Musings!",
          variant: "success",
        });
        router.push("/");
      } else {
        toast({
          title: "Registration failed",
          description: "This email may already be registered or there was a server error.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during registration.",
        variant: "destructive",
      });
    }
  };

  if (user) return null; // Avoid rendering form if redirecting

  return <AuthForm mode="register" onSubmit={handleRegister} loading={authLoading} />;
}
